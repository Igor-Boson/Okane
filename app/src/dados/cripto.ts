/*
 * Backup criptografado no celular (docs/03, A5).
 * Um código de recuperação gera duas coisas via HKDF: o endereço do backup (id) e a chave AES-GCM.
 * O servidor só vê bytes cifrados.
 */

/** Base32 de Crockford: sem I, L, O, U (evita confusão ao digitar). */
const ALFABETO = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const TAMANHO = 20; // 20 × 5 bits = 100 bits
const MAGICO = [0x4f, 0x4b, 0x42, 0x31]; // "OKB1"
const enc = new TextEncoder();

/** Novo código no formato "XXXXX-XXXXX-XXXXX-XXXXX". */
export function gerarCodigo(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(TAMANHO));
  const chars = Array.from(bytes, b => ALFABETO[b & 31]);
  return [0, 5, 10, 15].map(i => chars.slice(i, i + 5).join('')).join('-');
}

/** Aceita o código digitado de qualquer jeito (minúsculas, espaços, O no lugar de 0...). null se inválido. */
export function normalizarCodigo(texto: string): string | null {
  const limpo = texto.toUpperCase().replace(/[\s-]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
  if (limpo.length !== TAMANHO || [...limpo].some(c => !ALFABETO.includes(c))) return null;
  return [0, 5, 10, 15].map(i => limpo.slice(i, i + 5)).join('-');
}

const hex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');

export interface Chaves { id: string; chave: CryptoKey }

export async function derivarChaves(codigo: string): Promise<Chaves> {
  const normal = normalizarCodigo(codigo);
  if (!normal) throw new Error('Código de recuperação inválido');
  const material = await crypto.subtle.importKey('raw', enc.encode(normal), 'HKDF', false, ['deriveBits', 'deriveKey']);
  const salt = enc.encode('okane-backup-v1');
  const idBits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info: enc.encode('id') }, material, 256);
  const chave = await crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt, info: enc.encode('chave') }, material,
    { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
  );
  return { id: hex(idBits), chave };
}

async function transformar(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

const temCompressao = () => typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';

/** Formato: "OKB1" + flags (1 byte: bit 0 = gzip) + iv (12 bytes) + texto cifrado. O cabeçalho é autenticado. */
export async function cifrar(chave: CryptoKey, dados: Uint8Array): Promise<Uint8Array> {
  const gzip = temCompressao();
  const corpo = gzip ? await transformar(dados, new CompressionStream('gzip')) : dados;
  const cabecalho = new Uint8Array([...MAGICO, gzip ? 1 : 0]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cifrado = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: cabecalho }, chave, corpo as BufferSource));
  const out = new Uint8Array(cabecalho.length + iv.length + cifrado.length);
  out.set(cabecalho, 0); out.set(iv, cabecalho.length); out.set(cifrado, cabecalho.length + iv.length);
  return out;
}

export async function decifrar(chave: CryptoKey, blob: Uint8Array): Promise<Uint8Array> {
  if (blob.length < 17 || MAGICO.some((b, i) => blob[i] !== b)) throw new Error('Arquivo de backup inválido');
  const cabecalho = blob.slice(0, 5);
  const iv = blob.slice(5, 17);
  let claro: Uint8Array;
  try {
    claro = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: cabecalho }, chave, blob.slice(17)));
  } catch {
    throw new Error('Não deu pra abrir o backup com esse código');
  }
  return cabecalho[4] & 1 ? transformar(claro, new DecompressionStream('gzip')) : claro;
}

export const ehBlobDeBackup = (b: Uint8Array) => b.length >= 17 && MAGICO.every((x, i) => b[i] === x);
