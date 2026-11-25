<script lang="ts">
  import { estado } from '../../dados/estado.svelte';
  import { somarDias } from '../../dominio/datas';
  import { brl } from '../../dominio/dinheiro';
  import { registroAtual } from '../registrar';
  import { ui } from '../ui.svelte';

  const ontem = somarDias(estado.hoje, -1);
  const escolha = $derived(!ui.dataRegistro ? 'hoje' : ui.dataRegistro === ontem ? 'ontem' : 'outra');
  const atual = $derived.by(() => { void ui.amt; void ui.desc; return registroAtual(); });
  let outra = $state(ui.dataRegistro ?? somarDias(estado.hoje, -2));

  function definirData(d: string | null) {
    ui.dataRegistro = d && d !== estado.hoje ? d : null;
  }
</script>

<div class="pilha">
  <h2>Opções do registro</h2>
  <div class="campo"><span>Quando foi</span>
    <div class="seg">
      <button type="button" class:on={escolha === 'hoje'} onclick={() => definirData(null)}>Hoje</button>
      <button type="button" class:on={escolha === 'ontem'} onclick={() => definirData(ontem)}>Ontem</button>
      <button type="button" class:on={escolha === 'outra'} onclick={() => definirData(outra)}>Outro dia</button>
    </div>
    {#if escolha === 'outra'}
      <input class="entrada" id="op-data" type="date" bind:value={outra} max={estado.hoje} min={estado.ajustes.inicio ?? undefined} onchange={() => definirData(outra)} />
    {/if}
  </div>

  <div class="campo"><span>Parcelado?</span>
    <div class="parcelas">
      <button class="passo" type="button" aria-label="Menos parcelas" onclick={() => (ui.parcelarEm = ui.parcelarEm <= 2 ? 0 : ui.parcelarEm - 1)}>−</button>
      <span class="vezes num">{ui.parcelarEm > 1 ? `${ui.parcelarEm}×` : 'À vista'}</span>
      <button class="passo" type="button" aria-label="Mais parcelas" onclick={() => (ui.parcelarEm = Math.min(24, Math.max(2, ui.parcelarEm + 1)))}>+</button>
    </div>
    {#if ui.parcelarEm > 1}
      <p class="nota">
        {#if atual.valor > 0}{ui.parcelarEm}× de <b>{brl(Math.round(atual.valor / ui.parcelarEm))}</b>. {/if}
        A 1ª parcela entra nesta semana; as outras viram compromisso no plano dos próximos meses.
      </p>
    {/if}
  </div>
  <button class="btn primario" type="button" onclick={() => ui.fechar()}>Pronto</button>
</div>

<style>
  .parcelas { display: flex; align-items: center; gap: 12px; }
  .passo { width: 46px; height: 46px; border-radius: 14px; background: var(--surface-2); font-size: 22px; font-weight: 700; }
  .vezes { min-width: 90px; text-align: center; font-size: 20px; font-weight: 700; }
</style>
