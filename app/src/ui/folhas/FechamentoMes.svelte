<script lang="ts">
  import { urlPet } from '../imagens';
  import { onDestroy, untrack } from 'svelte';
  import { estado } from '../../dados/estado.svelte';
  import { mesDe, nomeMes } from '../../dominio/datas';
  import { brl0 } from '../dinheiro';
  import { fala } from '../../dominio/falas';
  import { resumoDoMes, sugerirMeta } from '../../dominio/orcamento';
  import { ui } from '../ui.svelte';

  let { mes }: { mes: string } = $props();

  // fotografia do momento em que a folha abriu
  const m = untrack(() => mes);
  const r = resumoDoMes(estado.dados, m);
  const tom = estado.ajustes.tom;
  const primeiroMes = m === mesDe(estado.ajustes.inicio ?? m);
  const sugestao = primeiroMes && r.conta.metaGuardar === 0 ? sugerirMeta(r.sobra) : 0;
  const top = r.porCategoria.slice(0, 3);
  const frase = r.parcelasTerminando.length ? fala('ultimaParcela', tom) : r.sobra >= 0 ? fala('mesSobrou', tom) : fala('mesEstourou', tom);
  let nota = $state(estado.meses.find(x => x.mes === m)?.nota ?? '');
  let metaDecidida = $state(sugestao === 0);
  let concluido = false;

  async function aceitarMeta() {
    const p = estado.planoEditavel(estado.mes);
    await estado.salvarPlano({ ...p, metaGuardar: sugestao });
    metaDecidida = true;
    ui.avisar(`Meta de ${brl0(sugestao)} por mês salva no plano`);
  }

  async function concluir(revisar: boolean) {
    concluido = true;
    await estado.fecharMes({ mes: m, nota: nota.trim(), criadoEm: Date.now() });
    ui.fechar();
    if (revisar) ui.aba = 'plano';
    if (r.sobra > 0 || r.parcelasTerminando.length) ui.festejar(frase);
  }

  onDestroy(() => {
    if (!concluido) void estado.fecharMes({ mes: m, nota: nota.trim(), criadoEm: Date.now() });
  });
</script>

<div class="pilha">
  <h2>{nomeMes(m).replace(/^./, c => c.toUpperCase())} fechado</h2>
  <div class="fala"><img src={urlPet(r.sobra >= 0 ? 'comemorando' : 'abatido')} alt="" /><p>{frase}</p></div>

  <div class="kakeibo">
    <div class="q"><span class="n">1</span><div><b>Quanto você tinha?</b><p>{brl0(r.conta.livre)} livres pros gastos{primeiroMes && r.conta.fator < 1 ? ' (proporcional aos dias de uso)' : ''}.</p></div></div>
    <div class="q"><span class="n">2</span><div><b>Quanto quis guardar?</b><p>{r.conta.metaGuardar ? `${brl0(r.conta.metaGuardar)} de meta.` : 'Nada de meta (mês de observação).'}</p></div></div>
    <div class="q"><span class="n">3</span><div><b>Quanto gastou?</b>
      <p>{brl0(r.gasto)}{top.length ? `: ${top.map(([id, v]) => `${estado.categoria(id).emoji} ${brl0(v)}`).join(' · ')}` : ''}.</p>
      {#if r.naoValeu}<p class="nota">👎 {brl0(r.naoValeu)} em coisas que não valeram.</p>{/if}
    </div></div>
    <div class="q"><span class="n">4</span><div class="cresce"><b>Como pode melhorar?</b>
      <textarea class="entrada area" id="mes-nota" rows="2" placeholder="Uma frase pra você do mês que vem" bind:value={nota}></textarea>
    </div></div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">{r.sobra >= 0 ? 'Sobrou' : 'Passou'}</div><div class="v">{brl0(Math.abs(r.sobra))}</div></div>
    <div class="stat"><div class="k">🐷 Guardado no mês</div><div class="v">{brl0(r.guardadoTotal)}</div></div>
  </div>

  {#each r.parcelasTerminando as p (p.id)}
    <p class="nota">🎉 Acabou <b>{p.nome}</b>: +{brl0(p.valor)} livres por mês a partir de agora.</p>
  {/each}

  {#if !metaDecidida}
    <div class="cartao-meta">
      <p>Sobraram <b>{brl0(r.sobra)}</b> de verdade. Quer guardar <b>{brl0(sugestao)}</b> por mês a partir de agora?</p>
      <div class="btn-linha">
        <button class="btn ouro" type="button" onclick={aceitarMeta}>🐷 Guardar {brl0(sugestao)}</button>
        <button class="btn suave" type="button" onclick={() => (metaDecidida = true)}>Agora não</button>
      </div>
    </div>
  {/if}

  <button class="link conferir" type="button" onclick={() => { ui.conferirAberto = true; }}>🧾 Conferir o mês com o extrato do banco ›</button>

  <p class="nota">Salário, fixos e parcelas de {nomeMes(estado.mes)} iguais ao mês passado?</p>
  <div class="btn-linha">
    <button class="btn primario" type="button" onclick={() => concluir(false)}>Sim, tudo igual</button>
    <button class="btn suave" type="button" onclick={() => concluir(true)}>Revisar o plano</button>
  </div>
</div>

<style>
  .kakeibo { display: grid; gap: 10px; }
  .q { display: flex; gap: 10px; align-items: flex-start; }
  .q p { color: var(--muted); font-size: 14px; }
  .n { flex: 0 0 auto; width: 24px; height: 24px; border-radius: 99px; background: var(--gold-soft); color: var(--gold); font-weight: 800; font-size: 13px; display: grid; place-items: center; font-family: var(--f-display); }
  .cresce { flex: 1; display: grid; gap: 6px; }
  .area { height: auto; padding: 10px 12px; resize: none; font-size: 16px; }
  .conferir { text-align: left; }
  .cartao-meta { background: var(--gold-soft); border-radius: 16px; padding: 12px; display: grid; gap: 10px; }
</style>
