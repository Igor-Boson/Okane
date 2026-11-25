import { CATEGORIAS_PADRAO } from '../dominio/categorias';
import { diaDaSemana, mesDe, somarDias, somarMeses } from '../dominio/datas';
import type { Categoria, DataISO, Desejo, Gasto, Parcela, PlanoMes } from '../dominio/tipos';

/*
 * Dados de exemplo pra prévia: ~18 dias de gastos plausíveis até hoje.
 * Sementes fixas: o mesmo dia sempre gera os mesmos gastos.
 */

function sorteador(semente: number) {
  let s = semente >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

interface Modelo { descricao: string; categoriaId: string; min: number; max: number; chance: number; hora: number; dias?: number[] }

const MODELOS: Modelo[] = [
  { descricao: 'Café', categoriaId: 'besteirinha', min: 8, max: 8, chance: 0.55, hora: 9, dias: [1, 2, 3, 4, 5] },
  { descricao: 'Almoço', categoriaId: 'fora', min: 32, max: 42, chance: 0.4, hora: 12, dias: [1, 2, 3, 4, 5] },
  { descricao: 'Uber', categoriaId: 'transporte', min: 14, max: 26, chance: 0.25, hora: 18 },
  { descricao: 'Mercado', categoriaId: 'mercado', min: 85, max: 140, chance: 0.18, hora: 19 },
  { descricao: 'iFood', categoriaId: 'fora', min: 45, max: 68, chance: 0.45, hora: 20, dias: [5, 6, 0] },
  { descricao: 'Bar', categoriaId: 'lazer', min: 55, max: 95, chance: 0.3, hora: 22, dias: [5, 6] },
  { descricao: 'Sorvete', categoriaId: 'besteirinha', min: 16, max: 20, chance: 0.12, hora: 16 },
  { descricao: 'Farmácia', categoriaId: 'saude', min: 25, max: 60, chance: 0.05, hora: 17 },
  { descricao: 'Camiseta', categoriaId: 'compras', min: 79, max: 89, chance: 0.04, hora: 15 },
];

export interface Exemplo {
  inicio: DataISO;
  categorias: Categoria[];
  planos: PlanoMes[];
  parcelas: Parcela[];
  gastos: Gasto[];
  desejos: Desejo[];
}

export function gerarExemplo(hoje: DataISO, novoId: () => string, agora = Date.now()): Exemplo {
  const inicio = somarDias(hoje, -18);
  const fixos = [['Aluguel', 150000], ['Condomínio', 27500], ['Luz', 18000], ['Internet', 12000], ['Academia', 11000], ['Celular', 6000], ['Streaming', 5500]]
    .map(([nome, valor]) => ({ id: novoId(), nome: nome as string, valor: valor as number }));
  const planos: PlanoMes[] = [{ mes: mesDe(inicio), salario: 500000, metaGuardar: 0, fixos }];
  const parcelas: Parcela[] = [
    { id: novoId(), nome: 'Notebook', valor: 20000, primeiroMes: somarMeses(mesDe(inicio), -2), total: 6 },
    { id: novoId(), nome: 'Curso de inglês', valor: 15000, primeiroMes: somarMeses(mesDe(inicio), -1), total: 3 },
  ];
  const gastos: Gasto[] = [];
  for (let d = inicio; d <= hoje; d = somarDias(d, 1)) {
    const sorte = sorteador(Number(d.replace(/-/g, '')));
    const dow = diaDaSemana(d);
    for (const m of MODELOS) {
      if (m.dias && !m.dias.includes(dow)) continue;
      if (d === hoje && m.hora > new Date(agora).getHours()) continue;
      if (sorte() > m.chance) continue;
      const valor = Math.round(m.min + (m.max - m.min) * sorte()) * 100;
      const naoEssencial = !['mercado', 'transporte', 'saude'].includes(m.categoriaId);
      const r = sorte();
      const [y, mm, dd] = d.split('-').map(Number);
      gastos.push({
        id: novoId(), data: d, valor, descricao: m.descricao, categoriaId: m.categoriaId,
        valeu: naoEssencial ? (r < 0.25 ? false : r < 0.6 ? true : null) : null,
        criadoEm: new Date(y, mm - 1, dd, m.hora, Math.floor(sorte() * 50)).getTime(),
      });
    }
  }
  const desejos: Desejo[] = [
    { id: novoId(), nome: 'Fone bluetooth', valor: 29900, criadoEm: agora - 3 * 86_400_000, quarentenaDias: 7, status: 'esperando' },
  ];
  return { inicio, categorias: CATEGORIAS_PADRAO.map(c => ({ ...c })), planos, parcelas, gastos, desejos };
}
