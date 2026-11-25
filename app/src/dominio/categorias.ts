import type { Categoria } from './tipos';

/** CAT: as 8 categorias iniciais (docs/02, seção 6). */
export const CATEGORIAS_PADRAO: Categoria[] = [
  { id: 'mercado', nome: 'Mercado', emoji: '🛒', essencial: true, ordem: 0, arquivada: false },
  { id: 'fora', nome: 'Comer fora', emoji: '🍔', essencial: false, ordem: 1, arquivada: false },
  { id: 'besteirinha', nome: 'Besteirinha', emoji: '🍦', essencial: false, ordem: 2, arquivada: false },
  { id: 'transporte', nome: 'Transporte', emoji: '🚗', essencial: true, ordem: 3, arquivada: false },
  { id: 'lazer', nome: 'Lazer', emoji: '🎉', essencial: false, ordem: 4, arquivada: false },
  { id: 'compras', nome: 'Compras', emoji: '🛍️', essencial: false, ordem: 5, arquivada: false },
  { id: 'saude', nome: 'Saúde', emoji: '💊', essencial: true, ordem: 6, arquivada: false },
  { id: 'outros', nome: 'Outros', emoji: '🎁', essencial: false, ordem: 7, arquivada: false },
];

/** Palavras que puxam cada categoria padrão (sem acento, minúsculas). */
export const PALAVRAS: Record<string, string[]> = {
  besteirinha: ['sorvete', 'cafe', 'cafezinho', 'doce', 'chocolate', 'lanche', 'lanchinho', 'pao de queijo', 'acai', 'chiclete', 'bala', 'refri', 'coxinha', 'pastel', 'salgado', 'bolo', 'cookie', 'brigadeiro', 'agua', 'suco', 'picole'],
  fora: ['almoco', 'jantar', 'ifood', 'restaurante', 'pizza', 'hamburguer', 'burger', 'sushi', 'delivery', 'marmita', 'self service', 'rodizio', 'lanchonete', 'temaki', 'esfiha', 'churrasco', 'pf', 'prato feito', 'rappi'],
  mercado: ['mercado', 'supermercado', 'feira', 'padaria', 'hortifruti', 'atacadao', 'acougue', 'sacolao', 'compras do mes'],
  transporte: ['uber', '99', 'onibus', 'metro', 'gasolina', 'estacionamento', 'combustivel', 'pedagio', 'taxi', 'trem', 'bilhete', 'bike', 'patinete', 'etanol', 'alcool', 'lavagem', 'oficina'],
  lazer: ['bar', 'cinema', 'show', 'jogo', 'ingresso', 'cerveja', 'role', 'balada', 'viagem', 'festa', 'teatro', 'museu', 'steam', 'boliche', 'karaoke', 'chopp', 'drink'],
  compras: ['roupa', 'camiseta', 'camisa', 'tenis', 'calca', 'livro', 'fone', 'shopee', 'amazon', 'mercado livre', 'shein', 'sapato', 'jaqueta', 'bermuda', 'perfume', 'eletronico', 'celular', 'capinha', 'cabo'],
  saude: ['farmacia', 'remedio', 'consulta', 'exame', 'dentista', 'medico', 'psicologo', 'terapia', 'vacina', 'drogaria'],
  outros: ['presente', 'doacao', 'taxa', 'tarifa', 'multa', 'vaquinha', 'pet', 'racao'],
};
