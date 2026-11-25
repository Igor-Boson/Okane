import { estado, novoId } from '../dados/estado.svelte';
import { mesDe, somarMeses } from '../dominio/datas';
import { tecladoParaCentavos } from '../dominio/dinheiro';
import { interpretarTexto } from '../dominio/texto';
import type { Centavos } from '../dominio/tipos';
import { ui } from './ui.svelte';

/** Valor e descrição do registro em andamento (teclado tem prioridade; senão, o número do texto: "sorvete 20"). */
export function registroAtual(): { valor: Centavos; descricao: string; doTexto: boolean } {
  const doTeclado = tecladoParaCentavos(ui.amt);
  if (doTeclado > 0) return { valor: doTeclado, descricao: ui.desc.trim(), doTexto: false };
  const t = interpretarTexto(ui.desc);
  if (t.valor) return { valor: t.valor, descricao: t.descricao, doTexto: true };
  return { valor: 0, descricao: ui.desc.trim(), doTexto: false };
}

/**
 * F1: registra e abre a reflexão (F2).
 * Compra parcelada (D5): a 1ª parcela entra como gasto agora; as outras viram compromisso no plano a partir do mês seguinte.
 */
export async function registrar(categoriaId: string, valor?: Centavos, descricao?: string) {
  const atual = registroAtual();
  const v = valor ?? atual.valor;
  const cat = estado.categoria(categoriaId);
  const d = (descricao ?? atual.descricao) || cat.nome;
  if (!(v > 0)) return;
  const data = ui.dataRegistro ?? estado.hoje;
  const voltando = estado.fome !== 'alimentado';
  const vezes = ui.parcelarEm > 1 ? ui.parcelarEm : 0;
  ui.limparRegistro();

  if (vezes) {
    const parcela = Math.round(v / vezes);
    const g = await estado.adicionarGasto({ data, valor: parcela, descricao: `${d} (1/${vezes})`, categoriaId });
    const parcelaId = novoId();
    await estado.salvarParcela({ id: parcelaId, nome: d, valor: parcela, primeiroMes: somarMeses(mesDe(data), 1), total: vezes - 1 });
    ui.abrir({ tipo: 'reflexao', gastoId: g.id, volta: voltando, parcelado: { vezes, total: v, parcelaId } });
    return;
  }

  const g = await estado.adicionarGasto({ data, valor: v, descricao: d, categoriaId });
  ui.abrir({ tipo: 'reflexao', gastoId: g.id, volta: voltando });
}
