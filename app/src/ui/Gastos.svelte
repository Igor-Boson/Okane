<script lang="ts">
  import { urlPet } from './imagens';
  import { estado } from '../dados/estado.svelte';
  import { mesDe, nomeMes, periodoSemana, primeiroDia, rotuloDia, somarDias, somarMeses, ultimoDia } from '../dominio/datas';
  import { brl, brl0 } from './dinheiro';
  import { fala } from '../dominio/falas';
  import { calcularSemana, gastosEntre, naoValeuDe, porCategoria, resumoDoMes, totalDe } from '../dominio/orcamento';
  import type { Gasto } from '../dominio/tipos';
  import { ui } from './ui.svelte';

  const STATUS = { folga: 'Folga', limite: 'No limite', passou: 'Passou' } as const;

  let modo = $state<'semana' | 'mes'>('semana');
  let desloc = $state(0);

  const inicio = $derived(estado.ajustes.inicio ?? estado.hoje);
  const periodo = $derived.by(() => {
    if (modo === 'semana') {
      const seg = somarDias(estado.semana.segunda, 7 * desloc);
      const dom = somarDias(seg, 6);
      const s = calcularSemana(estado.dados, desloc === 0 ? estado.hoje : dom);
      return { de: seg, ate: dom, titulo: periodoSemana(seg), referencia: s.cota, rotuloRef: 'da semana', status: s.status as keyof typeof STATUS | null };
    }
    const mes = somarMeses(estado.mes, desloc);
    const r = resumoDoMes(estado.dados, mes);
    return { de: primeiroDia(mes), ate: ultimoDia(mes), titulo: `${nomeMes(mes)} ${mes.slice(0, 4)}`, referencia: r.conta.livre, rotuloRef: 'livres no mês', status: null };
  });
  const podeVoltar = $derived(periodo.de > inicio);
  const lista = $derived(gastosEntre(estado.dados, periodo.de, periodo.ate));
  const total = $derived(totalDe(lista));
  const cats = $derived(porCategoria(lista));
  const maxCat = $derived(cats[0]?.[1] ?? 1);
  const naoValeu = $derived(naoValeuDe(lista));
  const zeros = $derived(estado.diasSemGasto.filter(d => d.data >= periodo.de && d.data <= periodo.ate).map(d => d.data));
  const dias = $derived.by(() => {
    const m = new Map<string, Gasto[]>();
    for (const g of lista) m.set(g.data, [...(m.get(g.data) ?? []), g]);
    for (const z of zeros) if (!m.has(z)) m.set(z, []);
    return [...m.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([data, gs]) => ({ data, gastos: [...gs].reverse(), zero: zeros.includes(data) }));
  });

  function trocarModo(m: 'semana' | 'mes') { modo = m; desloc = 0; }

  function tocarZero(data: string) {
    ui.avisar(`Dia sem gastos em ${rotuloDia(data, estado.hoje).toLowerCase()}`, { rotulo: 'Desmarcar', fazer: () => void estado.desmarcarDiaSemGasto(data) });
  }
</script>

<section class="pagina">
  <div class="linha-topo">
    <h1>Gastos</h1>
    <div class="seg" role="tablist">
      <button type="button" role="tab" aria-selected={modo === 'semana'} class:on={modo === 'semana'} onclick={() => trocarModo('semana')}>Semana</button>
      <button type="button" role="tab" aria-selected={modo === 'mes'} class:on={modo === 'mes'} onclick={() => trocarModo('mes')}>Mês</button>
    </div>
  </div>

  <div class="nav-periodo">
    <button type="button" aria-label="Período anterior" disabled={!podeVoltar} onclick={() => desloc--}>‹</button>
    <span>{desloc === 0 ? (modo === 'semana' ? 'Esta semana' : 'Este mês') : periodo.titulo}</span>
    <button type="button" aria-label="Próximo período" disabled={desloc >= 0} onclick={() => desloc++}>›</button>
  </div>

  <div class="resumo">
    <div class="linha-topo">
      <span class="total num">{brl(total)}</span>
      {#if periodo.status}<span class="etiqueta {periodo.status}"><i></i>{STATUS[periodo.status]}</span>{/if}
    </div>
    <span class="nota">de {brl0(periodo.referencia)} {periodo.rotuloRef}{desloc === 0 && modo === 'semana' ? ` · ${periodo.titulo}` : ''}</span>
  </div>

  {#if lista.length === 0 && zeros.length === 0}
    <div class="vazio">
      <img src={urlPet('feliz')} alt="" />
      <p>{desloc === 0 ? fala('semDados', estado.ajustes.tom) : 'Nada registrado nesse período.'}</p>
    </div>
  {:else}
    {#if cats.length}
      <div class="cats">
        {#each cats as [id, v] (id)}
          {@const c = estado.categoria(id)}
          <div class="cat"><span class="n">{c.emoji} {c.nome}</span><span class="t"><span style="width:{(v / maxCat) * 100}%"></span></span><span class="v num">{brl0(v)}</span></div>
        {/each}
      </div>
    {/if}
    {#if naoValeu}<p class="nota">👎 Você marcou <b>{brl0(naoValeu)}</b> como “não valeu” {modo === 'semana' ? 'nesta semana' : 'neste mês'}.</p>{/if}

    <div class="lista">
      {#each dias as d (d.data)}
        <div class="dia">
          <div class="dia-topo"><span>{rotuloDia(d.data, estado.hoje)}</span><span class="num">{brl(totalDe(d.gastos))}</span></div>
          {#if d.zero && d.gastos.length === 0}
            <button class="item" type="button" onclick={() => tocarZero(d.data)}><span class="e">✨</span><span class="d">Dia sem gastos</span><span></span><span></span></button>
          {/if}
          {#each d.gastos as g (g.id)}
            <button class="item" type="button" onclick={() => ui.abrir({ tipo: 'editar', gastoId: g.id })}>
              <span class="e">{estado.categoria(g.categoriaId).emoji}</span>
              <span class="d">{g.descricao}</span>
              <span class="v num">{brl(g.valor)}</span>
              <span class="w">{g.valeu === true ? '👍' : g.valeu === false ? '👎' : ''}</span>
            </button>
          {/each}
        </div>
      {/each}
    </div>
  {/if}
  <button class="conferir" type="button" onclick={() => (ui.conferirAberto = true)}>
    <span>🧾</span><span><b>Conferir com o extrato do banco</b><span class="nota">Descubra o que ficou sem registrar</span></span><span class="seta">›</span>
  </button>
  {#if modo === 'mes' && desloc === 0 && mesDe(inicio) === estado.mes}
    <p class="nota">Este é o seu primeiro mês: o dinheiro livre é proporcional aos dias desde que você começou.</p>
  {/if}
</section>

<style>
  .nav-periodo { display: flex; align-items: center; justify-content: space-between; background: var(--surface-2); border-radius: 14px; padding: 4px; }
  .nav-periodo span { font-weight: 600; text-transform: capitalize; }
  .nav-periodo button { width: 40px; height: 36px; border-radius: 10px; font-size: 22px; font-weight: 700; color: var(--ink); }
  .nav-periodo button:disabled { opacity: .25; }
  .resumo { display: grid; gap: 2px; }
  .total { font-family: var(--f-display); font-weight: 800; font-size: 32px; letter-spacing: -.02em; }
  .cats { display: grid; gap: 8px; }
  .cat { display: grid; grid-template-columns: minmax(0, 120px) 1fr 70px; align-items: center; gap: 10px; font-size: 14px; }
  .cat .n { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cat .t { height: 8px; border-radius: 9px; background: var(--surface-2); overflow: hidden; }
  .cat .t span { display: block; height: 100%; border-radius: 9px; background: var(--gold-fill); }
  .cat .v { text-align: right; color: var(--muted); font-family: var(--f-body); }
  .lista { display: grid; gap: 4px; }
  .dia-topo { display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); padding: 10px 0 4px; border-bottom: 1px solid var(--line); }
  .dia-topo .num { font-family: var(--f-body); }
  .item { display: grid; grid-template-columns: 28px 1fr auto 22px; gap: 8px; align-items: center; padding: 10px 0; text-align: left; width: 100%; border-bottom: 1px solid var(--line); min-height: 48px; }
  .item .e { font-size: 18px; }
  .item .d { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .item .v { font-weight: 600; font-family: var(--f-body); }
  .item .w { font-size: 14px; text-align: center; }
  .vazio { display: grid; justify-items: center; gap: 8px; padding: 24px 0; text-align: center; color: var(--muted); }
  .vazio img { width: 110px; height: 110px; object-fit: contain; }
  .conferir { display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: center; text-align: left; padding: 12px 14px; border-radius: 16px; background: var(--surface-2); }
  .conferir > span:first-child { font-size: 22px; }
  .conferir .nota { display: block; }
  .conferir .seta { font-size: 22px; color: var(--muted); }
</style>
