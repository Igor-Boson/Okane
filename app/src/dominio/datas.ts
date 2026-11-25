import type { DataISO, MesISO } from './tipos';

/**
 * Datas como texto 'AAAA-MM-DD', sem fuso. A conta é feita em UTC
 * só pra não sofrer com horário de verão: o significado é sempre "dia local".
 */

const DIA_MS = 86_400_000;

const pad = (n: number) => String(n).padStart(2, '0');

function partes(iso: DataISO): [number, number, number] {
  const [y, m, d] = iso.split('-').map(Number);
  return [y, m, d];
}

function utc(iso: DataISO): number {
  const [y, m, d] = partes(iso);
  return Date.UTC(y, m - 1, d);
}

function deUtc(ms: number): DataISO {
  const dt = new Date(ms);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/** Data local de hoje (ou do instante dado). */
export function hojeISO(agora: Date = new Date()): DataISO {
  return `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(agora.getDate())}`;
}

export function somarDias(iso: DataISO, n: number): DataISO {
  return deUtc(utc(iso) + n * DIA_MS);
}

/** Quantos dias de `a` até `b` (b − a). */
export function diasEntre(a: DataISO, b: DataISO): number {
  return Math.round((utc(b) - utc(a)) / DIA_MS);
}

/** 0 = domingo … 6 = sábado. */
export function diaDaSemana(iso: DataISO): number {
  return new Date(utc(iso)).getUTCDay();
}

/** Segunda-feira da semana (semana de segunda a domingo). */
export function segundaDaSemana(iso: DataISO): DataISO {
  return somarDias(iso, -((diaDaSemana(iso) + 6) % 7));
}

export function mesDe(iso: DataISO): MesISO {
  return iso.slice(0, 7);
}

export function diaDoMes(iso: DataISO): number {
  return partes(iso)[2];
}

export function diasNoMes(mes: MesISO): number {
  const [y, m] = mes.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function primeiroDia(mes: MesISO): DataISO {
  return `${mes}-01`;
}

export function ultimoDia(mes: MesISO): DataISO {
  return `${mes}-${pad(diasNoMes(mes))}`;
}

export function dataNoMes(mes: MesISO, dia: number): DataISO {
  return `${mes}-${pad(dia)}`;
}

export function somarMeses(mes: MesISO, n: number): MesISO {
  const [y, m] = mes.split('-').map(Number);
  const total = y * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}`;
}

/** Quantos meses de `a` até `b` (b − a). */
export function mesesEntre(a: MesISO, b: MesISO): number {
  const [ya, ma] = a.split('-').map(Number);
  const [yb, mb] = b.split('-').map(Number);
  return (yb - ya) * 12 + (mb - ma);
}

export function maxData(a: DataISO, b: DataISO): DataISO {
  return a > b ? a : b;
}

export function minData(a: DataISO, b: DataISO): DataISO {
  return a < b ? a : b;
}

const DOW = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const DOW_LONGO = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MES_LONGO = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export function nomeDiaSemana(iso: DataISO, longo = false): string {
  return (longo ? DOW_LONGO : DOW)[diaDaSemana(iso)];
}

export function nomeMes(mes: MesISO, longo = true): string {
  const m = Number(mes.slice(5, 7)) - 1;
  return (longo ? MES_LONGO : MES_CURTO)[m];
}

/** "25/11" */
export function diaMes(iso: DataISO): string {
  const [, m, d] = partes(iso);
  return `${pad(d)}/${pad(m)}`;
}

/** "fev/27" */
export function mesCurtoAno(mes: MesISO): string {
  return `${nomeMes(mes, false)}/${mes.slice(2, 4)}`;
}

/** "23–29 nov" ou "30 nov – 6 dez" */
export function periodoSemana(segunda: DataISO): string {
  const domingo = somarDias(segunda, 6);
  const [, m1, d1] = partes(segunda);
  const [, m2, d2] = partes(domingo);
  if (m1 === m2) return `${d1}–${d2} ${MES_CURTO[m2 - 1]}`;
  return `${d1} ${MES_CURTO[m1 - 1]} – ${d2} ${MES_CURTO[m2 - 1]}`;
}

/** "Hoje", "Ontem" ou "qua 19/11" */
export function rotuloDia(iso: DataISO, hoje: DataISO): string {
  const dif = diasEntre(iso, hoje);
  if (dif === 0) return 'Hoje';
  if (dif === 1) return 'Ontem';
  return `${nomeDiaSemana(iso)} ${diaMes(iso)}`;
}
