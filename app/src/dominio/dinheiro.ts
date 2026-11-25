import type { Centavos } from './tipos';

const nf0 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0, minimumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Troca o espaço especial do Intl por um espaço normal (mais previsível em testes e cópia). */
const limpa = (s: string) => s.replace(/ /g, ' ');

/** "R$ 20" ou "R$ 12,50": mostra centavos só quando existem. */
export function brl(c: Centavos): string {
  const v = c / 100;
  return limpa((Number.isInteger(Math.round(c) / 100) ? nf0 : nf2).format(v));
}

/** Sempre arredondado pra reais: "R$ 230". Pra números grandes de resumo. */
export function brl0(c: Centavos): string {
  return limpa(nf0.format(Math.round(c / 100)));
}

/** Como brl0, mas com sinal de menos tipográfico quando negativo. */
export function brl0Sinal(c: Centavos): string {
  return c < 0 ? '−' + brl0(-c) : brl0(c);
}

/** Converte texto digitado ("20", "12,5", "12.50", "R$ 1.234,56") em centavos. Retorna null se inválido. */
export function paraCentavos(texto: string): Centavos | null {
  let t = texto.trim().replace(/^r\$\s*/i, '').replace(/\s/g, '');
  if (!t) return null;
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(t)) t = t.replace(/\./g, '').replace(',', '.');
  else t = t.replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  return Math.round(parseFloat(t) * 100);
}

/** Texto do teclado ("12,5") → centavos. Vazio vira 0. */
export function tecladoParaCentavos(texto: string): Centavos {
  if (!texto) return 0;
  return paraCentavos(texto) ?? 0;
}

/** Centavos → texto editável ("12,50" ou "20"). */
export function centavosParaTexto(c: Centavos): string {
  if (c % 100 === 0) return String(c / 100);
  return (c / 100).toFixed(2).replace('.', ',');
}
