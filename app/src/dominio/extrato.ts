import { diasEntre } from './datas';
import { normalizar } from './sugestao';
import type { Centavos, DataISO, Gasto } from './tipos';

/*
 * Conferência com o extrato do banco (v1): lê OFX ou CSV exportado do app do banco,
 * acha as saídas que não foram registradas e mede a completude (PR-3: ≥ 90%).
 */

export interface Lancamento {
  data: DataISO;
  /** Valor da saída, positivo, em centavos. */
  valor: Centavos;
  descricao: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** "25/11/2026", "25/11/26", "2026-11-25", "20261125..." → '2026-11-25' */
export function lerData(texto: string): DataISO | null {
  const t = texto.trim().replace(/^"|"$/g, '');
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) {
    const ano = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    return `${ano}-${pad(Number(m[2]))}-${pad(Number(m[1]))}`;
  }
  m = t.match(/^(\d{4})(\d{2})(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return null;
}

/** "-1.234,56", "1234.56", "R$ 20,00", "-20" → centavos com sinal. */
export function lerValor(texto: string): number | null {
  let t = texto.trim().replace(/^"|"$/g, '').replace(/r\$\s*/i, '').replace(/\s/g, '');
  if (!t) return null;
  const negativo = t.startsWith('-') || (t.startsWith('(') && t.endsWith(')'));
  t = t.replace(/^[-+(]|\)$/g, '');
  if (/^\d{1,3}(\.\d{3})*,\d{1,2}$/.test(t) || /^\d+,\d{1,2}$/.test(t)) t = t.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(,\d{3})*\.\d{1,2}$/.test(t)) t = t.replace(/,/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  const c = Math.round(parseFloat(t) * 100);
  return negativo ? -c : c;
}

function lerOFX(texto: string): { data: DataISO; valor: number; descricao: string }[] {
  const out: { data: DataISO; valor: number; descricao: string }[] = [];
  const blocos = texto.split(/<STMTTRN>/i).slice(1);
  const campo = (b: string, nome: string) => b.match(new RegExp(`<${nome}>([^<\\r\\n]*)`, 'i'))?.[1]?.trim() ?? '';
  for (const b of blocos) {
    const data = lerData(campo(b, 'DTPOSTED'));
    const valor = lerValor(campo(b, 'TRNAMT'));
    if (!data || valor === null) continue;
    out.push({ data, valor, descricao: campo(b, 'MEMO') || campo(b, 'NAME') || 'Lançamento' });
  }
  return out;
}

function dividirLinhaCSV(linha: string, sep: string): string[] {
  const cols: string[] = [];
  let atual = '';
  let aspas = false;
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (c === '"') { if (aspas && linha[i + 1] === '"') { atual += '"'; i++; } else aspas = !aspas; }
    else if (c === sep && !aspas) { cols.push(atual); atual = ''; }
    else atual += c;
  }
  cols.push(atual);
  return cols.map(x => x.trim());
}

const COLUNAS = {
  data: ['data', 'date', 'data lancamento', 'data do lancamento', 'dt'],
  valor: ['valor', 'amount', 'value', 'valor (r$)', 'quantia'],
  descricao: ['descricao', 'title', 'historico', 'estabelecimento', 'description', 'lancamento', 'memo', 'detalhes'],
};

function lerCSV(texto: string): { linhas: { data: DataISO; valor: number; descricao: string }[]; cartao: boolean } {
  const linhas = texto.replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim());
  if (linhas.length < 2) return { linhas: [], cartao: false };
  const sep = (linhas[0].match(/;/g)?.length ?? 0) > (linhas[0].match(/,/g)?.length ?? 0) ? ';' : linhas[0].includes('\t') ? '\t' : ',';
  const cab = dividirLinhaCSV(linhas[0], sep).map(normalizar);
  const achar = (nomes: string[]) => cab.findIndex(h => nomes.includes(h));
  const iData = achar(COLUNAS.data);
  const iValor = achar(COLUNAS.valor);
  let iDesc = achar(COLUNAS.descricao);
  if (iData < 0 || iValor < 0) return { linhas: [], cartao: false };
  if (iDesc < 0) iDesc = cab.findIndex((_, i) => i !== iData && i !== iValor);
  // fatura de cartão (ex.: date,title,amount) usa valor positivo pra compra
  const cartao = cab.includes('title') && cab.includes('amount');
  const out: { data: DataISO; valor: number; descricao: string }[] = [];
  for (const l of linhas.slice(1)) {
    const cols = dividirLinhaCSV(l, sep);
    const data = lerData(cols[iData] ?? '');
    const valor = lerValor(cols[iValor] ?? '');
    if (!data || valor === null) continue;
    out.push({ data, valor, descricao: (cols[iDesc] ?? '').replace(/^"|"$/g, '') || 'Lançamento' });
  }
  return { linhas: out, cartao };
}

const NAO_E_GASTO = ['pagamento de fatura', 'pagamento recebido', 'transferencia recebida', 'pix recebido', 'resgate', 'aplicacao', 'estorno', 'rendimento', 'salario', 'credito em conta', 'pagamento efetuado'];

/** Lê o arquivo do banco e devolve só as saídas (gastos), com valor positivo. */
export function lerExtrato(texto: string): Lancamento[] {
  const ehOFX = /<OFX>|<STMTTRN>/i.test(texto);
  let brutos: { data: DataISO; valor: number; descricao: string }[];
  let saidaPositiva = false;
  if (ehOFX) brutos = lerOFX(texto);
  else {
    const r = lerCSV(texto);
    brutos = r.linhas;
    if (r.cartao) saidaPositiva = true;
    else {
      // sem pista: se a maioria é positiva, é extrato de cartão (compras positivas)
      const pos = brutos.filter(b => b.valor > 0).length;
      saidaPositiva = pos > brutos.length * 0.7;
    }
  }
  return brutos
    .filter(b => (saidaPositiva ? b.valor > 0 : b.valor < 0))
    .map(b => ({ data: b.data, valor: Math.abs(b.valor), descricao: b.descricao }))
    .filter(b => !NAO_E_GASTO.some(p => normalizar(b.descricao).includes(p)));
}

export const chaveLancamento = (l: Lancamento) => `${l.data}|${l.valor}|${normalizar(l.descricao)}`;

export interface Conferencia {
  /** Lançamentos do período (a partir do início de uso). */
  total: number;
  encontrados: number;
  faltando: Lancamento[];
  /** Saídas que parecem gasto fixo ou parcela (já estão no plano). */
  provaveisFixos: Lancamento[];
  /** % dos lançamentos que já estavam registrados (fixos não contam). */
  completude: number;
}

/**
 * Casa cada saída do extrato com um gasto registrado de mesmo valor e data próxima (±2 dias).
 * O que sobra é o que ficou sem registrar.
 */
export function conferir(lancamentos: Lancamento[], gastos: Gasto[], inicio: DataISO, valoresDoPlano: Centavos[] = [], ignorados: string[] = [], folgaDias = 2): Conferencia {
  const ign = new Set(ignorados);
  const doPeriodo = lancamentos.filter(l => l.data >= inicio && !ign.has(chaveLancamento(l))).sort((a, b) => (a.data < b.data ? -1 : 1));
  const livres = [...gastos].filter(g => g.data >= inicio);
  const usados = new Set<string>();
  const faltando: Lancamento[] = [];
  const provaveisFixos: Lancamento[] = [];
  let encontrados = 0;
  for (const l of doPeriodo) {
    const par = livres
      .filter(g => !usados.has(g.id) && Math.abs(g.valor - l.valor) <= 1 && Math.abs(diasEntre(g.data, l.data)) <= folgaDias)
      .sort((a, b) => Math.abs(diasEntre(a.data, l.data)) - Math.abs(diasEntre(b.data, l.data)))[0];
    if (par) { usados.add(par.id); encontrados++; continue; }
    if (valoresDoPlano.some(v => v > 0 && Math.abs(v - l.valor) <= Math.max(100, v * 0.02))) provaveisFixos.push(l);
    else faltando.push(l);
  }
  const base = encontrados + faltando.length;
  return { total: doPeriodo.length, encontrados, faltando, provaveisFixos, completude: base ? encontrados / base : 1 };
}

const PREFIXOS = [
  /^compra (no|com) (debito|credito|cartao)( -|:)?\s*/i, /^compra cartao( -|:)?\s*/i, /^pix enviado( -|:)?\s*/i, /^transferencia enviada( -|:)?\s*/i,
  /^transferencia (pelo|via) pix( -|:)?\s*/i, /^pagamento de boleto( -|:)?\s*/i, /^debito automatico( -|:)?\s*/i, /^pagamento( -|:)\s*/i,
];
const SUFIXOS = /\s+(ltda|me|eireli|s\.?a\.?|epp)\.?$/i;

/** "Compra no débito - SORVETERIA GELATO LTDA" → "Sorveteria Gelato". */
export function limparDescricao(d: string): string {
  let s = d.normalize('NFC').trim().replace(/\s+/g, ' ');
  const semAcento = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  for (const p of PREFIXOS) {
    const m = semAcento.match(p);
    if (m) { s = s.slice(m[0].length); break; }
  }
  s = s.replace(SUFIXOS, '').trim() || d.trim();
  if (s === s.toUpperCase()) s = s.toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase());
  return s.slice(0, 40);
}
