<script lang="ts">
  import { onMount } from 'svelte';
  import { estado } from '../dados/estado.svelte';
  import { acabouDeAtualizar } from '../pwa';
  import { verificarAberturas } from './aberturas';
  import Ajustes from './Ajustes.svelte';
  import Conferir from './Conferir.svelte';
  import Folha from './Folha.svelte';
  import Gastos from './Gastos.svelte';
  import Inicio from './Inicio.svelte';
  import Plano from './Plano.svelte';
  import CheckOntem from './folhas/CheckOntem.svelte';
  import EditarGasto from './folhas/EditarGasto.svelte';
  import FechamentoMes from './folhas/FechamentoMes.svelte';
  import FechamentoSemana from './folhas/FechamentoSemana.svelte';
  import OpcoesRegistro from './folhas/OpcoesRegistro.svelte';
  import PetInfo from './folhas/PetInfo.svelte';
  import Reflexao from './folhas/Reflexao.svelte';
  import TodasCategorias from './folhas/TodasCategorias.svelte';
  import { ui, type Aba } from './ui.svelte';

  const abas: { id: Aba; nome: string }[] = [
    { id: 'inicio', nome: 'Início' },
    { id: 'gastos', nome: 'Gastos' },
    { id: 'plano', nome: 'Plano' },
  ];

  let conteudo: HTMLElement | undefined = $state();

  function irPara(a: Aba) {
    ui.aba = a;
    conteudo?.scrollTo({ top: 0 });
  }

  onMount(() => {
    void verificarAberturas();
    if (acabouDeAtualizar()) ui.avisar('Okane atualizado ✨');
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') void verificarAberturas();
    };
    document.addEventListener('visibilitychange', aoVoltar);
    const relogio = setInterval(() => estado.atualizarHoje(), 60_000);
    return () => {
      document.removeEventListener('visibilitychange', aoVoltar);
      clearInterval(relogio);
    };
  });
</script>

<header class="topo">
  <div class="marca"><span class="kana" aria-hidden="true">お金</span><span class="nome">Okane</span></div>
  <button class="botao-icone" type="button" aria-label="Ajustes" onclick={() => (ui.ajustesAbertos = true)}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
  </button>
</header>

<main class="conteudo" bind:this={conteudo}>
  {#if ui.aba === 'inicio'}<Inicio />
  {:else if ui.aba === 'gastos'}<Gastos />
  {:else}<Plano />{/if}
</main>

<nav class="abas" aria-label="Navegação">
  {#each abas as a (a.id)}
    <button class="aba" class:on={ui.aba === a.id} type="button" aria-current={ui.aba === a.id ? 'page' : undefined} onclick={() => irPara(a.id)}>
      {#if a.id === 'inicio'}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v9M9.5 9.8c0-1 1.1-1.6 2.5-1.6s2.5.6 2.5 1.7c0 2.4-5 1.3-5 3.9 0 1.1 1.1 1.8 2.5 1.8s2.5-.7 2.5-1.7" /></svg>
      {:else if a.id === 'gastos'}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></svg>
      {:else}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
      {/if}
      {a.nome}
    </button>
  {/each}
</nav>

{#if ui.folha}
  {@const f = ui.folha}
  <Folha aoFechar={() => ui.fechar()} transparente={f.tipo === 'reflexao'}>
    {#key f}
      {#if f.tipo === 'reflexao'}<Reflexao gastoId={f.gastoId} volta={f.volta ?? false} parcelado={f.parcelado} />
      {:else if f.tipo === 'editar'}<EditarGasto gastoId={f.gastoId} />
      {:else if f.tipo === 'categorias'}<TodasCategorias />
      {:else if f.tipo === 'opcoes'}<OpcoesRegistro />
      {:else if f.tipo === 'ontem'}<CheckOntem data={f.data} />
      {:else if f.tipo === 'semana'}<FechamentoSemana segunda={f.segunda} />
      {:else if f.tipo === 'mes'}<FechamentoMes mes={f.mes} />
      {:else if f.tipo === 'pet'}<PetInfo />{/if}
    {/key}
  </Folha>
{/if}

{#if ui.ajustesAbertos}<Ajustes />{/if}
{#if ui.conferirAberto}<Conferir />{/if}

{#if ui.toast}
  {@const t = ui.toast}
  <div class="aviso" class:sem-acao={!t.acao} role="status">
    <span>{t.texto}</span>
    {#if t.acao}<button type="button" onclick={() => { t.acao?.fazer(); ui.toast = null; }}>{t.acao.rotulo}</button>{/if}
  </div>
{/if}
