<script lang="ts">
  import { estado } from '../dados/estado.svelte';
  import { periodoSemana, rotuloDia } from '../dominio/datas';
  import { brl, brl0, brl0Sinal } from '../dominio/dinheiro';
  import { fala, type Situacao } from '../dominio/falas';
  import { imagemDoPet } from '../dominio/pet';
  import { atalhosAprendidos, chaveAtalho, sugerirCategorias } from '../dominio/sugestao';
  import Pet from './Pet.svelte';
  import Teclado from './Teclado.svelte';
  import { registrar, registroAtual } from './registrar';
  import { ui } from './ui.svelte';

  const STATUS = { folga: 'Folga', limite: 'No limite', passou: 'Passou' } as const;

  const s = $derived(estado.semana);
  const atual = $derived.by(() => { void ui.amt; void ui.desc; return registroAtual(); });
  const temValor = $derived(atual.valor > 0);
  const sugestao = $derived(sugerirCategorias(estado.gastos, estado.categorias, atual.descricao, new Date()));

  /** Atalhos: os fixados por você + os aprendidos (3 repetições), sem repetir. */
  const atalhos = $derived.by(() => {
    const fixados = estado.atalhos.map(a => ({ descricao: a.descricao, valor: a.valor, categoriaId: a.categoriaId }));
    const vistos = new Set(fixados.map(a => chaveAtalho(a.descricao, a.valor, a.categoriaId)));
    const aprendidos = atalhosAprendidos(estado.gastos, estado.hoje, estado.ajustes.atalhosOcultos)
      .filter(a => !vistos.has(chaveAtalho(a.descricao, a.valor, a.categoriaId)) && !estado.categoria(a.categoriaId).arquivada);
    return [...fixados, ...aprendidos].slice(0, 8);
  });

  const imagem = $derived(imagemDoPet(estado.fome, estado.humor, ui.comemorando));
  const situacao: Situacao = $derived(
    estado.gastos.length === 0 && estado.diasSemGasto.length === 0 ? 'boasVindas'
      : estado.fome === 'faminto' ? 'faminto' : estado.fome === 'fome' ? 'fome' : s.status,
  );
  // muda só quando a situação ou o tom mudam (não a cada registro)
  const falaHumor = $derived.by(() => fala(situacao, estado.ajustes.tom));
  const falaAtual = $derived(ui.falaEspecial ?? falaHumor);

  const pct = $derived(s.cota > 0 ? Math.min(100, (s.gasto / s.cota) * 100) : 100);

  const textoValor = $derived.by(() => {
    if (!ui.amt) return atual.doTexto ? brl(atual.valor) : 'R$ 0';
    const [i, d] = ui.amt.split(',');
    return 'R$ ' + Number(i || 0).toLocaleString('pt-BR') + (d !== undefined ? ',' + d : '');
  });

  const rotuloData = $derived(
    (ui.dataRegistro ? rotuloDia(ui.dataRegistro, estado.hoje) : 'Hoje') + (ui.parcelarEm > 1 ? ` · ${ui.parcelarEm}×` : ''),
  );

  function teclar(t: string) {
    if (t === 'apagar') ui.amt = ui.amt.slice(0, -1);
    else if (t === ',') { if (!ui.amt.includes(',')) ui.amt = (ui.amt || '0') + ','; }
    else {
      const [i, d] = ui.amt.split(',');
      if (d !== undefined) { if (d.length < 2) ui.amt += t; }
      else if ((i ?? '').length < 6) ui.amt = (ui.amt === '0' ? '' : ui.amt) + t;
    }
  }

  function teclaFisica(e: KeyboardEvent) {
    const alvo = e.target as HTMLElement;
    if (ui.folha || ui.ajustesAbertos || alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA') return;
    if (/^[0-9]$/.test(e.key)) teclar(e.key);
    else if (e.key === ',' || e.key === '.') teclar(',');
    else if (e.key === 'Backspace') teclar('apagar');
  }
</script>

<svelte:window onkeydown={teclaFisica} />

<section class="inicio">
  <div class="heroi">
    <div class="pet-linha">
      <button class="pet-btn" type="button" aria-label="Ver {estado.ajustes.nomePet}" onclick={() => ui.abrir({ tipo: 'pet' })}>
        <Pet {imagem} tamanho={76} />
      </button>
      <p class="balao" aria-live="polite">{falaAtual}</p>
    </div>

    <div>
      <div class="rotulo-h">Pode gastar nesta semana</div>
      <div class="grande-linha">
        <div class="grande" class:neg={s.pode < 0} data-testid="pode">{brl0Sinal(s.pode)}</div>
        <span class="status {s.status}"><i></i>{STATUS[s.status]}</span>
      </div>
    </div>
    <p class="sub">
      {#if s.pode >= 0}≈ <b>{brl0(s.porDia)}/dia</b> até domingo{:else}Passou <b>{brl0(-s.pode)}</b> da semana{/if}
      · {periodoSemana(s.segunda)}
    </p>
    <div class="barra" aria-hidden="true">
      <div class="preenche {s.status}" style="width:{pct}%"></div>
      <div class="marca-ritmo" style="left:calc({Math.min(100, s.fracaoVivida * 100)}% - 1px)"></div>
    </div>
    <div class="legenda"><span>{brl0(s.gasto)} de {brl0(s.cota)}</span><span>┆ ritmo de hoje</span></div>
  </div>

  <div class="registro">
    <div class="valor-linha">
      <div class="valor" class:vazio={!temValor} aria-live="polite" data-testid="valor">
        {textoValor}{#if !atual.doTexto}<span class="cursor"></span>{/if}
        {#if atual.doTexto}<span class="do-texto">do texto</span>{/if}
      </div>
      <button class="data-chip" class:on={!!ui.dataRegistro || ui.parcelarEm > 1} type="button" onclick={() => ui.abrir({ tipo: 'opcoes' })}>{rotuloData} ▾</button>
    </div>
    <input
      class="desc" type="text" placeholder="o que foi? (opcional)" autocomplete="off" enterkeyhint="done" aria-label="Descrição"
      bind:value={ui.desc} onkeydown={e => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur(); }}
    />
    <div class="chips">
      {#if temValor}
        {#each sugestao.ordem as id (id)}
          {@const c = estado.categoria(id)}
          <button class="chip" class:sug={id === sugestao.destaque} type="button" onclick={() => registrar(id)}>{c.emoji} {c.nome}</button>
        {/each}
        <button class="chip" type="button" onclick={() => ui.abrir({ tipo: 'categorias' })}>⋯ Todas</button>
      {:else if atalhos.length}
        {#each atalhos as a (chaveAtalho(a.descricao, a.valor, a.categoriaId))}
          <button class="chip" type="button" onclick={() => registrar(a.categoriaId, a.valor, a.descricao)}>
            {estado.categoria(a.categoriaId).emoji} {a.descricao} <span class="v">{brl(a.valor)}</span>
          </button>
        {/each}
      {:else}
        <p class="dica">Digite o valor e toque na categoria. Gastos que se repetem viram atalhos aqui.</p>
      {/if}
    </div>
    <Teclado aoTeclar={teclar} />
  </div>
</section>

<style>
  .inicio { min-height: 100%; display: flex; flex-direction: column; background: var(--surface); }
  .heroi {
    background: radial-gradient(120% 90% at 0% 0%, var(--hero-2) 0%, var(--hero) 62%);
    color: var(--hero-ink); padding: 4px 16px 14px; display: grid; gap: 8px; border-radius: 0 0 26px 26px;
  }
  .pet-linha { display: flex; align-items: center; gap: 10px; }
  .pet-btn { flex: 0 0 auto; border-radius: 50%; }
  .balao {
    position: relative; background: var(--bubble); color: var(--bubble-ink); border-radius: 16px;
    padding: 9px 12px; font-size: 14px; font-weight: 500; line-height: 1.3; min-width: 0;
  }
  .balao::before {
    content: ""; position: absolute; left: -6px; top: 50%; width: 12px; height: 12px;
    background: var(--bubble); transform: translateY(-50%) rotate(45deg); border-radius: 2px;
  }
  .rotulo-h { font-size: 11px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; color: var(--hero-muted); }
  .grande-linha { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
  .grande { font-family: var(--f-display); font-weight: 800; font-size: 46px; line-height: 1.02; letter-spacing: -.02em; color: var(--gold-fill); font-variant-numeric: tabular-nums; }
  .grande.neg { color: var(--h-bad); }
  .status { display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px; border-radius: 999px; font-size: 12px; font-weight: 700; background: rgba(255,255,255,.09); white-space: nowrap; margin-bottom: 5px; }
  .status i { width: 8px; height: 8px; border-radius: 99px; background: currentColor; }
  .status.folga { color: var(--h-ok); } .status.limite { color: var(--h-warn); } .status.passou { color: var(--h-bad); }
  .sub { font-size: 13px; color: var(--hero-muted); }
  .sub b { color: var(--hero-ink); font-weight: 600; }
  .barra { position: relative; height: 8px; border-radius: 99px; background: rgba(255,255,255,.12); }
  .preenche { position: absolute; inset: 0 auto 0 0; border-radius: 99px; background: linear-gradient(90deg, #E9A92C, #F7CD6A); transition: width .4s ease; }
  .preenche.limite { background: linear-gradient(90deg, #E98F1E, #FFB547); }
  .preenche.passou { background: linear-gradient(90deg, #E45A5A, #FF8080); }
  .marca-ritmo { position: absolute; top: -4px; bottom: -4px; width: 2px; border-radius: 2px; background: var(--hero-ink); opacity: .75; }
  .legenda { display: flex; justify-content: space-between; font-size: 12px; color: var(--hero-muted); font-variant-numeric: tabular-nums; }

  .registro { margin-top: auto; padding: 10px 16px 10px; display: grid; gap: 7px; }
  .valor-linha { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .valor { font-family: var(--f-display); font-weight: 700; font-size: 32px; letter-spacing: -.02em; font-variant-numeric: tabular-nums; display: flex; align-items: center; min-width: 0; gap: 0; }
  .valor.vazio { color: var(--muted); opacity: .55; }
  .cursor { width: 2px; height: 28px; background: var(--gold-fill); margin-left: 3px; border-radius: 2px; animation: pisca 1s steps(1) infinite; }
  @keyframes pisca { 50% { opacity: 0 } }
  .do-texto { font-family: var(--f-body); font-size: 12px; font-weight: 600; color: var(--gold); background: var(--gold-soft); border-radius: 99px; padding: 2px 8px; margin-left: 8px; letter-spacing: 0; }
  .data-chip { height: 32px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--line); font-size: 13px; font-weight: 600; color: var(--muted); white-space: nowrap; }
  .data-chip.on { border-color: var(--gold-fill); color: var(--gold); background: var(--gold-soft); }
  .desc { width: 100%; height: 36px; border: 0; border-bottom: 1px solid var(--line); background: transparent; padding: 0 2px; font-size: 16px; }
  .desc::placeholder { color: var(--muted); opacity: .8; }
  .desc:focus { outline: none; border-bottom-color: var(--gold-fill); }
  .chips { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; margin: 0 -16px; padding: 2px 16px; min-height: 42px; align-items: center; }
  .chips::-webkit-scrollbar { display: none; }
  .chip {
    flex: 0 0 auto; display: inline-flex; align-items: center; gap: 6px; height: 40px; padding: 0 14px; border-radius: 999px;
    background: var(--surface-2); border: 1px solid transparent; font-weight: 600; font-size: 14px; white-space: nowrap;
  }
  .chip .v { color: var(--muted); font-weight: 500; font-variant-numeric: tabular-nums; }
  .chip.sug { border-color: var(--gold-fill); background: var(--gold-soft); }
  .chip:active { transform: scale(.97); }
  .dica { font-size: 13px; color: var(--muted); padding: 4px 0; white-space: normal; }
</style>
