<script lang="ts">
  import { centavosParaTexto, paraCentavos } from '../dominio/dinheiro';
  import { escondendo } from './dinheiro';
  import { ui } from './ui.svelte';

  let { valor, aoMudar, id, rotulo, largura = '110px' }: {
    valor: number; aoMudar: (centavos: number) => void; id?: string; rotulo?: string; largura?: string;
  } = $props();

  let texto = $state('');
  let focado = false;
  $effect(() => {
    const v = valor;
    if (!focado) texto = v ? centavosParaTexto(v) : '';
  });

  function confirmar() {
    focado = false;
    const c = paraCentavos(texto) ?? 0;
    texto = c ? centavosParaTexto(c) : '';
    if (c !== valor) aoMudar(c);
  }
</script>

<span class="dinheiro">
  <span class="rs">R$</span>
  {#if escondendo() && valor}
    <!-- modo discreto: mostra ••• e não deixa editar (o valor guardado não muda) -->
    <button class="entrada escondido" type="button" {id} aria-label="{rotulo ?? 'Valor'}: escondido" style="width:{largura}"
      onclick={() => ui.avisar('Valores escondidos. Pra editar, desligue o modo discreto em Ajustes.')}>•••</button>
  {:else}
  <input
    class="entrada" {id} type="text" inputmode="decimal" autocomplete="off" placeholder="0" aria-label={rotulo}
    style="width:{largura}" bind:value={texto} onfocus={() => (focado = true)} onblur={confirmar}
    onkeydown={e => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur(); }}
  />
  {/if}
</span>

<style>
  .escondido { text-align: right; color: var(--muted); letter-spacing: .1em; }
</style>
