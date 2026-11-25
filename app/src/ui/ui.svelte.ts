import type { DataISO, MesISO } from '../dominio/tipos';

export type Aba = 'inicio' | 'gastos' | 'plano';

export type Folha =
  | { tipo: 'reflexao'; gastoId: string; volta?: boolean; parcelado?: { vezes: number; total: number; parcelaId: string } }
  | { tipo: 'editar'; gastoId: string }
  | { tipo: 'categorias' }
  | { tipo: 'opcoes' }
  | { tipo: 'ontem'; data: DataISO }
  | { tipo: 'semana'; segunda: DataISO }
  | { tipo: 'mes'; mes: MesISO }
  | { tipo: 'pet' };

/** Estado da interface que não vai pro banco. */
class UI {
  aba = $state<Aba>('inicio');
  folha = $state<Folha | null>(null);
  ajustesAbertos = $state(false);
  toast = $state<{ texto: string; acao?: { rotulo: string; fazer: () => void } } | null>(null);
  /** Moedinha comemorando por alguns segundos. */
  comemorando = $state(false);
  /** Fala especial temporária no Início (sobrepõe a fala do humor). */
  falaEspecial = $state<string | null>(null);

  // registro em andamento (Início)
  /** O que foi digitado no teclado ("12,5"). */
  amt = $state('');
  /** Descrição (pode conter o valor: "sorvete 20"). */
  desc = $state('');
  /** Data escolhida pro próximo registro (null = hoje). */
  dataRegistro = $state<DataISO | null>(null);
  /** Parcelar o próximo registro em N vezes (0 = à vista). */
  parcelarEm = $state(0);

  private fila: Folha[] = [];
  private timerToast: ReturnType<typeof setTimeout> | null = null;
  private timerFesta: ReturnType<typeof setTimeout> | null = null;

  abrir(f: Folha) { this.folha = f; }

  /** Coloca na fila: abre quando não houver outra folha aberta. */
  enfileirar(f: Folha) {
    if (this.folha) this.fila.push(f);
    else this.folha = f;
  }

  fechar() {
    this.folha = this.fila.shift() ?? null;
  }

  limparRegistro() {
    this.amt = '';
    this.desc = '';
    this.dataRegistro = null;
    this.parcelarEm = 0;
  }

  avisar(texto: string, acao?: { rotulo: string; fazer: () => void }, ms = 3200) {
    if (this.timerToast) clearTimeout(this.timerToast);
    this.toast = { texto, acao };
    this.timerToast = setTimeout(() => { this.toast = null; }, acao ? 5500 : ms);
  }

  festejar(fala: string | null = null, ms = 6000) {
    if (this.timerFesta) clearTimeout(this.timerFesta);
    this.comemorando = true;
    this.falaEspecial = fala;
    this.timerFesta = setTimeout(() => { this.comemorando = false; this.falaEspecial = null; }, ms);
  }

  dizer(fala: string, ms = 6000) {
    if (this.timerFesta) clearTimeout(this.timerFesta);
    this.comemorando = false;
    this.falaEspecial = fala;
    this.timerFesta = setTimeout(() => { this.falaEspecial = null; }, ms);
  }
}

export const ui = new UI();
