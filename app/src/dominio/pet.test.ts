import { describe, expect, it } from 'vitest';
import { diasJuntos, fomeDoPet, humorDoStatus, imagemDoPet, nivelDe, sequencia } from './pet';
import type { Dados, Gasto } from './tipos';

type D = Pick<Dados, 'gastos' | 'diasSemGasto' | 'inicio'>;
const gasto = (data: string, valor = 1000): Gasto => ({ id: data + valor, data, valor, descricao: '', categoriaId: 'fora', valeu: null, criadoEm: 0 });
const dados = (dias: string[], zero: string[] = [], inicio = '2026-11-01'): D => ({
  inicio, gastos: dias.map(d => gasto(d)), diasSemGasto: zero.map(data => ({ data, criadoEm: 0 })),
});

describe('fome (PET-R1)', () => {
  it('alimentado com registro hoje ou ontem', () => {
    expect(fomeDoPet(dados(['2026-11-25']), '2026-11-25')).toBe('alimentado');
    expect(fomeDoPet(dados(['2026-11-24']), '2026-11-25')).toBe('alimentado');
  });
  it('com fome depois de 1 dia inteiro sem registro; faminto com 2+', () => {
    expect(fomeDoPet(dados(['2026-11-23']), '2026-11-25')).toBe('fome');
    expect(fomeDoPet(dados(['2026-11-22']), '2026-11-25')).toBe('faminto');
  });
  it('dia sem gastos também alimenta', () => {
    expect(fomeDoPet(dados([], ['2026-11-24']), '2026-11-25')).toBe('alimentado');
  });
  it('valor não importa: R$ 5 e R$ 500 alimentam igual', () => {
    const d = { inicio: '2026-11-01', gastos: [gasto('2026-11-24', 500)], diasSemGasto: [] };
    expect(fomeDoPet(d, '2026-11-25')).toBe('alimentado');
  });
  it('no primeiro dia de uso, sem nada registrado, não tem fome', () => {
    expect(fomeDoPet(dados([], [], '2026-11-25'), '2026-11-25')).toBe('alimentado');
    expect(fomeDoPet(dados([], [], '2026-11-25'), '2026-11-26')).toBe('alimentado');
    expect(fomeDoPet(dados([], [], '2026-11-25'), '2026-11-27')).toBe('fome');
  });
  it('registro de data futura não conta', () => {
    expect(fomeDoPet(dados(['2026-11-30']), '2026-11-25')).toBe('faminto');
  });
});

describe('sequência (PET-R3)', () => {
  it('conta dias seguidos e hoje sem registro ainda não quebra', () => {
    expect(sequencia(dados(['2026-11-23', '2026-11-24', '2026-11-25']), '2026-11-25').dias).toBe(3);
    expect(sequencia(dados(['2026-11-23', '2026-11-24']), '2026-11-25').dias).toBe(2);
  });
  it('1 dia de folga por semana não quebra', () => {
    // semana 16–22: falta o dia 19 (perdão); semana 23–29: completa
    const dias = ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-20', '2026-11-21', '2026-11-22', '2026-11-23', '2026-11-24', '2026-11-25'];
    expect(sequencia(dados(dias), '2026-11-25').dias).toBe(9);
  });
  it('2 faltas na mesma semana quebram', () => {
    const dias = ['2026-11-16', '2026-11-19', '2026-11-21', '2026-11-22', '2026-11-23'];
    // volta: 23 ✓, 22 ✓, 21 ✓, 20 ✗ (perdão), 19 ✓, 18 ✗ (segunda falta na semana) → para
    expect(sequencia(dados(dias), '2026-11-23').dias).toBe(4);
  });
  it('registro atrasado vale pela data', () => {
    const antes = sequencia(dados(['2026-11-22', '2026-11-24', '2026-11-25']), '2026-11-25');
    const depois = sequencia(dados(['2026-11-22', '2026-11-23', '2026-11-24', '2026-11-25']), '2026-11-25');
    expect(depois.dias).toBe(antes.dias + 1);
  });
  it('informa se o perdão da semana já foi usado', () => {
    expect(sequencia(dados(['2026-11-23', '2026-11-25']), '2026-11-25').perdaoUsado).toBe(true);
    expect(sequencia(dados(['2026-11-23', '2026-11-24', '2026-11-25']), '2026-11-25').perdaoUsado).toBe(false);
  });
  it('não conta antes do início', () => {
    expect(sequencia(dados(['2026-11-24', '2026-11-25'], [], '2026-11-24'), '2026-11-25').dias).toBe(2);
  });
});

describe('dias juntos, nível e imagem', () => {
  it('nível sobe a cada 7 dias registrados', () => {
    const dias = Array.from({ length: 15 }, (_, i) => `2026-11-${String(i + 1).padStart(2, '0')}`);
    const d = dados(dias, ['2026-11-20']);
    expect(diasJuntos(d, '2026-11-25')).toBe(16);
    expect(nivelDe(16)).toBe(3);
    expect(nivelDe(0)).toBe(1);
    expect(nivelDe(7)).toBe(2);
  });
  it('humor segue o status', () => {
    expect(humorDoStatus('folga')).toBe('feliz');
    expect(humorDoStatus('limite')).toBe('preocupado');
    expect(humorDoStatus('passou')).toBe('abatido');
  });
  it('dormindo > fome > comemorando > humor', () => {
    expect(imagemDoPet('faminto', 'feliz', true)).toBe('dormindo');
    expect(imagemDoPet('fome', 'feliz', true)).toBe('fome');
    expect(imagemDoPet('alimentado', 'abatido', true)).toBe('comemorando');
    expect(imagemDoPet('alimentado', 'preocupado')).toBe('preocupado');
  });
});
