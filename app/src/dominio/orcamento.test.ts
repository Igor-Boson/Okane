import { describe, expect, it } from 'vitest';
import {
  calcularSemana, contaDoMes, cotaDoSegmento, fecharSemana, infoParcela, mediaSemanal, minutosDeTrabalho,
  parcelasDoMes, parcelasTerminando, planoDoMes, reservaMensal, resumoDoMes, segmentosDaSemana, semanasAbertas, sugerirMeta,
  textoTempoDeTrabalho,
} from './orcamento';
import type { Dados, Gasto } from './tipos';

let seq = 0;
const g = (data: string, reais: number, categoriaId = 'fora', valeu: boolean | null = null): Gasto => ({
  id: 'g' + seq++, data, valor: Math.round(reais * 100), descricao: 'x', categoriaId, valeu, criadoEm: 0,
});

/** Mesmo cenário do protótipo: salário 5.000, fixos 2.300, parcelas 350 → livre 2.350 em novembro. */
function cenario(extra: Partial<Dados> = {}): Dados {
  return {
    inicio: '2026-11-01',
    planos: [{
      mes: '2026-11', salario: 500000, metaGuardar: 0,
      fixos: [{ id: 'f1', nome: 'Aluguel', valor: 150000 }, { id: 'f2', nome: 'Resto', valor: 80000 }],
    }],
    parcelas: [
      { id: 'p1', nome: 'Notebook', valor: 20000, primeiroMes: '2026-11', total: 4 },
      { id: 'p2', nome: 'Curso', valor: 15000, primeiroMes: '2026-10', total: 3 },
    ],
    extras: [],
    fechamentos: [],
    diasSemGasto: [],
    gastos: [
      g('2026-11-02', 1000), g('2026-11-10', 889), g('2026-11-22', 4), // 1.893 antes da semana
      g('2026-11-23', 96, 'mercado'), g('2026-11-23', 22, 'transporte'), g('2026-11-24', 38), g('2026-11-24', 8, 'besteirinha'), g('2026-11-25', 6, 'besteirinha'),
    ],
    ...extra,
  };
}

describe('plano e parcelas', () => {
  it('fixo pago a cada N meses reserva valor ÷ N por mês', () => {
    expect(reservaMensal({ id: 'a', nome: 'Seguro', valor: 50000, cada: 2 })).toBe(25000);
    expect(reservaMensal({ id: 'b', nome: 'IPVA', valor: 100000, cada: 3 })).toBe(33333);
    expect(reservaMensal({ id: 'c', nome: 'Luz', valor: 18000 })).toBe(18000);
    const d = cenario();
    d.planos[0].fixos.push({ id: 'f3', nome: 'Bimestral', valor: 50000, cada: 2 });
    const c = contaDoMes(d, '2026-11');
    expect(c.fixos).toBe(230000 + 25000);
    expect(c.livre).toBe(500000 - 255000 - 35000);
  });

  it('herda o plano mais recente quando o mês não tem um', () => {
    const d = cenario();
    expect(planoDoMes(d, '2026-12')?.mes).toBe('2026-11');
    expect(planoDoMes(d, '2026-11')?.mes).toBe('2026-11');
    expect(planoDoMes(d, '2026-10')?.mes).toBe('2026-11'); // sem anterior: usa o mais antigo
  });

  it('calcula parcelas do mês e quantas faltam (R5)', () => {
    const d = cenario();
    const nov = parcelasDoMes(d, '2026-11');
    expect(nov.map(p => p.parcela.nome)).toEqual(['Notebook', 'Curso']);
    expect(infoParcela(d.parcelas[0], '2026-11')).toMatchObject({ numero: 1, faltam: 4, ultimoMes: '2027-02' });
    expect(infoParcela(d.parcelas[1], '2026-11')).toMatchObject({ numero: 2, faltam: 2, ultimoMes: '2026-12' });
    expect(parcelasDoMes(d, '2027-01').map(p => p.parcela.nome)).toEqual(['Notebook']);
    expect(parcelasTerminando(d, '2026-12').map(p => p.nome)).toEqual(['Curso']);
  });

  it('livre do mês = salário − fixos − parcelas − meta', () => {
    const d = cenario();
    expect(contaDoMes(d, '2026-11').livre).toBe(235000);
    // em janeiro o curso já acabou: +150 livres
    expect(contaDoMes(d, '2027-01').livre).toBe(250000);
  });

  it('mês antes do início não tem dinheiro livre', () => {
    expect(contaDoMes(cenario(), '2026-10').livre).toBe(0);
  });
});

describe('número da semana (E2 + R1)', () => {
  it('reproduz o exemplo do protótipo: cota R$ 400, pode R$ 230, ≈ R$ 46/dia', () => {
    const s = calcularSemana(cenario(), '2026-11-25');
    expect(s.segunda).toBe('2026-11-23');
    expect(s.domingo).toBe('2026-11-29');
    expect(s.cota).toBeCloseTo(39987.5);
    expect(s.gasto).toBe(17000);
    expect(s.pode).toBeCloseTo(22987.5);
    expect(s.diasRestantes).toBe(5);
    expect(s.porDia).toBeCloseTo(4597.5);
    expect(s.status).toBe('folga');
    expect(s.fracaoVivida).toBeCloseTo(3 / 7);
  });

  it('fica 🟡 acima do ritmo + 1 dia de tolerância, e 🔴 acima da cota', () => {
    const d = cenario();
    d.gastos.push(g('2026-11-25', 60)); // 230 > 228,50
    expect(calcularSemana(d, '2026-11-25').status).toBe('limite');
    d.gastos.push(g('2026-11-25', 175)); // 405 > 399,88
    const s = calcularSemana(d, '2026-11-25');
    expect(s.status).toBe('passou');
    expect(s.pode).toBeLessThan(0);
    expect(s.porDia).toBe(0);
  });

  it('um gasto na segunda de manhã não deixa amarelo (tolerância)', () => {
    const d = cenario();
    d.gastos = d.gastos.filter(x => x.data < '2026-11-23');
    d.gastos.push(g('2026-11-23', 100)); // ritmo de 1 dia = 57; com tolerância = 114
    expect(calcularSemana(d, '2026-11-23').status).toBe('folga');
  });

  it('folga e estouro de semanas anteriores passam pra frente', () => {
    const base = calcularSemana(cenario(), '2026-11-25').cota;
    const gastouMenos = cenario();
    gastouMenos.gastos = gastouMenos.gastos.filter(x => x.data !== '2026-11-22');
    expect(calcularSemana(gastouMenos, '2026-11-25').cota).toBeGreaterThan(base);
    const gastouMais = cenario();
    gastouMais.gastos.push(g('2026-11-20', 300));
    expect(calcularSemana(gastouMais, '2026-11-25').cota).toBeCloseTo(base - 30000 * 7 / 8);
  });

  it('gasto da própria semana não muda a cota (o número só cai pelo gasto)', () => {
    const d = cenario();
    const antes = calcularSemana(d, '2026-11-25');
    d.gastos.push(g('2026-11-25', 50));
    const depois = calcularSemana(d, '2026-11-25');
    expect(depois.cota).toBeCloseTo(antes.cota);
    expect(depois.pode).toBeCloseTo(antes.pode - 5000);
  });

  it('registro retroativo cai na semana certa e corrige tudo (R4)', () => {
    const d = cenario();
    const antes = calcularSemana(d, '2026-11-25');
    d.gastos.push(g('2026-11-18', 80)); // semana passada
    const depois = calcularSemana(d, '2026-11-25');
    expect(depois.gasto).toBe(antes.gasto);
    expect(depois.cota).toBeCloseTo(antes.cota - 8000 * 7 / 8);
  });

  it('mês já estourado: cota ≤ 0 deixa vermelho', () => {
    const d = cenario();
    d.gastos.push(g('2026-11-15', 3000));
    const s = calcularSemana(d, '2026-11-25');
    expect(s.cota).toBeLessThan(0);
    expect(s.status).toBe('passou');
  });
});

describe('semana que cruza a virada do mês (R8)', () => {
  it('divide a semana em duas partes', () => {
    expect(segmentosDaSemana('2026-11-30')).toEqual([
      { mes: '2026-11', de: '2026-11-30', ate: '2026-11-30' },
      { mes: '2026-12', de: '2026-12-01', ate: '2026-12-06' },
    ]);
  });

  it('no dia 30 (ainda novembro) soma a cota de cada mês e mostra um número só', () => {
    const d = cenario();
    const s = calcularSemana(d, '2026-11-30');
    const nov = (235000 - (189300 + 17000)) * 1 / 1; // o que sobrou de novembro cai inteiro no dia 30
    const dez = 235000 * 6 / 31; // em dezembro: notebook (2/4) + curso (3/3)
    expect(s.cota).toBeCloseTo(nov + dez);
  });

  it('virou o mês: a sobra de novembro vai pro guardado e some da semana', () => {
    const d = cenario();
    d.gastos.push(g('2026-11-30', 50), g('2026-12-01', 30));
    const s = calcularSemana(d, '2026-12-02');
    const dez = 235000 * 6 / 31;
    expect(s.cota).toBeCloseTo(dez + 5000); // a parte de novembro vale só o que foi gasto nela
    expect(s.gasto).toBe(8000);
    expect(s.pode).toBeCloseTo(dez - 3000);
  });

  it('virou o mês: estouro de novembro também fica em novembro', () => {
    const d = cenario();
    d.gastos.push(g('2026-11-30', 900)); // estoura novembro
    const s = calcularSemana(d, '2026-12-02');
    expect(s.pode).toBeCloseTo(235000 * 6 / 31);
  });

  it('cada gasto conta no mês da sua data', () => {
    const d = cenario();
    d.gastos.push(g('2026-11-30', 50), g('2026-12-01', 70));
    expect(resumoDoMes(d, '2026-11').gasto).toBe(189300 + 17000 + 5000);
    expect(resumoDoMes(d, '2026-12').gasto).toBe(7000);
  });
});

describe('primeiro mês proporcional', () => {
  it('quem começa no meio do mês recebe só a parte proporcional', () => {
    const d = cenario({ inicio: '2026-11-26', gastos: [] });
    const conta = contaDoMes(d, '2026-11');
    expect(conta.fator).toBeCloseTo(5 / 30);
    expect(conta.livre).toBeCloseTo(235000 * 5 / 30);
    const s = calcularSemana(d, '2026-11-26');
    // trecho 26–29 (4 dias) de 5 dias restantes no mês
    expect(s.cota).toBeCloseTo(conta.livre * 4 / 5);
    expect(s.fracaoVivida).toBeCloseTo(1 / 4);
  });

  it('ignora gastos com data anterior ao início', () => {
    const d = cenario({ inicio: '2026-11-26' });
    expect(calcularSemana(d, '2026-11-26').gasto).toBe(0);
  });
});

describe('fechamento da semana (R2)', () => {
  it('sobrou: dá pra escolher entre guardar e passar pra frente', () => {
    const d = cenario();
    const f = fecharSemana(d, '2026-11-23');
    expect(f.cota).toBeCloseTo(39987.5);
    expect(f.sobra).toBeCloseTo(22987.5);
    expect(f.escolhivel).toBe(22987);
    expect(f.cruzaMes).toBe(false);
    expect(f.porCategoria[0][0]).toBe('mercado');
  });

  it('guardar tira o valor do livre do mês nas semanas seguintes', () => {
    const d = cenario();
    d.gastos = d.gastos.filter(x => x.data < '2026-11-23');
    const semAntes = calcularSemana(d, '2026-11-25').cota;
    d.fechamentos.push({ semana: '2026-11-16', decisao: 'guardar', valor: 10000, criadoEm: 0 });
    expect(calcularSemana(d, '2026-11-25').cota).toBeCloseTo(semAntes - 10000 * 7 / 8);
    // passar pra frente não muda nada
    d.fechamentos = [{ semana: '2026-11-16', decisao: 'frente', valor: 10000, criadoEm: 0 }];
    expect(calcularSemana(d, '2026-11-25').cota).toBeCloseTo(semAntes);
  });

  it('estourou: sem escolha', () => {
    const d = cenario();
    d.gastos.push(g('2026-11-26', 500));
    const f = fecharSemana(d, '2026-11-23');
    expect(f.sobra).toBeLessThan(0);
    expect(f.escolhivel).toBe(0);
  });

  it('semana que termina no último dia do mês: sobra vai direto pro guardado', () => {
    // maio/2026 termina num domingo
    const d = cenario({ inicio: '2026-05-01', planos: [{ mes: '2026-05', salario: 300000, fixos: [], metaGuardar: 0 }], parcelas: [], gastos: [] });
    const f = fecharSemana(d, '2026-05-25');
    expect(f.terminaNoFimDoMes).toBe(true);
    expect(f.sobra).toBeGreaterThan(0);
    expect(f.escolhivel).toBe(0);
  });

  it('semana que cruza o mês: só a parte do mês novo é escolhível', () => {
    const d = cenario();
    const f = fecharSemana(d, '2026-11-30');
    expect(f.cruzaMes).toBe(true);
    expect(f.sobraDoMesAnterior).toBeCloseTo(235000 - 189300 - 17000);
    expect(f.escolhivel).toBe(Math.floor(235000 * 6 / 31));
    expect(f.cota).toBeCloseTo(235000 * 6 / 31); // a parte de novembro (sem gastos) não entra
    expect(f.sobra).toBeCloseTo(235000 * 6 / 31);
  });

  it('lista semanas terminadas e ainda abertas', () => {
    const d = cenario();
    expect(semanasAbertas(d, '2026-11-25')).toEqual(['2026-10-26', '2026-11-02', '2026-11-09', '2026-11-16']);
    d.fechamentos.push({ semana: '2026-11-16', decisao: 'frente', valor: 0, criadoEm: 0 });
    expect(semanasAbertas(d, '2026-11-25')).toEqual(['2026-10-26', '2026-11-02', '2026-11-09']);
  });
});

describe('fechamento do mês (R3) e entradas extras (R6)', () => {
  it('sobra do mês vira guardado e não passa pro mês seguinte', () => {
    const d = cenario();
    const r = resumoDoMes(d, '2026-11');
    expect(r.gasto).toBe(206300);
    expect(r.sobra).toBe(235000 - 206300);
    expect(r.guardadoTotal).toBe(235000 - 206300);
    expect(r.estouro).toBe(0);
    // dezembro começa limpo
    expect(contaDoMes(d, '2026-12').livre).toBe(235000);
  });

  it('meta de guardar e guardado das semanas entram no guardado total', () => {
    const d = cenario();
    d.planos[0].metaGuardar = 30000;
    d.fechamentos.push({ semana: '2026-11-16', decisao: 'guardar', valor: 5000, criadoEm: 0 });
    const r = resumoDoMes(d, '2026-11');
    expect(r.conta.livre).toBe(205000);
    expect(r.sobra).toBe(205000 - 206300 - 5000);
    expect(r.estouro).toBe(6300);
    expect(r.guardadoTotal).toBe(30000 + 5000);
  });

  it('13º vai pro guardado por padrão; só o liberado entra na cota', () => {
    const d = cenario();
    d.extras.push({ id: 'x', mes: '2026-12', descricao: '13º', valor: 400000, liberado: 50000 });
    const c = contaDoMes(d, '2026-12');
    expect(c.livre).toBe(235000 + 50000);
    expect(c.extrasGuardados).toBe(350000);
    expect(resumoDoMes(d, '2026-12').guardadoTotal).toBeCloseTo(235000 + 50000 + 350000);
  });

  it('avisa as parcelas que terminam no mês', () => {
    expect(resumoDoMes(cenario(), '2026-12').parcelasTerminando.map(p => p.nome)).toEqual(['Curso']);
  });
});

describe('cota de um trecho', () => {
  it('trecho antes do início vale zero', () => {
    const d = cenario({ inicio: '2026-11-26' });
    expect(cotaDoSegmento(d, { mes: '2026-11', de: '2026-11-23', ate: '2026-11-25' })).toBe(0);
  });
});

describe('utilidades', () => {
  it('sugere meta de ~75% da sobra, em dezenas de reais', () => {
    expect(sugerirMeta(40000)).toBe(30000);
    expect(sugerirMeta(12345)).toBe(9000);
    expect(sugerirMeta(-100)).toBe(0);
  });

  it('média semanal considera só os dias em uso', () => {
    const c = contaDoMes(cenario(), '2026-11');
    expect(mediaSemanal(c)).toBeCloseTo(235000 * 7 / 30);
  });

  it('custo em horas de trabalho', () => {
    expect(minutosDeTrabalho(2000, 500000, 160)).toBe(38);
    expect(minutosDeTrabalho(2000, 500000, 0)).toBeNull();
    expect(textoTempoDeTrabalho(38)).toBe('38 min');
    expect(textoTempoDeTrabalho(90)).toBe('1h30');
    expect(textoTempoDeTrabalho(120)).toBe('2h');
    expect(textoTempoDeTrabalho(600)).toBe('10h');
    expect(textoTempoDeTrabalho(610)).toBe('10,2h');
  });
});
