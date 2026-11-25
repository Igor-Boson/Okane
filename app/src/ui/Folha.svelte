<script lang="ts">
  import type { Snippet } from 'svelte';

  let { aoFechar, transparente = false, rotulo = 'Painel', children }: {
    aoFechar: () => void; transparente?: boolean; rotulo?: string; children: Snippet;
  } = $props();

  function tecla(e: KeyboardEvent) {
    if (e.key === 'Escape') aoFechar();
  }
</script>

<svelte:window onkeydown={tecla} />

<div class="veu" class:transparente onclick={aoFechar} role="presentation"></div>
<div class="folha" role="dialog" aria-modal="true" aria-label={rotulo}>
  <div class="alca"></div>
  {@render children()}
</div>
