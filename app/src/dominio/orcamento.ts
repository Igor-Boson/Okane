import {
  dataNoMes, diaDoMes, diasEntre, diasNoMes, maxData, mesDe, mesesEntre, minData, primeiroDia,
  segundaDaSemana, somarDias, somarMeses, ultimoDia,
} from './datas';
import type { Centavos, Dados, DataISO, EntradaExtra, Gasto, MesISO, Parcela, PlanoMes, Status } from './tipos';

/*
 * Regras do orçamento (docs/02, seção 3).
 * Tudo aqui é derivado dos registros (R4): nada de saldo guardado.
 * Valores intermediários podem ter fração de centavo; a tela arredonda.
 */

const soma = (xs: number[]) => xs.reduce((s, x) => s + x, 0);

// ---------------------------------------------------------------- plano do mês

/** Plano do mês; se não existir, herda o mais recente anterior (a virada do mês copia o anterior). */
export function planoDoMes(dados: Pick<Dados, 'planos'>, mes: MesISO): PlanoMes | null {
  const ordenados = [...dados.planos].sort((a, b) => (a.mes < b.mes ? -1 : a.mes > b.mes ? 1 : 0));
  let escolhido: PlanoMes | null = null;
  for (const p of ordenados) if (p.mes <= mes) escolhido = p;
  return escolhido ?? ordenados[0] ?? null;
}

export interface ParcelaNoMes {
  parcela: Parcela;
  /** Número desta parcela (1 = primeira). */
  numero: number;
  /** Quantas faltam contando a deste mês. */
  faltam: number;
  ultimoMes: MesISO;
}

export function infoParcela(p: Parcela, mes: MesISO): ParcelaNoMes {
  const numero = mesesEntre(p.primeiroMes, mes) + 1;
  return { parcela: p, numero, faltam: p.total - numero + 1, ultimoMes: somarMeses(p.primeiroMes, p.total - 1) };
}

/** Parcelas que caem no mês (R5). "Faltam N" é calculado, nunca guardado. */
export function parcelasDoMes(dados: Pick<Dados, 'parcelas'>, mes: MesISO): ParcelaNoMes[] {
  return dados.parcelas.map(p => infoParcela(p, mes)).filter(x => x.numero >= 1 && x.numero <= x.parcela.total);
}

/** Parcelas cuja última parcela cai neste mês. */
export function parcelasTerminando(dados: Pick<Dados, 'parcelas'>, mes: MesISO): Parcela[] {
  return dados.parcelas.filter(p => infoParcela(p, mes).ultimoMes === mes);
}

export function extrasDoMes(dados: Pick<Dados, 'extras'>, mes: MesISO): EntradaExtra[] {
  return dados.extras.filter(e => e.mes === mes);
}

/** Primeiro dia contado no mês (o mês do primeiro uso começa no dia do início). null = mês antes do início. */
export function diaInicialDoMes(dados: Pick<Dados, 'inicio'>, mes: MesISO): number | null {
  const mi = mesDe(dados.inicio);
  if (mes < mi) return null;
  if (mes === mi) return diaDoMes(dados.inicio);
  return 1;
}

export interface ContaMes {
  mes: MesISO;
  dias: number;
  diaInicial: number | null;
  /** Fração do mês em uso (1 nos meses cheios; proporcional no mês do primeiro uso). */
  fator: number;
  salario: Centavos;
  fixos: Centavos;
  parcelas: Centavos;
  metaGuardar: Centavos;
  extrasLiberados: Centavos;
  extrasGuardados: Centavos;
  /** Dinheiro livre pros gastos do mês: (salário − fixos − parcelas − meta) × fator + extras liberados. */
  livre: number;
}

export function contaDoMes(dados: Dados, mes: MesISO): ContaMes {
  const plano = planoDoMes(dados, mes);
  const dias = diasNoMes(mes);
  const diaInicial = diaInicialDoMes(dados, mes);
  const fator = diaInicial === null ? 0 : (dias - diaInicial + 1) / dias;
  const salario = plano?.salario ?? 0;
  const fixos = soma((plano?.fixos ?? []).map(f => f.valor));
  const parcelas = soma(parcelasDoMes(dados, mes).map(p => p.parcela.valor));
  const metaGuardar = plano?.metaGuardar ?? 0;
  const ex = extrasDoMes(dados, mes);
  const extrasLiberados = soma(ex.map(e => Math.min(e.liberado, e.valor)));
  const extrasGuardados = soma(ex.map(e => Math.max(0, e.valor - e.liberado)));
  const livre = (salario - fixos - parcelas - metaGuardar) * fator + extrasLiberados;
  return { mes, dias, diaInicial, fator, salario, fixos, parcelas, metaGuardar, extrasLiberados, extrasGuardados, livre };
}

// ---------------------------------------------------------------- gastos

/** Gastos entre duas datas (inclusive), ignorando o que for anterior ao início. */
export function gastosEntre(dados: Pick<Dados, 'gastos' | 'inicio'>, de: DataISO, ate: DataISO): Gasto[] {
  const ini = maxData(de, dados.inicio);
  return dados.gastos.filter(g => g.data >= ini && g.data <= ate);
}

export const totalDe = (gs: Gasto[]): Centavos => soma(gs.map(g => g.valor));

export function porCategoria(gs: Gasto[]): [string, Centavos][] {
  const m = new Map<string, number>();
  for (const g of gs) m.set(g.categoriaId, (m.get(g.categoriaId) ?? 0) + g.valor);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

export const naoValeuDe = (gs: Gasto[]): Centavos => totalDe(gs.filter(g => g.valeu === false));

// ---------------------------------------------------------------- semana

/** Domingo da semana em que o fechamento "guardar" passa a valer. */
const domingoDe = (segunda: DataISO) => somarDias(segunda, 6);

/** Quanto foi guardado nos fechamentos de semana do mês, até (sem incluir) uma data. */
export function guardadoSemanalAte(dados: Pick<Dados, 'fechamentos'>, mes: MesISO, antesDe: DataISO): Centavos {
  return soma(
    dados.fechamentos
      .filter(f => f.decisao === 'guardar' && mesDe(domingoDe(f.semana)) === mes && domingoDe(f.semana) < antesDe)
      .map(f => f.valor),
  );
}

export interface Segmento { mes: MesISO; de: DataISO; ate: DataISO }

/** Partes da semana em cada mês (1 ou 2 partes). R8. */
export function segmentosDaSemana(segunda: DataISO): Segmento[] {
  const domingo = domingoDe(segunda);
  const m1 = mesDe(segunda), m2 = mesDe(domingo);
  if (m1 === m2) return [{ mes: m1, de: segunda, ate: domingo }];
  return [{ mes: m1, de: segunda, ate: ultimoDia(m1) }, { mes: m2, de: primeiroDia(m2), ate: domingo }];
}

/**
 * Cota de um trecho dentro de um mês:
 * (livre do mês − gasto antes do trecho − guardado antes do trecho) × dias do trecho ÷ dias que faltam no mês.
 * Folga e estouro de semanas anteriores passam pra frente automaticamente.
 */
export function cotaDoSegmento(dados: Dados, seg: Segmento): number {
  const ini = maxData(seg.de, dados.inicio);
  if (ini > seg.ate) return 0;
  const conta = contaDoMes(dados, seg.mes);
  const gastoAntes = totalDe(gastosEntre(dados, primeiroDia(seg.mes), somarDias(ini, -1)));
  const guardado = guardadoSemanalAte(dados, seg.mes, ini);
  const restante = conta.livre - gastoAntes - guardado;
  const diasTrecho = diasEntre(ini, seg.ate) + 1;
  const diasRestantes = conta.dias - diaDoMes(ini) + 1;
  return restante * diasTrecho / diasRestantes;
}

export interface Semana {
  segunda: DataISO;
  domingo: DataISO;
  cota: number;
  gastos: Gasto[];
  gasto: Centavos;
  /** Quanto ainda dá pra gastar (negativo = passou). */
  pode: number;
  status: Status;
  /** Quanto já "deveria" ter sido gasto até hoje, no ritmo da semana. */
  ritmo: number;
  /** Fração da semana já vivida (0–1), pra marcar o ritmo na barra. */
  fracaoVivida: number;
  diasRestantes: number;
  porDia: number;
}

/**
 * Cota de um trecho vista a partir de `hoje`. Se o mês do trecho já acabou (semana que cruza a virada),
 * a sobra dele foi pro guardado do mês e o estouro ficou por lá (R3): o trecho vale exatamente o que foi gasto nele.
 */
export function cotaEfetiva(dados: Dados, seg: Segmento, hoje: DataISO): number {
  if (seg.mes < mesDe(hoje)) return totalDe(gastosEntre(dados, seg.de, seg.ate));
  return cotaDoSegmento(dados, seg);
}

/** R1: número da semana e status 🟢🟡🔴. */
export function calcularSemana(dados: Dados, hoje: DataISO): Semana {
  const segunda = segundaDaSemana(hoje);
  const domingo = domingoDe(segunda);
  const cota = soma(segmentosDaSemana(segunda).map(s => cotaEfetiva(dados, s, hoje)));
  const gastos = gastosEntre(dados, segunda, domingo);
  const gasto = totalDe(gastos);
  const pode = cota - gasto;
  const iniEf = maxData(segunda, dados.inicio);
  const diasEf = Math.max(1, diasEntre(iniEf, domingo) + 1);
  const diaN = Math.min(diasEf, Math.max(1, diasEntre(iniEf, hoje) + 1));
  const ritmo = cota * diaN / diasEf;
  const limiteVerde = ritmo + cota / diasEf;
  const status: Status = cota <= 0 ? 'passou' : gasto <= limiteVerde ? 'folga' : gasto <= cota ? 'limite' : 'passou';
  const diasRestantes = Math.max(1, diasEntre(hoje, domingo) + 1);
  return {
    segunda, domingo, cota, gastos, gasto, pode, status, ritmo,
    fracaoVivida: diaN / diasEf, diasRestantes, porDia: Math.max(0, pode) / diasRestantes,
  };
}

export interface FechamentoCalculado {
  segunda: DataISO;
  domingo: DataISO;
  cota: number;
  gasto: Centavos;
  /** Sobra da semana inteira (negativo = estourou). */
  sobra: number;
  /** A semana atravessa a virada do mês. */
  cruzaMes: boolean;
  /** A semana termina no último dia do mês: a sobra vai direto pro guardado do mês. */
  terminaNoFimDoMes: boolean;
  /** Quanto dá pra escolher entre guardar e passar pra frente (0 = sem escolha). */
  escolhivel: Centavos;
  /** Parte da sobra que já fica no fechamento do mês anterior (semana que cruza o mês). */
  sobraDoMesAnterior: number;
  gastos: Gasto[];
  porCategoria: [string, Centavos][];
  naoValeu: Centavos;
}

/** R2: fechamento da semana. */
export function fecharSemana(dados: Dados, segunda: DataISO): FechamentoCalculado {
  const domingo = domingoDe(segunda);
  const segs = segmentosDaSemana(segunda);
  const cotas = segs.map(s => cotaDoSegmento(dados, s));
  // a parte do mês anterior já foi resolvida no fechamento daquele mês
  const cota = soma(segs.map(s => cotaEfetiva(dados, s, domingo)));
  const gastos = gastosEntre(dados, segunda, domingo);
  const gasto = totalDe(gastos);
  const ultimo = segs[segs.length - 1];
  const gastoUltimo = totalDe(gastosEntre(dados, ultimo.de, ultimo.ate));
  const sobraUltimo = cotas[cotas.length - 1] - gastoUltimo;
  const terminaNoFimDoMes = domingo === ultimoDia(ultimo.mes);
  const cruzaMes = segs.length > 1;
  const sobraDoMesAnterior = cruzaMes ? cotas[0] - totalDe(gastosEntre(dados, segs[0].de, segs[0].ate)) : 0;
  return {
    segunda, domingo, cota, gasto, sobra: cota - gasto, cruzaMes, terminaNoFimDoMes,
    escolhivel: !terminaNoFimDoMes && sobraUltimo >= 100 ? Math.floor(sobraUltimo) : 0,
    sobraDoMesAnterior, gastos, porCategoria: porCategoria(gastos), naoValeu: naoValeuDe(gastos),
  };
}

/** Semanas já terminadas (antes da semana de hoje) e ainda não fechadas, da mais antiga pra mais nova. */
export function semanasAbertas(dados: Dados, hoje: DataISO): DataISO[] {
  const fechadas = new Set(dados.fechamentos.map(f => f.semana));
  const atual = segundaDaSemana(hoje);
  const out: DataISO[] = [];
  for (let s = segundaDaSemana(dados.inicio); s < atual; s = somarDias(s, 7)) if (!fechadas.has(s)) out.push(s);
  return out;
}

// ---------------------------------------------------------------- mês

export interface ResumoMes {
  conta: ContaMes;
  gastos: Gasto[];
  gasto: Centavos;
  guardadoSemanas: Centavos;
  /** livre − gasto − guardado nas semanas. Positivo vira guardado; negativo = estourou. */
  sobra: number;
  /** Tudo que ficou guardado no mês: meta + semanas + sobra final + extras não liberados. */
  guardadoTotal: number;
  estouro: number;
  porCategoria: [string, Centavos][];
  naoValeu: Centavos;
  parcelasTerminando: Parcela[];
}

/** R3: resumo e fechamento do mês. */
export function resumoDoMes(dados: Dados, mes: MesISO): ResumoMes {
  const conta = contaDoMes(dados, mes);
  const gastos = gastosEntre(dados, primeiroDia(mes), ultimoDia(mes));
  const gasto = totalDe(gastos);
  const guardadoSemanas = guardadoSemanalAte(dados, mes, somarDias(ultimoDia(mes), 1));
  const sobra = conta.livre - gasto - guardadoSemanas;
  return {
    conta, gastos, gasto, guardadoSemanas, sobra,
    guardadoTotal: conta.metaGuardar * conta.fator + guardadoSemanas + Math.max(0, sobra) + conta.extrasGuardados,
    estouro: Math.max(0, -sobra),
    porCategoria: porCategoria(gastos), naoValeu: naoValeuDe(gastos),
    parcelasTerminando: parcelasTerminando(dados, mes),
  };
}

/** Sugestão de meta de guardar a partir da sobra real (D9): ~75%, arredondado pra baixo em dezenas de reais. */
export function sugerirMeta(sobraMes: number): Centavos {
  if (sobraMes <= 0) return 0;
  return Math.floor((sobraMes * 0.75) / 1000) * 1000;
}

/** Valor médio por semana no mês (pra tela do Plano). */
export function mediaSemanal(conta: ContaMes): number {
  const diasEmUso = conta.diaInicial === null ? 0 : conta.dias - conta.diaInicial + 1;
  return diasEmUso > 0 ? conta.livre * 7 / diasEmUso : 0;
}

/** Quanto um gasto custa em minutos de trabalho (v1). */
export function minutosDeTrabalho(valor: Centavos, salario: Centavos, horasPorMes: number): number | null {
  if (!horasPorMes || salario <= 0) return null;
  return Math.round(valor / (salario / horasPorMes) * 60);
}

export function textoTempoDeTrabalho(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  if (h < 8 || m === 0) return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
  return `${(min / 60).toFixed(1).replace('.', ',')}h`;
}

/** Datas de dias do mês até hoje (pra iterações simples). */
export function diasDoMesAte(mes: MesISO, hoje: DataISO): DataISO[] {
  const fim = minData(ultimoDia(mes), hoje);
  const out: DataISO[] = [];
  for (let d = 1; dataNoMes(mes, d) <= fim; d++) out.push(dataNoMes(mes, d));
  return out;
}
