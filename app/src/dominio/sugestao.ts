import { PALAVRAS } from './categorias';
import { diasEntre, hojeISO } from './datas';
import type { Categoria, Centavos, DataISO, Gasto } from './tipos';

/** Minúsculas, sem acento, espaços normalizados. */
export function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Faixa do dia: manhã (até 11h), almoço (11–15h), tarde (15–19h), noite. */
export function faixaDoDia(hora: number): number {
  return hora < 11 ? 0 : hora < 15 ? 1 : hora < 19 ? 2 : 3;
}

const fimDeSemana = (diaSemana: number) => diaSemana === 0 || diaSemana === 6;

export interface Sugestao {
  /** Categorias em ordem de sugestão. */
  ordem: string[];
  /** Categoria em destaque (veio da descrição), ou null. */
  destaque: string | null;
}

/** Acha a categoria pela descrição: histórico igual > histórico parecido > palavras conhecidas. */
export function categoriaPelaDescricao(gastos: Gasto[], ativas: Set<string>, descricao: string): string | null {
  const d = normalizar(descricao);
  if (d.length < 2) return null;
  for (let i = gastos.length - 1; i >= 0; i--) {
    const g = gastos[i];
    if (ativas.has(g.categoriaId) && normalizar(g.descricao) === d) return g.categoriaId;
  }
  if (d.length >= 3) {
    const contagem = new Map<string, number>();
    for (const g of gastos) {
      const gd = normalizar(g.descricao);
      if (ativas.has(g.categoriaId) && (gd.startsWith(d) || d.startsWith(gd)) && gd.length >= 3) contagem.set(g.categoriaId, (contagem.get(g.categoriaId) ?? 0) + 1);
    }
    const melhor = [...contagem.entries()].sort((a, b) => b[1] - a[1])[0];
    if (melhor) return melhor[0];
  }
  const palavras = d.split(' ');
  for (const [cat, lista] of Object.entries(PALAVRAS)) {
    if (!ativas.has(cat)) continue;
    // palavra exata; ou, pra palavras de 5+ letras, o radical (sorvete → "sorvetinho", "sorvetes")
    const bate = (p: string) => p.includes(' ')
      ? d.includes(p)
      : palavras.includes(p) || (p.length >= 5 && palavras.some(w => w.startsWith(p.slice(0, -1))));
    if (lista.some(bate)) return cat;
  }
  return null;
}

/**
 * F1: sugere categorias, sem IA.
 * 1) pela descrição; 2) pelo que você costuma gastar nesse horário e tipo de dia; 3) pelo que mais usa; 4) ordem padrão.
 */
export function sugerirCategorias(gastos: Gasto[], categorias: Categoria[], descricao: string, agora: Date, limite = 4): Sugestao {
  const ativas = categorias.filter(c => !c.arquivada).sort((a, b) => a.ordem - b.ordem);
  const idsAtivos = new Set(ativas.map(c => c.id));
  const destaque = categoriaPelaDescricao(gastos, idsAtivos, descricao);
  const faixa = faixaDoDia(agora.getHours());
  const fds = fimDeSemana(agora.getDay());
  const hoje = hojeISO(agora);
  const pontos = new Map<string, number>();
  for (const g of gastos) {
    if (!idsAtivos.has(g.categoriaId) || diasEntre(g.data, hoje) > 90) continue;
    const quando = new Date(g.criadoEm);
    let p = 1;
    if (hojeISO(quando) === g.data) {
      if (faixaDoDia(quando.getHours()) === faixa) p += 2;
      if (fimDeSemana(quando.getDay()) === fds) p += 1;
    }
    pontos.set(g.categoriaId, (pontos.get(g.categoriaId) ?? 0) + p);
  }
  const porPontos = [...pontos.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  const ordem = [...new Set([destaque, ...porPontos, ...ativas.map(c => c.id)].filter((x): x is string => !!x))];
  return { ordem: ordem.slice(0, limite), destaque };
}

export interface AtalhoAprendido {
  descricao: string;
  valor: Centavos;
  categoriaId: string;
  vezes: number;
  ultimo: DataISO;
}

/** Chave de um atalho: descrição normalizada + valor + categoria. */
export const chaveAtalho = (descricao: string, valor: Centavos, categoriaId: string) => `${normalizar(descricao)}|${valor}|${categoriaId}`;

/** F1: o mesmo gasto (descrição + valor + categoria) 3 vezes em 120 dias vira atalho. */
export function atalhosAprendidos(gastos: Gasto[], hoje: DataISO, ocultos: string[] = [], minimo = 3): AtalhoAprendido[] {
  const grupos = new Map<string, AtalhoAprendido>();
  const esconder = new Set(ocultos);
  for (const g of gastos) {
    if (!g.descricao || diasEntre(g.data, hoje) > 120) continue;
    const k = chaveAtalho(g.descricao, g.valor, g.categoriaId);
    if (esconder.has(k)) continue;
    const a = grupos.get(k);
    if (a) { a.vezes++; if (g.data > a.ultimo) { a.ultimo = g.data; a.descricao = g.descricao; } }
    else grupos.set(k, { descricao: g.descricao, valor: g.valor, categoriaId: g.categoriaId, vezes: 1, ultimo: g.data });
  }
  return [...grupos.values()].filter(a => a.vezes >= minimo).sort((a, b) => b.vezes - a.vezes || (a.ultimo < b.ultimo ? 1 : -1));
}
