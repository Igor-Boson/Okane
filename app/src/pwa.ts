import { registerSW } from 'virtual:pwa-register';
import { ui } from './ui/ui.svelte';

const CHAVE = 'okane-atualizado';
/** Achou versão nova até X ms depois de abrir (ou voltar pro app) e você ainda não tocou em nada: atualiza na hora. */
const JANELA_DE_ABERTURA = 15_000;
/** Procura versão nova ao voltar pro app, no máximo a cada X ms. */
const INTERVALO_DE_BUSCA = 5 * 60_000;

/**
 * Atualizações (docs/03, A6). A versão nova baixa em segundo plano e entra:
 * - na hora, se chegou logo depois de abrir o app e você ainda não mexeu em nada;
 * - senão, quando o app vai pro fundo (sem interromper um registro no meio),
 *   com um aviso "Atualizar" pra quem quiser já.
 *
 * O iPhone não recarrega o app ao voltar do fundo, então a busca também roda ao voltar.
 */
export function registrarAtualizacao() {
  if (__PREVIA__ || import.meta.env.DEV || !('serviceWorker' in navigator)) return;
  let precisa = false;
  let abertoEm = Date.now();
  let mexeu = false;
  let ultimaBusca = Date.now();
  let registroSW: ServiceWorkerRegistration | undefined;

  const aplicar = () => {
    try { sessionStorage.setItem(CHAVE, '1'); } catch { /* sem sessionStorage */ }
    void atualizar(true);
  };
  const ocupado = () => !!ui.folha || !!ui.amt || !!ui.desc.trim() || ui.ajustesAbertos || ui.conferirAberto;

  const atualizar = registerSW({
    onNeedRefresh() {
      precisa = true;
      if (!mexeu && !ocupado() && Date.now() - abertoEm < JANELA_DE_ABERTURA) return aplicar();
      ui.avisar('Tem versão nova do Okane', { rotulo: 'Atualizar', fazer: aplicar });
    },
    onRegisteredSW(_url, registro) {
      registroSW = registro;
      if (registro) setInterval(() => { void registro.update(); }, 60 * 60 * 1000);
    },
  });

  addEventListener('pointerdown', () => { mexeu = true; }, { capture: true });
  addEventListener('keydown', () => { mexeu = true; }, { capture: true });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (precisa) aplicar();
      return;
    }
    // voltou pro app: conta como abrir de novo
    abertoEm = Date.now();
    mexeu = false;
    if (registroSW && Date.now() - ultimaBusca > INTERVALO_DE_BUSCA) {
      ultimaBusca = Date.now();
      void registroSW.update();
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
