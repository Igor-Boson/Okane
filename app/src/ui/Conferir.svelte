<script lang="ts">
  import { estado } from '../dados/estado.svelte';
  import { rotuloDia } from '../dominio/datas';
  import { brl } from './dinheiro';
  import { chaveLancamento, conferir, lerExtrato, limparDescricao, type Lancamento } from '../dominio/extrato';
  import { categoriaPelaDescricao } from '../dominio/sugestao';
  import Pet from './Pet.svelte';
  import { ui } from './ui.svelte';

  let lancamentos = $state.raw<Lancamento[] | null>(null);
  let nomeArquivo = $state('');
  let erro = $state<string | null>(null);
  let escolhas = $state<Record<string, string>>({});
  let arquivoInput: HTMLInputElement | undefined = $state();

  const inicio = $derived(estado.ajustes.inicio ?? estado.hoje);
  const valoresDoPlano = $derived([
    ...(estado.planoAtual?.fixos ?? []).map(f => f.valor),
    ...estado.parcelas.map(p => p.valor),
  ]);
  const r = $derived(lancamentos ? conferir(lancamentos, estado.gastos, inicio, valoresDoPlano, estado.ajustes.extratoIgnorados) : null);
  const ativas = $derived(new Set(estado.categoriasAtivas.map(c => c.id)));

  function sugestao(l: Lancamento): string {
    const k = chaveLancamento(l);
    return escolhas[k] ?? categoriaPelaDescricao(estado.gastos, ativas, limparDescricao(l.descricao)) ?? estado.categoriasAtivas[estado.categoriasAtivas.length - 1]?.id ?? 'outros';
  }

  async function abrir(e: Event) {
    erro = null;
    const f = (e.currentTarget as HTMLInputElement).files?.[0];
    if (!f) return;
    nomeArquivo = f.name;
    try {
      const lidos = lerExtrato(await f.text());
      if (!lidos.length) throw new Error('Não achei saídas nesse arquivo. Ele precisa ser OFX ou CSV exportado do app do banco.');
      lancamentos = lidos;
    } catch (err) {
      erro = err instanceof Error ? err.message : 'Não consegui ler o arquivo.';
      lancamentos = null;
    }
    if (arquivoInput) arquivoInput.value = '';
  }

  async function registrar(l: Lancamento) {
    await estado.adicionarGasto({ data: l.data, valor: l.valor, descricao: limparDescricao(l.descricao), categoriaId: sugestao(l) });
    ui.avisar(`Registrado: ${limparDescricao(l.descricao)}`);
  }

  async function ignorar(ls: Lancamento[]) {
    const atuais = estado.ajustes.extratoIgnorados;
    await estado.ajustar({ extratoIgnorados: [...atuais, ...ls.map(chaveLancamento)].slice(-800) });
  }

  const pct = $derived(r ? Math.round(r.completude * 100) : 0);
</script>

<div class="tela-cheia" role="dialog" aria-modal="true" aria-label="Conferir com o extrato">
  <header class="topo">
    <button class="voltar" type="button" onclick={() => (ui.conferirAberto = false)}>‹ Voltar</button>
    <span class="titulo">Conferir extrato</span>
    <span class="espaco"></span>
  </header>
  <div class="rola">
    <section class="pagina">
      {#if !r}
        <div class="centro"><Pet imagem="feliz" tamanho={110} /></div>
        <h1>O que ficou sem registrar?</h1>
        <p class="nota">No app do banco, exporte o extrato (ou a fatura) em <b>OFX</b> ou <b>CSV</b> e salve em Arquivos. Eu comparo com o que você registrou e mostro o que faltou.</p>
        <p class="nota">O arquivo é lido só aqui no celular. Nada vai pra internet.</p>
        <button class="btn primario" type="button" onclick={() => arquivoInput?.click()}>Escolher arquivo do banco</button>
        {#if erro}<p class="nota erro">{erro}</p>{/if}
      {:else}
        <div class="placar">
          <Pet imagem={pct >= 90 ? 'comemorando' : pct >= 70 ? 'feliz' : 'preocupado'} tamanho={84} />
          <div>
            <div class="pct num">{pct}%</div>
            <p class="nota">dos gastos do extrato já estavam registrados{pct >= 90 ? ' 🎉 meta batida!' : ' (a meta é 90%)'}</p>
          </div>
        </div>
        <p class="nota">{nomeArquivo} · {r.total} saídas desde que você começou · {r.encontrados} batem com seus registros.</p>

        {#if r.faltando.length}
          <div class="rotulo">Faltou registrar ({r.faltando.length})</div>
          {#each r.faltando as l (chaveLancamento(l) + l.data)}
            {@const k = chaveLancamento(l)}
            <div class="falta">
              <div class="linha1">
                <span class="d">{limparDescricao(l.descricao)}</span>
                <span class="v num">{brl(l.valor)}</span>
              </div>
              <div class="linha2">
                <span class="nota">{rotuloDia(l.data, estado.hoje)}</span>
                <select class="sel" aria-label="Categoria" value={sugestao(l)} onchange={e => (escolhas = { ...escolhas, [k]: (e.currentTarget as HTMLSelectElement).value })}>
                  {#each estado.categoriasAtivas as c (c.id)}<option value={c.id}>{c.emoji} {c.nome}</option>{/each}
                </select>
                <button class="mini ouro" type="button" onclick={() => registrar(l)}>Registrar</button>
                <button class="mini" type="button" onclick={() => ignorar([l])}>Ignorar</button>
              </div>
            </div>
          {/each}
        {:else}
          <p class="nota">Nada faltando. Tudo que saiu da conta está registrado. 💛</p>
        {/if}

        {#if r.provaveisFixos.length}
          <details class="fixos">
            <summary>Parecem fixos ou parcelas do plano ({r.provaveisFixos.length})</summary>
            {#each r.provaveisFixos as l (chaveLancamento(l) + 'f')}
              <div class="item-linha"><span>{limparDescricao(l.descricao)}<span class="meta">{rotuloDia(l.data, estado.hoje)}</span></span><span class="num">{brl(l.valor)}</span></div>
            {/each}
            <button class="btn suave" type="button" onclick={() => ignorar(r.provaveisFixos)}>Ignorar todos</button>
          </details>
        {/if}

        <button class="btn suave" type="button" onclick={() => arquivoInput?.click()}>Escolher outro arquivo</button>
      {/if}
      <input type="file" accept=".ofx,.csv,.txt,text/csv,application/x-ofx" hidden bind:this={arquivoInput} onchange={abrir} />
    </section>
  </div>
</div>

<style>
  .voltar { color: var(--gold-fill); font-weight: 700; font-size: 16px; padding: 6px 0; }
  .titulo { font-family: var(--f-display); font-weight: 800; font-size: 18px; }
  .espaco { width: 60px; }
  .rola { flex: 1; min-height: 0; overflow-y: auto; padding-bottom: var(--base); }
  .centro { display: grid; justify-items: center; }
  .erro { color: var(--bad); }
  .placar { display: flex; align-items: center; gap: 14px; background: var(--surface-2); border-radius: 18px; padding: 12px; }
  .pct { font-size: 40px; font-weight: 800; color: var(--gold); line-height: 1; }
  .falta { border-bottom: 1px solid var(--line); padding: 10px 0; display: grid; gap: 6px; }
  .linha1 { display: flex; justify-content: space-between; gap: 8px; font-weight: 600; }
  .linha1 .d { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .linha2 { display: grid; grid-template-columns: auto 1fr auto auto; gap: 6px; align-items: center; }
  .sel { height: 34px; border-radius: 10px; border: 1px solid var(--line); background: var(--surface-2); padding: 0 6px; min-width: 0; font-size: 16px; }
  .mini { height: 34px; padding: 0 10px; border-radius: 10px; background: var(--surface-2); font-weight: 600; font-size: 13px; }
  .mini.ouro { background: var(--gold-fill); color: #2A1E00; }
  .fixos summary { cursor: pointer; font-weight: 600; color: var(--muted); padding: 8px 0; }
  .fixos { display: grid; gap: 8px; }
</style>
