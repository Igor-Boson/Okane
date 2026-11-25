<script lang="ts">
  let { aoTeclar }: { aoTeclar: (tecla: string) => void } = $props();
  const teclas = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'apagar'];
</script>

<div class="teclado" role="group" aria-label="Teclado numérico">
  {#each teclas as t (t)}
    <button class="tecla" type="button" onclick={() => aoTeclar(t)} aria-label={t === 'apagar' ? 'Apagar' : t === ',' ? 'Vírgula' : t}>
      {#if t === 'apagar'}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 5H9l-6 7 6 7h12z" /><path d="m17 9-6 6M11 9l6 6" /></svg>
      {:else}{t}{/if}
    </button>
  {/each}
</div>

<style>
  /* linhas de 40 a 54 px: crescem até 54 se sobrar espaço, encolhem até 40 em tela pequena */
  .teclado { display: grid; grid-template-columns: repeat(3, 1fr); grid-auto-rows: minmax(40px, 54px); gap: 6px; }
  .tecla {
    min-height: 0; border-radius: 14px; background: var(--surface-2);
    font-family: var(--f-display); font-weight: 600; font-size: 24px; display: grid; place-items: center; user-select: none; -webkit-user-select: none;
  }
  .tecla:active { background: var(--gold-soft); }
  svg { width: 24px; height: 24px; }
</style>
