/**
 * Tipos do domínio do Okane.
 * Dinheiro sempre em centavos inteiros. Datas sempre como texto local 'AAAA-MM-DD'.
 */

/** Valor em centavos (inteiro). 2000 = R$ 20,00. */
export type Centavos = number;
/** Data local no formato 'AAAA-MM-DD'. */
export type DataISO = string;
/** Mês no formato 'AAAA-MM'. */
export type MesISO = string;

export type Tom = 'fofo' | 'sem';
export type Status = 'folga' | 'limite' | 'passou';

export interface Gasto {
  id: string;
  data: DataISO;
  valor: Centavos;
  descricao: string;
  categoriaId: string;
  /** Resposta do "valeu a pena?": true, false ou null (sem resposta). */
  valeu: boolean | null;
  /** Momento em que foi registrado (ms desde 1970). Usado pra sugestão por horário. */
  criadoEm: number;
  alteradoEm?: number;
}

export interface DiaSemGasto {
  data: DataISO;
  criadoEm: number;
}

export interface Categoria {
  id: string;
  nome: string;
  emoji: string;
  /** Essencial não pergunta "valeu a pena?". */
  essencial: boolean;
  ordem: number;
  arquivada: boolean;
}

export interface Atalho {
  id: string;
  descricao: string;
  valor: Centavos;
  categoriaId: string;
}

export interface ItemFixo {
  id: string;
  nome: string;
  valor: Centavos;
}

export interface PlanoMes {
  mes: MesISO;
  salario: Centavos;
  fixos: ItemFixo[];
  metaGuardar: Centavos;
}

export interface Parcela {
  id: string;
  nome: string;
  /** Valor de cada parcela. */
  valor: Centavos;
  /** Mês da primeira parcela. */
  primeiroMes: MesISO;
  /** Quantidade total de parcelas. */
  total: number;
}

export interface EntradaExtra {
  id: string;
  mes: MesISO;
  descricao: string;
  valor: Centavos;
  /** Quanto dessa entrada foi liberado pros gastos do mês. O resto vai pro guardado. */
  liberado: Centavos;
}

export interface FechamentoSemana {
  /** Segunda-feira da semana fechada. */
  semana: DataISO;
  decisao: 'guardar' | 'frente' | 'automatico';
  /** Valor guardado (decisão 'guardar') ou sobra informativa. */
  valor: Centavos;
  /** Respostas atrasadas de "valeu a pena?" já foram oferecidas. */
  criadoEm: number;
}

export interface MesFechado {
  mes: MesISO;
  /** Resposta livre da 4ª pergunta do Kakeibo: "como posso melhorar?". */
  nota: string;
  criadoEm: number;
}

export interface Desejo {
  id: string;
  nome: string;
  valor: Centavos;
  criadoEm: number;
  /** Dias de quarentena antes de poder comprar sem culpa. */
  quarentenaDias: number;
  status: 'esperando' | 'comprado' | 'desistiu';
  resolvidoEm?: number;
}

/** Tudo que o motor de regras precisa pra calcular. */
export interface Dados {
  gastos: Gasto[];
  diasSemGasto: DiaSemGasto[];
  planos: PlanoMes[];
  parcelas: Parcela[];
  extras: EntradaExtra[];
  fechamentos: FechamentoSemana[];
  /** Primeiro dia de uso do app. Antes disso não existem gastos. */
  inicio: DataISO;
}
