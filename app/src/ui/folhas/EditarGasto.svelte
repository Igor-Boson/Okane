<script lang="ts">
  import { estado } from '../../dados/estado.svelte';
  import { centavosParaTexto, paraCentavos } from '../../dominio/dinheiro';
  import { ui } from '../ui.svelte';

  let { gastoId }: { gastoId: string } = $props();

  const g = estado.gastos.find(x => x.id === gastoId);
  let valor = $state(g ? centavosParaTexto(g.valor) : '');
  let descricao = $state(g?.descricao ?? '');
  let categoriaId = $state(g?.categoriaId ?? '');
  let data = $state(g?.data ?? estado.hoje);
  let valeu = $state<boolean | null>(g?.valeu ?? null);
  const cat = $derived(estado.categoria(categoriaId));
  const centavos = $derived(paraCentavos(valor));
  const categorias = $derived([...estado.categoriasAtivas, ...(g && estado.categoria(g.categoriaId).arquivada ? [estado.categoria(g.categoriaId)] : [])]);

  async function salvar() {
    if (!g || !centavos) return;
    await estado.alterarGasto(g.id, { valor: centavos, descricao: descricao.trim() || cat.nome, categoriaId, data, valeu: cat.essencial ? g.valeu : valeu });
    ui.fechar();
    ui.avisar('Gasto atualizado');
  }

  async function apagar() {
    if (!g) return;
    const removido = await estado.apagarGasto(g.id);
    ui.fechar();
    ui.avisar(`Apagado: ${g.descricao}`, removido ? { rotulo: 'Desfazer', fazer: () => void estado.restaurarGasto(removido) } : undefined);
  }
</script>

{#if g}
  <form class="pilha" onsubmit={e => { e.preventDefault(); void salvar(); }}>
    <h2>Editar gasto</h2>
    <div class="duas">
      <label class="campo"><span>Valor</span>
        <input class="entrada" id="ed-valor" type="text" inputmode="decimal" bind:value={valor} autocomplete="off" />
      </label>
      <label class="campo"><span>Data</span>
        <input class="entrada" id="ed-data" type="date" bind:value={data} max={estado.hoje} min={estado.ajustes.inicio ?? undefined} />
      </label>
    </div>
    <label class="campo"><span>Descrição</span>
      <input class="entrada" id="ed-desc" type="text" bind:value={descricao} autocomplete="off" />
    </label>
    <div class="campo"><span>Categoria</span>
      <div class="grade-cat">
        {#each categorias as c (c.id)}
          <button type="button" class:on={c.id === categoriaId} onclick={() => (categoriaId = c.id)}><span>{c.emoji}</span><span class="nome-cat">{c.nome}</span></button>
        {/each}
      </div>
    </div>
    {#if !cat.essencial}
      <div class="campo"><span>Valeu a pena?</span>
        <div class="seg">
          <button type="button" class:on={valeu === true} onclick={() => (valeu = true)}>👍 Valeu</button>
          <button type="button" class:on={valeu === false} onclick={() => (valeu = false)}>👎 Não valeu</button>
          <button type="button" class:on={valeu === null} onclick={() => (valeu = null)}>Sem resposta</button>
        </div>
      </div>
    {/if}
    <button class="btn primario" type="submit" disabled={!centavos}>Salvar</button>
    <button class="btn perigo" type="button" onclick={apagar}>Apagar gasto</button>
  </form>
{/if}

<style>
  .duas { display: grid; grid-template-columns: 1fr 1.2fr; gap: 10px; }
  .seg { flex-wrap: wrap; }
</style>
