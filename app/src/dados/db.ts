import Dexie, { type Table } from 'dexie';
import type {
  Atalho, Categoria, DataISO, Desejo, DiaSemGasto, EntradaExtra, FechamentoSemana, Gasto, MesFechado, Parcela, PlanoMes, Tom,
} from '../dominio/tipos';

/** Ajustes do app (uma linha só, chave 'principal'). */
export interface Ajustes {
  nomePet: string;
  tom: Tom;
  /** Primeiro dia de uso. null = primeiro uso ainda não concluído. */
  inicio: DataISO | null;
  /** Código de recuperação (backup). */
  codigo: string | null;
  ultimoBackupEm: number | null;
  backupErro: string | null;
  ultimoArquivoEm: number | null;
  /** Horas trabalhadas por mês, pro "custo em horas". 0 = desligado. */
  horasPorMes: number;
  /** Atalhos aprendidos que você escondeu (chave descrição|valor|categoria). */
  atalhosOcultos: string[];
  /** Último dia em que o "check de ontem" foi mostrado. */
  ultimoCheckOntem: DataISO | null;
  /** Último nível já comemorado. */
  nivelVisto: number;
  /** Usar no navegador mesmo sem instalar. */
  semInstalar: boolean;
  /** Lançamentos do extrato que você mandou ignorar na conferência. */
  extratoIgnorados: string[];
}

export const AJUSTES_PADRAO: Ajustes = {
  nomePet: 'Moedinha',
  tom: 'fofo',
  inicio: null,
  codigo: null,
  ultimoBackupEm: null,
  backupErro: null,
  ultimoArquivoEm: null,
  horasPorMes: 0,
  atalhosOcultos: [],
  ultimoCheckOntem: null,
  nivelVisto: 1,
  semInstalar: false,
  extratoIgnorados: [],
};

interface LinhaAjustes { chave: string; valor: Ajustes }

export class OkaneDB extends Dexie {
  gastos!: Table<Gasto, string>;
  diasSemGasto!: Table<DiaSemGasto, string>;
  categorias!: Table<Categoria, string>;
  atalhos!: Table<Atalho, string>;
  planos!: Table<PlanoMes, string>;
  parcelas!: Table<Parcela, string>;
  extras!: Table<EntradaExtra, string>;
  fechamentos!: Table<FechamentoSemana, string>;
  meses!: Table<MesFechado, string>;
  desejos!: Table<Desejo, string>;
  ajustes!: Table<LinhaAjustes, string>;

  constructor(nome = 'okane') {
    super(nome);
    this.version(1).stores({
      gastos: 'id, data',
      diasSemGasto: 'data',
      categorias: 'id',
      atalhos: 'id',
      planos: 'mes',
      parcelas: 'id',
      extras: 'id, mes',
      fechamentos: 'semana',
      meses: 'mes',
      desejos: 'id',
      ajustes: 'chave',
    });
  }
}

export const TABELAS = ['gastos', 'diasSemGasto', 'categorias', 'atalhos', 'planos', 'parcelas', 'extras', 'fechamentos', 'meses', 'desejos', 'ajustes'] as const;
export type NomeTabela = typeof TABELAS[number];

/** Cópia completa dos dados (backup e exportação). */
export interface Snapshot {
  formato: 'okane';
  versao: 1;
  criadoEm: number;
  tabelas: Record<NomeTabela, unknown[]>;
}

export async function exportarTudo(db: OkaneDB): Promise<Snapshot> {
  const tabelas = {} as Record<NomeTabela, unknown[]>;
  await db.transaction('r', TABELAS.map(t => db.table(t)), async () => {
    for (const t of TABELAS) tabelas[t] = await db.table(t).toArray();
  });
  return { formato: 'okane', versao: 1, criadoEm: Date.now(), tabelas };
}

export function validarSnapshot(x: unknown): x is Snapshot {
  if (!x || typeof x !== 'object') return false;
  const s = x as Partial<Snapshot>;
  return s.formato === 'okane' && s.versao === 1 && !!s.tabelas && TABELAS.every(t => Array.isArray(s.tabelas![t] ?? []));
}

/** Substitui todos os dados pelos do snapshot. */
export async function importarTudo(db: OkaneDB, snap: Snapshot): Promise<void> {
  await db.transaction('rw', TABELAS.map(t => db.table(t)), async () => {
    for (const t of TABELAS) {
      await db.table(t).clear();
      const linhas = snap.tabelas[t] ?? [];
      if (linhas.length) await db.table(t).bulkPut(linhas);
    }
  });
}

export async function lerAjustes(db: OkaneDB): Promise<Ajustes> {
  const linha = await db.ajustes.get('principal');
  return { ...AJUSTES_PADRAO, ...(linha?.valor ?? {}) };
}

export async function gravarAjustes(db: OkaneDB, a: Ajustes): Promise<void> {
  await db.ajustes.put({ chave: 'principal', valor: a });
}
