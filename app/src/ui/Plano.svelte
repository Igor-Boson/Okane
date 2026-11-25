<script lang="ts">
  import { estado, novoId } from '../dados/estado.svelte';
  import { mesCurtoAno, mesDe, nomeMes, somarMeses } from '../dominio/datas';
  import { brl0 } from '../dominio/dinheiro';
  import { calcularSemana, contaDoMes, extrasDoMes, mediaSemanal, parcelasDoMes } from '../dominio/orcamento';
  import type { PlanoMes } from '../dominio/tipos';
  import CampoDinheiro from './CampoDinheiro.svelte';
  import Desejos from './Desejos.svelte';

  let desloc = $state(0);
  const mes = $derived(somarMeses(estado.mes, desloc));
  const plano = $derived(estado.planoEditavel(mes));
  const herdado = $derived(!estado.planos.some(p => p.mes === mes));
  const conta = $derived(contaDoMes(estado.dados, mes));
  const parcelas = $derived(parcelasDoMes(estado.dados, mes));
  const extras = $derived(extrasDoMes(estado.dados, mes));
  const primeiroMes = $derived(mes === mesDe(estado.ajustes.inicio ?? mes));
  const cotaSemana = $derived(desloc === 0 ? calcularSemana(estado.dados, estado.hoje).cota : null);

  let novoFixo = $state('');
  let novaParcela = $state({ nome: '', valor: 0, faltam: 2 });
  let mostrarNovaParcela = $state(false);
  let novoExtra = $state({ descricao: '', valor: 0, liberado: 0 });
  let mostrarNovoExtra = $state(false);

  async function salvar(patch: Partial<PlanoMes>) {
    await estado.salvarPlano({ ...plano, ...patch });
  }

  async function adicionarFixo() {
    const nome = novoFixo.trim();
    if (!nome) return;
    await salvar({ fixos: [...plano.fixos, { id: novoId(), nome, valor: 0 }] });
    novoFixo = '';
  }

  async function adicionarParcela() {
    if (!novaParcela.valor || novaParcela.faltam < 1) return;
    await estado.salvarParcela({ id: novoId(), nome: novaParcela.nome.trim() || 'Parcela', valor: novaParcela.valor, primeiroMes: mes, total: Math.round(novaParcela.faltam) });
    novaParcela = { nome: '', valor: 0, faltam: 2 };
    mostrarNovaParcela = false;
  }

  async function adicionarExtra() {
    if (!novoExtra.valor) return;
    await estado.salvarExtra({ id: novoId(), mes, descricao: novoExtra.descricao.trim() || 'Entrada extra', valor: novoExtra.valor, liberado: Math.min(novoExtra.liberado, novoExtra.valor) });
    novoExtra = { descricao: '', valor: 0, liberado: 0 };
    mostrarNovoExtra = false;
  }
</script>

<section class="pagina">
  <div class="linha-topo">
    <h1>Plano de {nomeMes(mes)}</h1>
  </div>
  <div class="nav-mes">
    <button type="button" aria-label="Mês anterior" disabled={desloc <= 0} onclick={() => desloc--}>‹</button>
    <span>{desloc === 0 ? 'Este mês' : desloc === 1 ? 'Próximo mês' : mesCurtoAno(mes)}</span>
    <button type="button" aria-label="Próximo mês" disabled={desloc >= 3} onclick={() => desloc++}>›</button>
  </div>
  {#if herdado && desloc > 0}<p class="nota">Este mês ainda segue o plano anterior. Qualquer mudança aqui vale daqui pra frente.</p>{/if}

  <div class="cartao">
    <div class="item-linha primeiro">
      <span><b>💰 Salário</b><span class="meta">líquido, cai por volta do dia 1</span></span>
      <CampoDinheiro id="plano-salario" rotulo="Salário" valor={plano.salario} aoMudar={v => salvar({ salario: v })} />
    </div>
  </div>

  <div class="cartao">
    <div class="cartao-topo"><span>📌 Fixos</span><span class="v">{brl0(conta.fixos)}</span></div>
    {#each plano.fixos as f, i (f.id)}
      <div class="item-linha">
        <input class="nome-in" aria-label="Nome do fixo" value={f.nome}
          onchange={e => salvar({ fixos: plano.fixos.map((x, j) => (j === i ? { ...x, nome: (e.currentTarget as HTMLInputElement).value.trim() || x.nome } : x)) })} />
        <span class="direita">
          <CampoDinheiro rotulo={f.nome} valor={f.valor} largura="92px" aoMudar={v => salvar({ fixos: plano.fixos.map((x, j) => (j === i ? { ...x, valor: v } : x)) })} />
          <button class="x" type="button" aria-label="Remover {f.nome}" onclick={() => salvar({ fixos: plano.fixos.filter((_, j) => j !== i) })}>×</button>
        </span>
      </div>
    {/each}
    <form class="item-linha" onsubmit={e => { e.preventDefault(); void adicionarFixo(); }}>
      <input class="nome-in" placeholder="+ adicionar fixo (aluguel, luz...)" aria-label="Novo fixo" bind:value={novoFixo} />
      {#if novoFixo.trim()}<button class="link" type="submit">Adicionar</button>{/if}
    </form>
  </div>

  <div class="cartao">
    <div class="cartao-topo"><span>💳 Parcelas</span><span class="v">{brl0(conta.parcelas)}</span></div>
    {#each parcelas as p (p.parcela.id)}
      <div class="item-linha">
        <span>{p.parcela.nome}<span class="meta">{p.numero}/{p.parcela.total} · {p.faltam === 1 ? 'última' : `faltam ${p.faltam}`} · até {mesCurtoAno(p.ultimoMes)}</span></span>
        <span class="direita">
          <CampoDinheiro rotulo={p.parcela.nome} valor={p.parcela.valor} largura="92px" aoMudar={v => estado.salvarParcela({ ...p.parcela, valor: v })} />
          <button class="x" type="button" aria-label="Remover {p.parcela.nome}" onclick={() => estado.apagarParcela(p.parcela.id)}>×</button>
        </span>
      </div>
    {:else}
      <p class="nota vazio-linha">Nenhuma parcela neste mês.</p>
    {/each}
    {#if mostrarNovaParcela}
      <form class="novo" onsubmit={e => { e.preventDefault(); void adicionarParcela(); }}>
        <input class="entrada" placeholder="Nome (ex.: notebook)" aria-label="Nome da parcela" bind:value={novaParcela.nome} />
        <div class="duas">
          <label class="campo"><span>Valor da parcela</span><CampoDinheiro rotulo="Valor da parcela" valor={novaParcela.valor} largura="100%" aoMudar={v => (novaParcela.valor = v)} /></label>
          <label class="campo"><span>Faltam (com esta)</span><input class="entrada" type="number" inputmode="numeric" min="1" max="99" bind:value={novaParcela.faltam} /></label>
        </div>
        <button class="btn primario" type="submit" disabled={!novaParcela.valor}>Adicionar parcela</button>
      </form>
    {:else}
      <button class="item-linha link-linha" type="button" onclick={() => (mostrarNovaParcela = true)}>+ adicionar parcela</button>
    {/if}
  </div>

  <div class="cartao">
    <div class="cartao-topo"><span>🎁 Entradas extras</span><span class="v">{brl0(conta.extrasLiberados)} liberados</span></div>
    {#each extras as x (x.id)}
      <div class="item-linha">
        <span>{x.descricao} · {brl0(x.valor)}<span class="meta">liberado pros gastos (o resto vai pro guardado)</span></span>
        <span class="direita">
          <CampoDinheiro rotulo="Liberado de {x.descricao}" valor={x.liberado} largura="92px" aoMudar={v => estado.salvarExtra({ ...x, liberado: Math.min(v, x.valor) })} />
          <button class="x" type="button" aria-label="Remover {x.descricao}" onclick={() => estado.apagarExtra(x.id)}>×</button>
        </span>
      </div>
    {/each}
    {#if mostrarNovoExtra}
      <form class="novo" onsubmit={e => { e.preventDefault(); void adicionarExtra(); }}>
        <input class="entrada" placeholder="O que foi (13º, freela, presente...)" aria-label="Descrição da entrada" bind:value={novoExtra.descricao} />
        <div class="duas">
          <label class="campo"><span>Valor</span><CampoDinheiro rotulo="Valor" valor={novoExtra.valor} largura="100%" aoMudar={v => (novoExtra.valor = v)} /></label>
          <label class="campo"><span>Liberar pros gastos</span><CampoDinheiro rotulo="Liberar" valor={novoExtra.liberado} largura="100%" aoMudar={v => (novoExtra.liberado = v)} /></label>
        </div>
        <p class="nota">Por padrão, entrada extra vai toda pro guardado. Libere só o que quiser usar este mês.</p>
        <button class="btn primario" type="submit" disabled={!novoExtra.valor}>Adicionar entrada</button>
      </form>
    {:else}
      <button class="item-linha link-linha" type="button" onclick={() => (mostrarNovoExtra = true)}>+ adicionar entrada extra</button>
    {/if}
  </div>

  <div class="cartao">
    <div class="item-linha primeiro">
      <span><b>🐷 Guardar</b><span class="meta">{primeiroMes ? '1º mês: deixe em R$ 0 e só observe' : 'meta do mês'}</span></span>
      <CampoDinheiro id="plano-meta" rotulo="Meta de guardar" valor={plano.metaGuardar} aoMudar={v => salvar({ metaGuardar: v })} />
    </div>
  </div>

  <div class="resultado">
    <div class="r"><span>Livre no mês</span><span class="grande2 num">{brl0(conta.livre)}</span></div>
    <p class="sub">
      ≈ {brl0(mediaSemanal(conta))} por semana{cotaSemana !== null ? ` · cota desta semana: ${brl0(cotaSemana)}` : ''}
      {#if primeiroMes && conta.fator < 1}<br />Proporcional: você começou no dia {conta.diaInicial}.{/if}
    </p>
  </div>

  {#if desloc === 0}<Desejos />{/if}
</section>

<style>
  .nav-mes { display: flex; align-items: center; justify-content: space-between; background: var(--surface-2); border-radius: 14px; padding: 4px; }
  .nav-mes span { font-weight: 600; }
  .nav-mes button { width: 40px; height: 36px; border-radius: 10px; font-size: 22px; font-weight: 700; }
  .nav-mes button:disabled { opacity: .25; }
  .primeiro { border-top: 0; }
  .direita { display: flex; align-items: center; gap: 4px; }
  .nome-in { flex: 1; min-width: 0; border: 0; background: transparent; font-size: 15px; padding: 6px 0; }
  .nome-in:focus { outline: none; }
  .nome-in::placeholder { color: var(--gold); font-weight: 600; }
  .x { width: 32px; height: 32px; border-radius: 10px; color: var(--muted); font-size: 20px; }
  .link-linha { color: var(--gold); font-weight: 600; width: 100%; text-align: left; }
  .vazio-linha { padding: 8px 0 12px; border-top: 1px solid var(--line); }
  .novo { display: grid; gap: 10px; padding: 12px 0; border-top: 1px solid var(--line); }
  .duas { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .duas :global(.dinheiro) { width: 100%; }
  .resultado { border-radius: 20px; padding: 16px; background: var(--hero); color: var(--hero-ink); display: grid; gap: 6px; }
  .resultado .r { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
  .grande2 { font-weight: 800; font-size: 30px; color: var(--gold-fill); }
  .resultado .sub { color: var(--hero-muted); font-size: 13px; }
</style>
