import { describe, expect, it } from 'vitest';
import { tratarBackup, type KVMinimo } from './backup';

class KVFalso implements KVMinimo {
  dados = new Map<string, { valor: ArrayBuffer; ttl?: number }>();
  async get(chave: string) { return this.dados.get(chave)?.valor ?? null; }
  async put(chave: string, valor: ArrayBuffer, opcoes?: { expirationTtl?: number }) { this.dados.set(chave, { valor, ttl: opcoes?.expirationTtl }); }
  async list({ prefix }: { prefix: string }) { return { keys: [...this.dados.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })) }; }
}

const ID = 'a'.repeat(64);
const blob = (n = 40) => { const b = new Uint8Array(n); b.set([0x4f, 0x4b, 0x42, 0x31]); b[20] = n; return b; };
const put = (kv: KVMinimo, corpo: Uint8Array, agora = new Date('2026-11-25T12:00:00Z')) =>
  tratarBackup(new Request('https://x/api/backup/' + ID, { method: 'PUT', body: corpo as BodyInit }), kv, [ID], agora);
const get = (kv: KVMinimo, rota: string[]) => tratarBackup(new Request('https://x/api/backup/' + rota.join('/')), kv, rota);

describe('servidor de backup', () => {
  it('grava e devolve o último backup', async () => {
    const kv = new KVFalso();
    expect((await get(kv, [ID])).status).toBe(404);
    expect((await put(kv, blob(40))).status).toBe(200);
    expect((await put(kv, blob(50))).status).toBe(200);
    const r = await get(kv, [ID]);
    expect(r.status).toBe(200);
    expect(r.headers.get('cache-control')).toBe('no-store');
    expect(new Uint8Array(await r.arrayBuffer())[20]).toBe(50);
  });

  it('guarda 1 cópia por dia com validade de 8 dias', async () => {
    const kv = new KVFalso();
    await put(kv, blob(40), new Date('2026-11-24T10:00:00Z'));
    await put(kv, blob(41), new Date('2026-11-25T10:00:00Z'));
    await put(kv, blob(42), new Date('2026-11-25T18:00:00Z')); // mesmo dia: não sobrescreve a cópia diária
    const dias = await (await get(kv, [ID, 'dias'])).json() as { dias: string[] };
    expect(dias.dias).toEqual(['2026-11-25', '2026-11-24']);
    expect(kv.dados.get(`b:${ID}:dia:2026-11-25`)?.ttl).toBe(8 * 86400);
    const copia = await get(kv, [ID, 'dia', '2026-11-25']);
    expect(new Uint8Array(await copia.arrayBuffer())[20]).toBe(41);
  });

  it('recusa endereço inválido, lixo e tamanho exagerado', async () => {
    const kv = new KVFalso();
    expect((await get(kv, ['abc'])).status).toBe(400);
    expect((await put(kv, new Uint8Array(40))).status).toBe(400);
    const grande = blob(4 * 1024 * 1024 + 1);
    expect((await put(kv, grande)).status).toBe(413);
    expect((await tratarBackup(new Request('https://x', { method: 'DELETE' }), kv, [ID])).status).toBe(405);
  });
});
