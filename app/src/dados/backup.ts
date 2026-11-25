import { cifrar, decifrar, derivarChaves, type Chaves } from './cripto';
import { validarSnapshot, type Snapshot } from './db';
import { estado } from './estado.svelte';

/*
 * Backup automático (docs/03, A5): depois de qualquer mudança, espera 10 s
 * (ou o app ir pro fundo), cifra tudo no celular e manda pro servidor.
 */

const ESPERA_MS = 10_000;
let timer: ReturnType<typeof setTimeout> | null = null;
let pendente = false;
let enviando = false;
let chavesCache: { codigo: string; chaves: Chaves } | null = null;

export type Disponibilidade = 'sim' | 'nao-configurado' | 'offline' | 'desconhecido';
let disponivel: Disponibilidade = 'desconhecido';

async function chaves(codigo: string): Promise<Chaves> {
  if (chavesCache?.codigo === codigo) return chavesCache.chaves;
  const c = await derivarChaves(codigo);
  chavesCache = { codigo, chaves: c };
  return c;
}

/** Pergunta ao servidor se o backup na nuvem está ligado. */
export async function verificarServidor(): Promise<Disponibilidade> {
  try {
    const r = await fetch('/api/saude', { cache: 'no-store' });
    if (!r.ok || !(r.headers.get('content-type') ?? '').includes('json')) return (disponivel = 'nao-configurado');
    const j = await r.json() as { backup?: boolean };
    return (disponivel = j.backup ? 'sim' : 'nao-configurado');
  } catch {
    return (disponivel = 'offline');
  }
}

export const backupDisponivel = () => disponivel;

async function cifrarSnapshot(codigo: string): Promise<{ id: string; blob: Uint8Array }> {
  const snap = await estado.snapshot();
  const { id, chave } = await chaves(codigo);
  const bytes = new TextEncoder().encode(JSON.stringify(snap));
  return { id, blob: await cifrar(chave, bytes) };
}

/** Envia o backup agora. Retorna true se deu certo. */
export async function enviarBackup(opcoes: { aoSair?: boolean } = {}): Promise<boolean> {
  const codigo = estado.ajustes.codigo;
  if (!codigo || !estado.ajustes.inicio) return false;
  if (enviando) { pendente = true; return false; }
  enviando = true;
  pendente = false;
  try {
    if (disponivel === 'desconhecido' || disponivel === 'offline') await verificarServidor();
    if (disponivel !== 'sim') return false;
    const { id, blob } = await cifrarSnapshot(codigo);
    const r = await fetch(`/api/backup/${id}`, {
      method: 'PUT', body: blob as BodyInit, headers: { 'content-type': 'application/octet-stream' },
      keepalive: !!opcoes.aoSair && blob.length < 60_000,
    });
    if (!r.ok) throw new Error(`Servidor respondeu ${r.status}`);
    await estado.ajustar({ ultimoBackupEm: Date.now(), backupErro: null }, true);
    return true;
  } catch (e) {
    await estado.ajustar({ backupErro: e instanceof Error ? e.message : 'Falhou' }, true);
    return false;
  } finally {
    enviando = false;
    if (pendente) agendarBackup();
  }
}

export function agendarBackup() {
  pendente = true;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { timer = null; void enviarBackup(); }, ESPERA_MS);
}

/** Liga o backup automático: depois de mudanças e quando o app vai pro fundo. */
export function ligarBackupAutomatico() {
  estado.aoMudar = agendarBackup;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && pendente) {
      if (timer) clearTimeout(timer);
      timer = null;
      void enviarBackup({ aoSair: true });
    }
  });
  void verificarServidor();
}

/** Baixa e abre o backup de um código (pra restaurar num celular novo). */
export async function baixarBackup(codigo: string, dia?: string): Promise<Snapshot> {
  const { id, chave } = await derivarChaves(codigo);
  const url = dia ? `/api/backup/${id}/dia/${dia}` : `/api/backup/${id}`;
  let r: Response;
  try {
    r = await fetch(url, { cache: 'no-store' });
  } catch {
    throw new Error('Sem conexão. Tenta de novo com internet.');
  }
  if (r.status === 404) throw new Error('Não achei backup com esse código.');
  if (r.status === 503) throw new Error('O backup na nuvem ainda não foi configurado no servidor.');
  if (!r.ok) throw new Error(`O servidor respondeu ${r.status}.`);
  const bytes = await decifrar(chave, new Uint8Array(await r.arrayBuffer()));
  const snap = JSON.parse(new TextDecoder().decode(bytes));
  if (!validarSnapshot(snap)) throw new Error('O backup veio num formato que eu não conheço.');
  return snap;
}

export async function diasDisponiveis(codigo: string): Promise<string[]> {
  const { id } = await derivarChaves(codigo);
  const r = await fetch(`/api/backup/${id}/dias`, { cache: 'no-store' });
  if (!r.ok) return [];
  return ((await r.json()) as { dias: string[] }).dias;
}
