import { paraCentavos } from './dinheiro';
import type { Centavos } from './tipos';

const NUMERO = /^(r\$)?\d{1,6}([.,]\d{1,2})?$/i;

/**
 * "sorvete 20" → { descricao: 'sorvete', valor: 2000 }.
 * Aceita o número no começo ou no fim ("20 sorvete", "uber 12,50", "r$ 35 almoço").
 * Sem número, devolve valor null e a descrição inteira.
 */
export function interpretarTexto(texto: string): { descricao: string; valor: Centavos | null } {
  const tokens = texto.trim().replace(/r\$\s+/i, 'r$').split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { descricao: '', valor: null };
  const ultimo = tokens.length - 1;
  const idx = NUMERO.test(tokens[ultimo]) ? ultimo : NUMERO.test(tokens[0]) ? 0 : -1;
  if (idx === -1 || tokens.length === 1) {
    if (idx === 0 && tokens.length === 1) return { descricao: '', valor: paraCentavos(tokens[0]) };
    return { descricao: tokens.join(' '), valor: null };
  }
  const valor = paraCentavos(tokens[idx]);
  const resto = tokens.filter((_, i) => i !== idx).join(' ');
  return { descricao: resto, valor: valor && valor > 0 ? valor : null };
}
