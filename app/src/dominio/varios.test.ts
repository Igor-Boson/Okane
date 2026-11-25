import { describe, expect, it } from 'vitest';
import { CATEGORIAS_PADRAO } from './categorias';
import { diasEntre, diasNoMes, mesesEntre, periodoSemana, rotuloDia, segundaDaSemana, somarDias, somarMeses } from './datas';
import { brl, brl0, brl0Sinal, centavosParaTexto, paraCentavos } from './dinheiro';
import { FALAS, fala, type Situacao } from './falas';
import { atalhosAprendidos, categoriaPelaDescricao, normalizar, sugerirCategorias } from './sugestao';
import { interpretarTexto } from './texto';
import type { Gasto } from './tipos';

describe('datas', () => {
  it('soma dias atravessando mês e ano', () => {
    expect(somarDias('2026-11-30', 1)).toBe('2026-12-01');
    expect(somarDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(somarDias('2026-03-01', -1)).toBe('2026-02-28');
    expect(diasEntre('2026-11-23', '2026-11-29')).toBe(6);
  });
  it('acha a segunda da semana', () => {
    expect(segundaDaSemana('2026-11-25')).toBe('2026-11-23');
    expect(segundaDaSemana('2026-11-29')).toBe('2026-11-23');
    expect(segundaDaSemana('2026-11-23')).toBe('2026-11-23');
    expect(segundaDaSemana('2026-11-30')).toBe('2026-11-30');
  });
  it('meses', () => {
    expect(diasNoMes('2026-02')).toBe(28);
    expect(diasNoMes('2028-02')).toBe(29);
    expect(somarMeses('2026-11', 3)).toBe('2027-02');
    expect(somarMeses('2026-01', -1)).toBe('2025-12');
    expect(mesesEntre('2026-10', '2027-01')).toBe(3);
  });
  it('rótulos', () => {
    expect(periodoSemana('2026-11-23')).toBe('23–29 nov');
    expect(periodoSemana('2026-11-30')).toBe('30 nov – 6 dez');
    expect(rotuloDia('2026-11-25', '2026-11-25')).toBe('Hoje');
    expect(rotuloDia('2026-11-24', '2026-11-25')).toBe('Ontem');
    expect(rotuloDia('2026-11-19', '2026-11-25')).toBe('qui 19/11');
  });
});

describe('dinheiro', () => {
  it('formata', () => {
    expect(brl(2000)).toBe('R$ 20');
    expect(brl(1250)).toBe('R$ 12,50');
    expect(brl(123456)).toBe('R$ 1.234,56');
    expect(brl0(39987.5)).toBe('R$ 400');
    expect(brl0Sinal(-2000)).toBe('−R$ 20');
  });
  it('lê o que foi digitado', () => {
    expect(paraCentavos('20')).toBe(2000);
    expect(paraCentavos('12,5')).toBe(1250);
    expect(paraCentavos('12.50')).toBe(1250);
    expect(paraCentavos('R$ 1.234,56')).toBe(123456);
    expect(paraCentavos('abc')).toBeNull();
    expect(paraCentavos('')).toBeNull();
    expect(centavosParaTexto(1250)).toBe('12,50');
    expect(centavosParaTexto(2000)).toBe('20');
  });
});

describe('texto livre: "sorvete 20"', () => {
  it.each([
    ['sorvete 20', 'sorvete', 2000],
    ['20 sorvete', 'sorvete', 2000],
    ['uber 12,50', 'uber', 1250],
    ['r$ 35 almoço', 'almoço', 3500],
    ['pão de queijo 8', 'pão de queijo', 800],
    ['sorvete', 'sorvete', null],
    ['99 pop', 'pop', 9900],
    ['taxi 99 30', 'taxi 99', 3000],
  ])('%s', (texto, descricao, valor) => {
    expect(interpretarTexto(texto)).toEqual({ descricao, valor });
  });
  it('só número', () => {
    expect(interpretarTexto('45')).toEqual({ descricao: '', valor: 4500 });
  });
});

const gasto = (descricao: string, categoriaId: string, data = '2026-11-20', valor = 800, criadoEm = 0): Gasto => ({
  id: Math.random().toString(36), data, valor, descricao, categoriaId, valeu: null, criadoEm,
});

describe('sugestão de categoria', () => {
  const ativas = new Set(CATEGORIAS_PADRAO.map(c => c.id));
  it('normaliza', () => {
    expect(normalizar('  Pão  de Queijo ')).toBe('pao de queijo');
  });
  it('histórico igual vence a lista de palavras', () => {
    const gs = [gasto('Café', 'outros')];
    expect(categoriaPelaDescricao(gs, ativas, 'cafe')).toBe('outros');
    expect(categoriaPelaDescricao([], ativas, 'café')).toBe('besteirinha');
  });
  it('reconhece palavras comuns', () => {
    expect(categoriaPelaDescricao([], ativas, 'Uber pro trabalho')).toBe('transporte');
    expect(categoriaPelaDescricao([], ativas, 'iFood')).toBe('fora');
    expect(categoriaPelaDescricao([], ativas, 'farmácia')).toBe('saude');
    expect(categoriaPelaDescricao([], ativas, 'barato')).toBeNull();
    expect(categoriaPelaDescricao([], ativas, 'sorvetinho')).toBe('besteirinha');
  });
  it('ordena pelo destaque e depois pelo hábito', () => {
    const agora = new Date(2026, 10, 25, 20, 0);
    const noite = new Date(2026, 10, 24, 21, 0).getTime();
    const gs = [gasto('Bar', 'lazer', '2026-11-24', 5000, noite), gasto('Bar', 'lazer', '2026-11-24', 5000, noite)];
    const s = sugerirCategorias(gs, CATEGORIAS_PADRAO, 'sorvete', agora);
    expect(s.destaque).toBe('besteirinha');
    expect(s.ordem[0]).toBe('besteirinha');
    expect(s.ordem[1]).toBe('lazer');
    expect(s.ordem).toHaveLength(4);
  });
  it('ignora categorias arquivadas', () => {
    const cats = CATEGORIAS_PADRAO.map(c => (c.id === 'besteirinha' ? { ...c, arquivada: true } : c));
    const s = sugerirCategorias([], cats, 'sorvete', new Date(2026, 10, 25, 10));
    expect(s.destaque).toBeNull();
    expect(s.ordem).not.toContain('besteirinha');
  });
});

describe('atalhos aprendidos', () => {
  it('3 repetições viram atalho; ocultos somem', () => {
    const gs = [gasto('Café', 'besteirinha'), gasto('café', 'besteirinha', '2026-11-21'), gasto('Café', 'besteirinha', '2026-11-22'), gasto('Uber', 'transporte'), gasto('Uber', 'transporte')];
    const a = atalhosAprendidos(gs, '2026-11-25');
    expect(a).toHaveLength(1);
    expect(a[0]).toMatchObject({ valor: 800, categoriaId: 'besteirinha', vezes: 3, descricao: 'Café' });
    expect(atalhosAprendidos(gs, '2026-11-25', ['cafe|800|besteirinha'])).toHaveLength(0);
  });
  it('valores diferentes são atalhos diferentes', () => {
    const gs = [gasto('Café', 'besteirinha', '2026-11-20', 800), gasto('Café', 'besteirinha', '2026-11-21', 900), gasto('Café', 'besteirinha', '2026-11-22', 800)];
    expect(atalhosAprendidos(gs, '2026-11-25')).toHaveLength(0);
  });
});

describe('falas', () => {
  it('toda situação tem fala nos dois tons', () => {
    for (const sit of Object.keys(FALAS) as Situacao[]) {
      expect(FALAS[sit].fofo.length, sit).toBeGreaterThan(0);
      expect(FALAS[sit].sem.length, sit).toBeGreaterThan(0);
    }
  });
  it('preenche os marcadores', () => {
    expect(fala('sobra', 'fofo', { v: 'R$ 80' }, () => 0)).toBe('Sobrou R$ 80! E aí?');
    expect(fala('nivel', 'sem', { n: 4 }, () => 0)).toBe('Nível 4. Tá ficando bom nisso.');
    expect(fala('grande', 'fofo', { pct: 45 }, () => 0.99)).toContain('45%');
  });
});
