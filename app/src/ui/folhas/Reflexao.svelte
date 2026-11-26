<script lang="ts">
  import { urlPet } from '../imagens';
  import { onDestroy, onMount, untrack } from 'svelte';
  import { estado } from '../../dados/estado.svelte';
  import { periodoSemana, rotuloDia, segundaDaSemana } from '../../dominio/datas';
  import { brl, brl0, escondendo } from '../dinheiro';
  import { fala } from '../../dominio/falas';
  import { minutosDeTrabalho, textoTempoDeTrabalho } from '../../dominio/orcamento';
  import { imagemDoPet } from '../../dominio/pet';
  import { ui } from '../ui.svelte';

  let { gastoId, volta = false, parcelado }: {
    gastoId: string; volta?: boolean; parcelado?: { vezes: number; total: number; parcelaId: string };
  } = $props();

  // valores fixados no momento do registro (o cartão não muda se algo mudar por trás)
  const { volta: voltando, parcelado: parc } = untrack(() => ({ volta, parcelado }));
  const g = estado.gastos.find(x => x.id === gastoId);
  const cat = g ? estado.categoria(g.categoriaId) : null;
  const s = estado.semana;
  const daSemana = !!g && segundaDaSemana(g.data) === s.segunda;
  const valorRef = parc ? parc.total : (g?.valor ?? 0);
  const grande = daSemana && s.cota > 0 && (g?.valor ?? 0) > 0.3 * s.cota;
  const pct = s.cota > 0 && g ? Math.round((g.valor / s.cota) * 100) : 0;
  const minutos = estado.ajustes.horasPorMes ? minutosDeTrabalho(valorRef, estado.contaMes.salario, estado.ajustes.horasPorMes) : null;
  const tom = estado.ajustes.tom;
  const primeiro = estado.gastos.length === 1;
  const imagem = imagemDoPet(estado.fome, estado.humor, voltando || primeiro);
  let frase = $state(fala(voltando ? 'volta' : primeiro ? 'primeiro' : grande ? 'grande' : 'registro', tom, { v: brl0(valorRef), pct }));
  let respondido = $state<boolean | null>(g?.valeu ?? null);

  const DURACAO = 7000;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let barra: HTMLSpanElement | undefined = $state();

  function contar(ms = DURACAO) {
    if (timer) clearTimeout(timer);
    if (barra) {
      barra.style.transition = 'none';
      barra.style.transform = 'scaleX(1)';
      void barra.offsetWidth;
      barra.style.transition = `transform ${ms}ms linear`;
      barra.style.transform = 'scaleX(0)';
    }
    timer = setTimeout(() => ui.fechar(), ms);
  }

  onMount(() => {
    if (!g) { ui.fechar(); return; }
    contar();
  });
  onDestroy(() => { if (timer) clearTimeout(timer); });

  async function responder(valeu: boolean) {
    if (!g) return;
    respondido = valeu;
    await estado.alterarGasto(g.id, { valeu });
    frase = fala(valeu ? 'sim' : 'nao', tom);
    contar(2600);
  }

  async function desfazer() {
    if (!g) return;
    if (timer) clearTimeout(timer);
    await estado.apagarGasto(g.id);
    if (parc) await estado.apagarParcela(parc.parcelaId);
    ui.fechar();
    ui.avisar('Desfeito');
  }
</script>

{#if g && cat}
  <div class="pilha" role="presentation" onpointerdown={() => contar()}>
    <div class="topo-r">
      <span class="titulo">{grande ? '⚠️' : '✅'} {cat.emoji} {g.descricao} · {brl(g.valor)}</span>
      <button class="link" type="button" onclick={desfazer}>desfazer</button>
    </div>
    <div class="impacto">
      {#if parc}
        <span class="destaque">Total de {brl(parc.total)} em {parc.vezes}× de {brl(g.valor)}.</span>
        <span class="linha">As outras {parc.vezes - 1} parcelas já ficam reservadas no plano dos próximos meses.</span>
      {/if}
      {#if grande}<span class="destaque">Isso é {pct}% da tua semana.</span>{/if}
      {#if daSemana}
        {#if s.pode >= 0}Sobram <b>{brl0(s.pode)}</b> na semana (≈ {brl0(s.porDia)}/dia){:else}Passou <b>{brl0(-s.pode)}</b> da cota da semana{/if}
      {:else}
        Contou em {rotuloDia(g.data, estado.hoje).toLowerCase()}, na semana de {periodoSemana(segundaDaSemana(g.data))}.
      {/if}
      {#if minutos && !escondendo()}<span class="linha">⏱️ ≈ {textoTempoDeTrabalho(minutos)} do teu trabalho.</span>{/if}
    </div>
    <div class="fala"><img src={urlPet(imagem)} alt="" /><p>{frase}</p></div>
    {#if !cat.essencial && respondido === null}
      <div class="valeu">
        <span class="q">Valeu a pena?</span>
        <button class="vb" type="button" aria-label="Valeu a pena" onclick={() => responder(true)}>👍</button>
        <button class="vb" type="button" aria-label="Não valeu" onclick={() => responder(false)}>👎</button>
        <button class="vb pular" type="button" onclick={() => ui.fechar()}>pular</button>
      </div>
    {/if}
    <div class="tempo"><span bind:this={barra}></span></div>
  </div>
{/if}

<style>
  .topo-r { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
  .titulo { font-weight: 700; font-size: 16px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .impacto { font-size: 15px; color: var(--muted); line-height: 1.45; }
  .impacto b { color: var(--ink); }
  .destaque { color: var(--warn); font-weight: 700; display: block; }
  .linha { display: block; }
  .valeu { display: flex; align-items: center; gap: 8px; }
  .q { flex: 1; font-weight: 600; }
  .vb { height: 44px; min-width: 54px; padding: 0 12px; border-radius: 14px; background: var(--surface-2); font-size: 20px; }
  .pular { font-size: 13px; font-weight: 600; color: var(--muted); background: transparent; }
  .tempo { height: 3px; border-radius: 3px; background: var(--line); overflow: hidden; }
  .tempo span { display: block; height: 100%; background: var(--gold-fill); transform-origin: left; }
</style>
