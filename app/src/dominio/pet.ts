import { diasEntre, segundaDaSemana, somarDias } from './datas';
import type { Dados, DataISO, Status } from './tipos';

/*
 * Regras da moedinha (docs/02, seção 4).
 * Fome depende de registrar. Humor depende do ritmo da semana. Ela nunca morre.
 */

export type Fome = 'alimentado' | 'fome' | 'faminto';
export type Humor = 'feliz' | 'preocupado' | 'abatido';
export type ImagemPet = Humor | 'fome' | 'dormindo' | 'comemorando';

/** Dias que contam como "registrou": com gasto ou marcados como dia sem gastos. */
export function diasComRegistro(dados: Pick<Dados, 'gastos' | 'diasSemGasto'>): Set<DataISO> {
  const s = new Set<DataISO>();
  for (const g of dados.gastos) s.add(g.data);
  for (const d of dados.diasSemGasto) s.add(d.data);
  return s;
}

/** PET-R1: alimentado (registro hoje ou ontem), com fome (1 dia inteiro sem), faminto (2+ dias). */
export function fomeDoPet(dados: Pick<Dados, 'gastos' | 'diasSemGasto' | 'inicio'>, hoje: DataISO): Fome {
  const dias = diasComRegistro(dados);
  if (dias.has(hoje)) return 'alimentado';
  let ultimo: DataISO = dados.inicio;
  for (const d of dias) if (d <= hoje && d > ultimo) ultimo = d;
  const diasSem = diasEntre(ultimo, hoje) - 1;
  if (diasSem <= 0) return 'alimentado';
  if (diasSem === 1) return 'fome';
  return 'faminto';
}

/** PET-R2: o humor segue o status da semana. */
export function humorDoStatus(status: Status): Humor {
  return status === 'folga' ? 'feliz' : status === 'limite' ? 'preocupado' : 'abatido';
}

export interface Sequencia {
  dias: number;
  /** O perdão desta semana já foi usado. */
  perdaoUsado: boolean;
}

/**
 * PET-R3: dias seguidos com registro.
 * Hoje sem registro ainda não quebra (o dia não acabou). Registro atrasado vale pela data.
 * Perdão: 1 dia sem registro por semana (seg–dom) não quebra a sequência.
 */
export function sequencia(dados: Pick<Dados, 'gastos' | 'diasSemGasto' | 'inicio'>, hoje: DataISO): Sequencia {
  const dias = diasComRegistro(dados);
  const perdoes = new Set<DataISO>();
  let n = 0;
  let d = dias.has(hoje) ? hoje : somarDias(hoje, -1);
  while (d >= dados.inicio) {
    if (dias.has(d)) n++;
    else {
      const sem = segundaDaSemana(d);
      if (perdoes.has(sem)) break;
      perdoes.add(sem);
    }
    d = somarDias(d, -1);
  }
  return { dias: n, perdaoUsado: perdoes.has(segundaDaSemana(hoje)) };
}

/** PET-R4: dias juntos (dias com registro) e nível (sobe a cada 7 dias registrados). */
export function diasJuntos(dados: Pick<Dados, 'gastos' | 'diasSemGasto'>, hoje: DataISO): number {
  let n = 0;
  for (const d of diasComRegistro(dados)) if (d <= hoje) n++;
  return n;
}

export const nivelDe = (dias: number) => 1 + Math.floor(dias / 7);
export const progressoDoNivel = (dias: number) => (dias % 7) / 7;

/** Qual das 6 caras mostrar. Dormindo e fome têm prioridade; depois a comemoração; depois o humor. */
export function imagemDoPet(fome: Fome, humor: Humor, comemorando = false): ImagemPet {
  if (fome === 'faminto') return 'dormindo';
  if (fome === 'fome') return 'fome';
  if (comemorando) return 'comemorando';
  return humor;
}
