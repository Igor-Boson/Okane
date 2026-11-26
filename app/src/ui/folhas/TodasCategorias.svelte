<script lang="ts">
  import { estado } from '../../dados/estado.svelte';
  import { brl } from '../dinheiro';
  import { registrar, registroAtual } from '../registrar';
  import { ui } from '../ui.svelte';

  const atual = registroAtual();

  async function escolher(id: string) {
    ui.fechar();
    await registrar(id);
  }
</script>

<div class="pilha">
  <h2>{brl(atual.valor)}{atual.descricao ? ` · ${atual.descricao}` : ''}</h2>
  <p class="nota">Escolha a categoria. Tocar já salva.</p>
  <div class="grade-cat">
    {#each estado.categoriasAtivas as c (c.id)}
      <button type="button" onclick={() => escolher(c.id)}><span>{c.emoji}</span><span class="nome-cat">{c.nome}</span></button>
    {/each}
  </div>
</div>
