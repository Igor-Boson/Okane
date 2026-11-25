import { registerSW } from 'virtual:pwa-register';

const CHAVE = 'okane-atualizado';

/**
 * Atualizações (docs/03, A6): a versão nova baixa em segundo plano e entra
 * quando o app vai pro fundo, sem interromper um registro no meio.
 */
export function registrarAtualizacao() {
  if (import.meta.env.DEV || !('serviceWorker' in navigator)) return;
  let precisa = false;
  const atualizar = registerSW({
    onNeedRefresh() { precisa = true; },
    onRegisteredSW(_url, registro) {
      if (registro) setInterval(() => { void registro.update(); }, 60 * 60 * 1000);
    },
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && precisa) {
      try { sessionStorage.setItem(CHAVE, '1'); } catch { /* sem sessionStorage */ }
      void atualizar(true);
    }
  });
}

/** Acabou de atualizar? (mostra "Okane atualizado" uma vez) */
export function acabouDeAtualizar(): boolean {
  try {
    const v = sessionStorage.getItem(CHAVE);
    sessionStorage.removeItem(CHAVE);
    return v === '1';
  } catch {
    return false;
  }
}
