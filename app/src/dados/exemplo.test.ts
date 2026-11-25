import { describe, expect, it } from 'vitest';
import { calcularSemana } from '../dominio/orcamento';
import { gerarExemplo } from './exemplo';

describe('dados de exemplo da prévia', () => {
  it('geram um cenário plausível e estável', () => {
    let n = 0;
    const id = () => 'id' + n++;
    const a = gerarExemplo('2026-11-26', id, new Date(2026, 10, 26, 23).getTime());
    const b = gerarExemplo('2026-11-26', id, new Date(2026, 10, 26, 23).getTime());
    expect(a.gastos.map(g => g.valor)).toEqual(b.gastos.map(g => g.valor));
    expect(a.inicio).toBe('2026-11-08');
    expect(a.gastos.length).toBeGreaterThan(20);
    const media = a.gastos.reduce((s, g) => s + g.valor, 0) / 19 / 100;
    expect(media).toBeGreaterThan(40);
    expect(media).toBeLessThan(110);
    const s = calcularSemana({ ...a, diasSemGasto: [], extras: [], fechamentos: [] }, '2026-11-26');
    expect(s.cota).toBeGreaterThan(0);
  });
});
