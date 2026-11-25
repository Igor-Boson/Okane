import { describe, expect, it } from 'vitest';
import { chaveLancamento, conferir, lerData, lerExtrato, lerValor, limparDescricao } from './extrato';
import type { Gasto } from './tipos';

describe('leitura de datas e valores', () => {
  it('datas', () => {
    expect(lerData('25/11/2026')).toBe('2026-11-25');
    expect(lerData('5/1/26')).toBe('2026-01-05');
    expect(lerData('2026-11-25')).toBe('2026-11-25');
    expect(lerData('20261125120000[-3:BRT]')).toBe('2026-11-25');
    expect(lerData('ontem')).toBeNull();
  });
  it('valores', () => {
    expect(lerValor('-1.234,56')).toBe(-123456);
    expect(lerValor('20,5')).toBe(2050);
    expect(lerValor('-20.00')).toBe(-2000);
    expect(lerValor('1,234.56')).toBe(123456);
    expect(lerValor('R$ 35,90')).toBe(3590);
    expect(lerValor('(12.00)')).toBe(-1200);
    expect(lerValor('abc')).toBeNull();
  });
});

describe('lerExtrato', () => {
  it('OFX: pega só as saídas', () => {
    const ofx = `OFXHEADER:100
<OFX><BANKMSGSRSV1><STMTTRNRS><STMTRS><BANKTRANLIST>
<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20261124000000[-3:BRT]<TRNAMT>-20.00<MEMO>Sorveteria Gelato
</STMTTRN>
<STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20261124000000[-3:BRT]<TRNAMT>500.00<MEMO>Pix recebido
</STMTTRN>
<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20261125000000[-3:BRT]<TRNAMT>-38.50<NAME>Restaurante Bom
</STMTTRN>
</BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>`;
    expect(lerExtrato(ofx)).toEqual([
      { data: '2026-11-24', valor: 2000, descricao: 'Sorveteria Gelato' },
      { data: '2026-11-25', valor: 3850, descricao: 'Restaurante Bom' },
    ]);
  });

  it('CSV de conta (saída negativa, vírgula)', () => {
    const csv = 'Data,Valor,Identificador,Descrição\n24/11/2026,-20.00,abc,Compra no débito - Sorveteria\n24/11/2026,1500.00,def,Transferência recebida\n25/11/2026,-12.50,ghi,Pix enviado - Uber\n';
    const l = lerExtrato(csv);
    expect(l.map(x => x.valor)).toEqual([2000, 1250]);
    expect(l[1].descricao).toBe('Pix enviado - Uber');
  });

  it('CSV de fatura de cartão (compra positiva) ignora pagamento', () => {
    const csv = 'date,title,amount\n2026-11-20,Sorveteria,20.00\n2026-11-21,Pagamento recebido,-300.00\n2026-11-22,"Loja, Centro",89.90\n';
    expect(lerExtrato(csv)).toEqual([
      { data: '2026-11-20', valor: 2000, descricao: 'Sorveteria' },
      { data: '2026-11-22', valor: 8990, descricao: 'Loja, Centro' },
    ]);
  });

  it('CSV com ponto e vírgula e valores brasileiros', () => {
    const csv = 'Data;Histórico;Valor\n24/11/2026;COMPRA CARTAO;-1.234,56\n25/11/2026;PAGAMENTO DE FATURA;-500,00\n';
    expect(lerExtrato(csv)).toEqual([{ data: '2026-11-24', valor: 123456, descricao: 'COMPRA CARTAO' }]);
  });

  it('arquivo sem colunas reconhecíveis devolve vazio', () => {
    expect(lerExtrato('a,b,c\n1,2,3')).toEqual([]);
  });
});

const gasto = (data: string, valor: number, id = data + valor): Gasto => ({ id, data, valor, descricao: '', categoriaId: 'fora', valeu: null, criadoEm: 0 });

describe('conferir', () => {
  const lanc = [
    { data: '2026-11-24', valor: 2000, descricao: 'Sorveteria' },
    { data: '2026-11-25', valor: 3850, descricao: 'Restaurante' },
    { data: '2026-11-25', valor: 3850, descricao: 'Restaurante' },
    { data: '2026-11-26', valor: 150000, descricao: 'Aluguel' },
    { data: '2026-11-10', valor: 999, descricao: 'Antes do início' },
  ];

  it('casa por valor e data próxima; o resto falta', () => {
    const r = conferir(lanc, [gasto('2026-11-25', 2000), gasto('2026-11-25', 3850)], '2026-11-20', [150000]);
    expect(r.total).toBe(4);
    expect(r.encontrados).toBe(2);
    expect(r.faltando).toEqual([{ data: '2026-11-25', valor: 3850, descricao: 'Restaurante' }]);
    expect(r.provaveisFixos.map(x => x.descricao)).toEqual(['Aluguel']);
    expect(r.completude).toBeCloseTo(2 / 3);
  });

  it('um gasto registrado só casa com um lançamento', () => {
    const r = conferir(lanc.slice(1, 3), [gasto('2026-11-25', 3850)], '2026-11-20');
    expect(r.encontrados).toBe(1);
    expect(r.faltando).toHaveLength(1);
  });

  it('data longe demais não casa', () => {
    const r = conferir([lanc[0]], [gasto('2026-11-28', 2000)], '2026-11-20');
    expect(r.encontrados).toBe(0);
  });

  it('ignorados somem da conferência', () => {
    const r = conferir([lanc[0]], [], '2026-11-20', [], [chaveLancamento(lanc[0])]);
    expect(r.total).toBe(0);
    expect(r.completude).toBe(1);
  });
});

describe('limparDescricao', () => {
  it.each([
    ['Compra no débito - SORVETERIA GELATO LTDA', 'Sorveteria Gelato'],
    ['Pix enviado - Uber do Brasil', 'Uber do Brasil'],
    ['COMPRA CARTAO', 'Compra Cartao'],
    ['iFood', 'iFood'],
  ])('%s', (entrada, saida) => {
    expect(limparDescricao(entrada)).toBe(saida);
  });
});
