import { estado } from '../dados/estado.svelte';
import { mesDe, somarDias, somarMeses } from '../dominio/datas';
import { fala } from '../dominio/falas';
import { semanasAbertas } from '../dominio/orcamento';
import { diasComRegistro } from '../dominio/pet';
import { ui } from './ui.svelte';

const jaMostrado = new Set<string>();

/**
 * Ao abrir o app (ou voltar pra ele): fechamento do mês (R3), da semana (R2), check de ontem (F3) e nível novo.
 * Nessa ordem, um de cada vez.
 */
export async function verificarAberturas() {
  const inicio = estado.ajustes.inicio;
  if (!inicio) return;
  estado.atualizarHoje();
  const hoje = estado.hoje;

  // R3: mês anterior ainda não fechado
  const mesAnterior = somarMeses(estado.mes, -1);
  if (mesAnterior >= mesDe(inicio) && !estado.meses.some(m => m.mes === mesAnterior) && !jaMostrado.has('mes:' + mesAnterior)) {
    jaMostrado.add('mes:' + mesAnterior);
    ui.enfileirar({ tipo: 'mes', mes: mesAnterior });
  }

  // R2: semanas terminadas. As antigas fecham sozinhas (a folga passa pra frente); a última pergunta.
  const abertas = semanasAbertas(estado.dados, hoje);
  for (const s of abertas.slice(0, -1)) {
    await estado.fecharSemana({ semana: s, decisao: 'automatico', valor: 0, criadoEm: Date.now() });
  }
  const ultima = abertas[abertas.length - 1];
  if (ultima && !jaMostrado.has('semana:' + ultima)) {
    jaMostrado.add('semana:' + ultima);
    ui.enfileirar({ tipo: 'semana', segunda: ultima });
  }

  // F3: ontem sem nenhum registro
  const ontem = somarDias(hoje, -1);
  if (estado.ajustes.ultimoCheckOntem !== hoje && ontem >= inicio && !diasComRegistro(estado.dados).has(ontem)) {
    ui.enfileirar({ tipo: 'ontem', data: ontem });
    await estado.ajustar({ ultimoCheckOntem: hoje }, true);
  }

  // PET-R4: subiu de nível
  if (estado.nivel > estado.ajustes.nivelVisto) {
    ui.festejar(fala('nivel', estado.ajustes.tom, { n: estado.nivel }));
    await estado.ajustar({ nivelVisto: estado.nivel }, true);
  }
}
