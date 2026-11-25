/*
 * Servidor de backup (Cloudflare Pages Function + KV). docs/03, A5.
 * Guarda blobs já cifrados no celular. Não sabe ler nada.
 *
 *   PUT /api/backup/:id            grava o último backup (+ 1 cópia por dia, guardada por 8 dias)
 *   GET /api/backup/:id            devolve o último
 *   GET /api/backup/:id/dias       lista os dias com cópia
 *   GET /api/backup/:id/dia/:data  devolve a cópia de um dia
 */

/** O pedaço do KV que a gente usa (compatível com KVNamespace da Cloudflare). */
export interface KVMinimo {
  get(chave: string, tipo: 'arrayBuffer'): Promise<ArrayBuffer | null>;
  put(chave: string, valor: ArrayBuffer, opcoes?: { expirationTtl?: number }): Promise<void>;
  list(opcoes: { prefix: string }): Promise<{ keys: { name: string }[] }>;
}

export const TAMANHO_MAXIMO = 4 * 1024 * 1024;
const RETENCAO_DIAS = 8;
const ID = /^[0-9a-f]{64}$/;
const DATA = /^\d{4}-\d{2}-\d{2}$/;
const MAGICO = [0x4f, 0x4b, 0x42, 0x31];

const cabecalhos = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
const json = (corpo: unknown, status = 200) => new Response(JSON.stringify(corpo), { status, headers: { ...cabecalhos, 'content-type': 'application/json' } });
const binario = (dados: ArrayBuffer) => new Response(dados, { headers: { ...cabecalhos, 'content-type': 'application/octet-stream' } });
const erro = (status: number, mensagem: string) => json({ erro: mensagem }, status);

export async function tratarBackup(req: Request, kv: KVMinimo, rota: string[], agora: Date = new Date()): Promise<Response> {
  const [id, sub, data] = rota;
  if (!id || !ID.test(id)) return erro(400, 'Endereço de backup inválido');
  const ultimo = `b:${id}:ultimo`;
  const diaria = (d: string) => `b:${id}:dia:${d}`;

  if (req.method === 'PUT' && rota.length === 1) {
    const tamanho = Number(req.headers.get('content-length') ?? '0');
    if (tamanho > TAMANHO_MAXIMO) return erro(413, 'Backup grande demais');
    const corpo = await req.arrayBuffer();
    if (corpo.byteLength > TAMANHO_MAXIMO) return erro(413, 'Backup grande demais');
    const b = new Uint8Array(corpo);
    if (b.length < 17 || MAGICO.some((x, i) => b[i] !== x)) return erro(400, 'Isso não parece um backup do Okane');
    await kv.put(ultimo, corpo);
    const hoje = agora.toISOString().slice(0, 10);
    if ((await kv.get(diaria(hoje), 'arrayBuffer')) === null) {
      await kv.put(diaria(hoje), corpo, { expirationTtl: RETENCAO_DIAS * 86400 });
    }
    return json({ ok: true, em: agora.getTime() });
  }

  if (req.method === 'GET' && rota.length === 1) {
    const dados = await kv.get(ultimo, 'arrayBuffer');
    return dados ? binario(dados) : erro(404, 'Nenhum backup com esse código');
  }

  if (req.method === 'GET' && sub === 'dias' && rota.length === 2) {
    const lista = await kv.list({ prefix: `b:${id}:dia:` });
    return json({ dias: lista.keys.map(k => k.name.slice(-10)).sort().reverse() });
  }

  if (req.method === 'GET' && sub === 'dia' && data && DATA.test(data) && rota.length === 3) {
    const dados = await kv.get(diaria(data), 'arrayBuffer');
    return dados ? binario(dados) : erro(404, 'Sem cópia nesse dia');
  }

  return erro(405, 'Operação não suportada');
}
