<script lang="ts">
  import { estado } from '../dados/estado.svelte';
  import Pet from './Pet.svelte';

  let mostrarAviso = $state(false);
</script>

<div class="inst">
  <div class="topo-inst">
    <Pet imagem="feliz" tamanho={120} />
    <h1>Instale o Okane</h1>
    <p>Ele vira um app na tela de início, abre na hora e funciona sem internet.</p>
  </div>

  <ol class="passos">
    <li>
      <span class="n">1</span>
      <span>Toque em <b>Compartilhar</b>
        <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="ícone de compartilhar"><path d="M12 3v12M8 7l4-4 4 4" /><path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8" /></svg>
        na barra do Safari.</span>
    </li>
    <li><span class="n">2</span><span>Role e toque em <b>Adicionar à Tela de Início</b>.</span></li>
    <li><span class="n">3</span><span>Abra o Okane pelo ícone da <b>moedinha</b>.</span></li>
  </ol>

  <p class="porque">Por que instalar primeiro? No iPhone, o app instalado guarda os dados separado do Safari. Começando por ele, nada se perde.</p>

  <div class="rodape">
    {#if !mostrarAviso}
      <button class="link" type="button" onclick={() => (mostrarAviso = true)}>Usar no navegador mesmo assim</button>
    {:else}
      <p class="nota">Os dados vão ficar só no Safari e <b>não vão junto</b> se você instalar depois (a não ser pelo backup).</p>
      <button class="btn suave" type="button" onclick={() => estado.ajustar({ semInstalar: true })}>Entendi, continuar no navegador</button>
    {/if}
  </div>
</div>

<style>
  .inst { height: 100%; overflow-y: auto; background: var(--hero); color: var(--hero-ink); padding: calc(var(--topo) + 24px) 24px calc(24px + var(--base)); display: flex; flex-direction: column; gap: 22px; }
  .topo-inst { display: grid; justify-items: center; text-align: center; gap: 8px; }
  h1 { font-family: var(--f-display); font-weight: 800; font-size: 30px; letter-spacing: -.02em; }
  .topo-inst p { color: var(--hero-muted); max-width: 300px; }
  .passos { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
  .passos li { display: flex; gap: 12px; align-items: center; background: rgba(255,255,255,.07); border-radius: 16px; padding: 14px; font-size: 16px; }
  .n { flex: 0 0 auto; width: 30px; height: 30px; border-radius: 99px; background: var(--gold-fill); color: #2A1E00; font-weight: 800; display: grid; place-items: center; font-family: var(--f-display); }
  .ic { width: 20px; height: 20px; vertical-align: -4px; color: var(--gold-fill); }
  .porque { color: var(--hero-muted); font-size: 14px; }
  .rodape { margin-top: auto; display: grid; gap: 10px; text-align: center; }
  .rodape .nota { color: var(--hero-muted); }
  .rodape .nota b { color: var(--hero-ink); }
  .link { color: var(--gold-fill); }
</style>
