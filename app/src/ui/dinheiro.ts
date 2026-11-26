import * as d from '../dominio/dinheiro';
import { estado } from '../dados/estado.svelte';

/**
 * Formatação de dinheiro pras telas. Igual à do domínio, mas respeita o modo discreto
 * (Ajustes → "Esconder valores"): aí todo valor vira "R$ •••", sem sinal nem tamanho,
 * pra não dar pista. Exportações (arquivo, CSV) usam o domínio direto e não são afetadas.
 */
export const ESCONDIDO = 'R$ •••';

/** Lido dentro do template, é reativo: trocar o ajuste atualiza a tela na hora. */
export const escondendo = (): boolean => estado.ajustes.esconderValores === true;

export const brl = (c: number): string => (escondendo() ? ESCONDIDO : d.brl(c));
export const brl0 = (c: number): string => (escondendo() ? ESCONDIDO : d.brl0(c));
export const brl0Sinal = (c: number): string => (escondendo() ? ESCONDIDO : d.brl0Sinal(c));
