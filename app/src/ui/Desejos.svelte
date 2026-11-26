<script lang="ts">
  import { estado, novoId } from '../dados/estado.svelte';
  import { brl, brl0 } from './dinheiro';
  import { fala } from '../dominio/falas';
  import CampoDinheiro from './CampoDinheiro.svelte';
  import { ui } from './ui.svelte';

  /*
   * Lista de desejos com quarentena (v1, J1): quer algo não essencial? Anota aqui.
   * Se depois de X dias ainda quiser, compra sem culpa. Desistir conta como dinheiro que ficou com você.
   */

  const DIA = 86_400_000;
  let nome = $state('');
  let valor = $state(0);
  let dias = $state(7);
  let agora = $state(Date.now());

  const esperando = $derived(estado.desejos.filter(d => d.status === 'esperando').sort((a, b) => a.criadoEm - b.criadoEm));
  const desistidos = $derived(estado.desejos.filter(d => d.status === 'desistiu'));
  const totalDesistido = $derived(desistidos.reduce((s, d) => s + d.valor, 0));
  const faltam = (criadoEm: number, q: number) => Math.ceil((criadoEm + q * DIA - agora) / DIA);

  $effect(() => {
    const t = setInterval(() => (agora = Date.now()), 60_000);
    return () => clearInterval(t);
  });

  async function adicionar() {
    if (!nome.trim() || !valor) return;
    await estado.salvarDesejo({ id: novoId(), nome: nome.trim(), valor, criadoEm: Date.now(), quarentenaDias: dias, status: 'esperando' });
    nome = ''; valor = 0;
    ui.dizer(fala('desejoNovo', estado.ajustes.tom));
    ui.avisar('Desejo anotado. Quarentena começou ⏳');
  }

  async function desistir(id: string) {
    const d = estado.desejos.find(x => x.id === id);
    if (!d) return;
    await estado.salvarDesejo({ ...d, status: 'desistiu', resolvidoEm: Date.now() });
    ui.festejar(fala('desistiu', estado.ajustes.tom, { v: brl0(d.valor) }));
    ui.avisar(`${brl0(d.valor)} continuam com você 🎉`);
  }

  async function comprar(id: string) {
    const d = estado.desejos.find(x => x.id === id);
    if (!d) return;
    await estado.salvarDesejo({ ...d, status: 'comprado', resolvidoEm: Date.now() });
    ui.desc = d.nome;
    ui.amt = String(d.valor / 100).replace('.', ',');
    ui.aba = 'inicio';
    ui.dizer(fala('comprou', estado.ajustes.tom));
  }
</script>

<div class="cartao desejos">
  <div class="cartao-topo"><span>🛍️ Lista de desejos</span>{#if totalDesistido}<span class="v ganho">+{brl0(totalDesistido)} salvos</span>{/if}</div>
  <p class="nota explica">Quer comprar algo que não é essencial? Anota aqui e espera a quarentena. Se ainda quiser depois, compra sem culpa.</p>
  {#each esperando as d (d.id)}
    {@const f = faltam(d.criadoEm, d.quarentenaDias)}
    <div class="item-linha">
      <span>{d.nome} · {brl(d.valor)}<span class="meta">{f > 0 ? `⏳ mais ${f} ${f === 1 ? 'dia' : 'dias'} de quarentena` : '✅ quarentena acabou: ainda quer?'}</span></span>
      <span class="acoes">
        {#if f <= 0}<button class="mini ouro" type="button" onclick={() => comprar(d.id)}>Comprei</button>{/if}
        <button class="mini" type="button" onclick={() => desistir(d.id)}>Desisti</button>
      </span>
    </div>
  {/each}
  <form class="novo" onsubmit={e => { e.preventDefault(); void adicionar(); }}>
    <input class="entrada" placeholder="O que você quer comprar?" aria-label="Desejo" bind:value={nome} />
    <div class="linha">
      <CampoDinheiro rotulo="Valor do desejo" valor={valor} largura="100%" aoMudar={v => (valor = v)} />
      <div class="seg" role="radiogroup" aria-label="Quarentena">
        {#each [3, 7, 30] as n (n)}
          <button type="button" class:on={dias === n} onclick={() => (dias = n)}>{n}d</button>
        {/each}
      </div>
    </div>
    <button class="btn suave" type="submit" disabled={!nome.trim() || !valor}>Começar quarentena</button>
  </form>
</div>

<style>
  .explica { padding-bottom: 8px; }
  .ganho { color: var(--ok); }
  .acoes { display: flex; gap: 6px; flex: 0 0 auto; }
  .mini { height: 34px; padding: 0 12px; border-radius: 10px; background: var(--surface-2); font-weight: 600; font-size: 13px; }
  .mini.ouro { background: var(--gold-fill); color: #2A1E00; }
  .novo { display: grid; gap: 10px; padding: 12px 0; border-top: 1px solid var(--line); }
  .linha { display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center; }
  .linha :global(.dinheiro) { width: 100%; }
</style>
