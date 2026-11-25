<script lang="ts">
  import { urlPet } from '../imagens';
  import { onDestroy, untrack } from 'svelte';
  import { estado } from '../../dados/estado.svelte';
  import { nomeMes, periodoSemana, mesDe } from '../../dominio/datas';
  import { brl, brl0 } from '../../dominio/dinheiro';
  import { fala } from '../../dominio/falas';
  import { fecharSemana } from '../../dominio/orcamento';
  import type { FechamentoSemana } from '../../dominio/tipos';
  import { ui } from '../ui.svelte';

  let { segunda }: { segunda: string } = $props();

  // fotografia do momento em que a folha abriu
  const f = untrack(() => fecharSemana(estado.dados, segunda));
  const tom = estado.ajustes.tom;
  const sobrou = f.sobra >= 100;
  const maior = f.porCategoria[0];
  // J4 (v1): revisão atrasada do "valeu a pena?", mais honesta que na hora
  const pendentes = f.gastos.filter(g => g.valeu === null && !estado.categoria(g.categoriaId).essencial).slice(-8).reverse();
  let respondidos = $state<Record<string, boolean>>({});
  let decidido = $state(false);
  let frase = $state(
    f.escolhivel > 0 ? fala('sobra', tom, { v: brl0(f.escolhivel) })
      : sobrou ? fala('sobraAutomatica', tom, { v: brl0(f.sobra) })
      : fala('estourouSemana', tom),
  );

  async function decidir(decisao: FechamentoSemana['decisao']) {
    decidido = true;
    await estado.fecharSemana({ semana: segunda, decisao, valor: decisao === 'automatico' ? 0 : f.escolhivel, criadoEm: Date.now() });
    if (decisao === 'guardar') frase = fala('guardou', tom);
    else if (decisao === 'frente') frase = fala('frente', tom);
    if (decisao === 'automatico') ui.fechar();
  }

  async function responder(id: string, valeu: boolean) {
    respondidos = { ...respondidos, [id]: valeu };
    await estado.alterarGasto(id, { valeu });
  }

  // fechar sem escolher = passa pra frente (R2)
  onDestroy(() => {
    if (!decidido) void estado.fecharSemana({ semana: segunda, decisao: f.escolhivel > 0 ? 'frente' : 'automatico', valor: f.escolhivel, criadoEm: Date.now() });
  });
</script>

<div class="pilha">
  <h2>Semana {periodoSemana(segunda)} fechada</h2>
  <div class="stats">
    <div class="stat"><div class="k">Gastou</div><div class="v">{brl0(f.gasto)} <span class="de">de {brl0(f.cota)}</span></div></div>
    <div class="stat"><div class="k">Quem mais levou</div><div class="v">{maior ? `${estado.categoria(maior[0]).emoji} ${brl0(maior[1])}` : '—'}</div></div>
    <div class="stat"><div class="k">👎 Não valeu</div><div class="v">{brl0(f.naoValeu)}</div></div>
    <div class="stat"><div class="k">Sequência</div><div class="v">{estado.seq.dias} {estado.seq.dias === 1 ? 'dia' : 'dias'}{estado.seq.dias >= 2 ? ' 🔥' : ''}</div></div>
  </div>

  <div class="fala"><img src={urlPet(sobrou ? 'comemorando' : 'abatido')} alt="" /><p>{frase}</p></div>

  {#if f.cruzaMes && f.sobraDoMesAnterior > 0}
    <p class="nota">{brl0(f.sobraDoMesAnterior)} da parte de {nomeMes(mesDe(segunda))} ficam no fechamento daquele mês.</p>
  {/if}

  {#if !decidido}
    {#if f.escolhivel > 0}
      <div class="btn-linha">
        <button class="btn ouro" type="button" onclick={() => decidir('guardar')}>🐷 Guardar {brl0(f.escolhivel)}</button>
        <button class="btn suave" type="button" onclick={() => decidir('frente')}>➡️ Usar nas próximas</button>
      </div>
    {:else}
      <button class="btn primario" type="button" onclick={() => decidir('automatico')}>Entendi</button>
    {/if}
  {:else}
    <button class="btn primario" type="button" onclick={() => ui.fechar()}>Fechar</button>
  {/if}

  {#if pendentes.length}
    <div class="revisao">
      <div class="rotulo">Olhando agora, valeu a pena?</div>
      {#each pendentes as g (g.id)}
        <div class="rev-linha">
          <span class="d">{estado.categoria(g.categoriaId).emoji} {g.descricao}</span>
          <span class="v num">{brl(g.valor)}</span>
          {#if respondidos[g.id] === undefined}
            <button type="button" aria-label="Valeu" onclick={() => responder(g.id, true)}>👍</button>
            <button type="button" aria-label="Não valeu" onclick={() => responder(g.id, false)}>👎</button>
          {:else}
            <span class="resp">{respondidos[g.id] ? '👍' : '👎'}</span>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .de { font-family: var(--f-body); font-size: 12px; color: var(--muted); font-weight: 500; }
  .revisao { display: grid; gap: 4px; border-top: 1px solid var(--line); padding-top: 12px; }
  .rev-linha { display: grid; grid-template-columns: 1fr auto 40px 40px; align-items: center; gap: 6px; min-height: 44px; }
  .rev-linha .d { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .rev-linha .v { font-weight: 600; font-size: 15px; }
  .rev-linha button { height: 38px; border-radius: 12px; background: var(--surface-2); font-size: 17px; }
  .resp { grid-column: span 2; text-align: center; font-size: 17px; }
</style>
