<script lang="ts">
  import { onMount } from 'svelte';
  import { exportarArquivo, exportarCSV, lerArquivoDeBackup } from '../dados/arquivos';
  import { baixarBackup, enviarBackup, verificarServidor, type Disponibilidade } from '../dados/backup';
  import { normalizarCodigo } from '../dados/cripto';
  import type { Snapshot } from '../dados/db';
  import { estado, novoId } from '../dados/estado.svelte';
  import { brl } from './dinheiro';
  import { fala } from '../dominio/falas';
  import { atalhosAprendidos, chaveAtalho } from '../dominio/sugestao';
  import type { Categoria } from '../dominio/tipos';
  import CampoDinheiro from './CampoDinheiro.svelte';
  import { ui } from './ui.svelte';

  let servidor = $state<Disponibilidade>('desconhecido');
  let enviando = $state(false);
  let mostrarCodigo = $state(false);
  let codigoRestaurar = $state('');
  let restaurando = $state(false);
  let confirmarSubstituir = $state.raw<Snapshot | null>(null);
  let confirmarApagar = $state(false);
  let erro = $state<string | null>(null);
  let novaCat = $state({ emoji: '🏷️', nome: '' });
  let novoAtalho = $state({ descricao: '', valor: 0, categoriaId: '' });
  let arquivoInput: HTMLInputElement | undefined = $state();

  const cats = $derived([...estado.categorias].sort((a, b) => a.ordem - b.ordem));
  const aprendidos = $derived(atalhosAprendidos(estado.gastos, estado.hoje, estado.ajustes.atalhosOcultos)
    .filter(a => !estado.atalhos.some(f => chaveAtalho(f.descricao, f.valor, f.categoriaId) === chaveAtalho(a.descricao, a.valor, a.categoriaId))));

  onMount(() => { void verificarServidor().then(d => (servidor = d)); });

  function quando(ms: number | null): string {
    if (!ms) return 'nunca';
    const min = Math.round((Date.now() - ms) / 60000);
    if (min < 1) return 'agora há pouco';
    if (min < 60) return `há ${min} min`;
    const h = Math.round(min / 60);
    if (h < 24) return `há ${h} h`;
    const d = Math.round(h / 24);
    return d === 1 ? 'ontem' : `há ${d} dias`;
  }

  async function salvarCats(lista: Categoria[]) {
    await estado.salvarCategorias(lista.map((c, i) => ({ ...c, ordem: i })));
  }
  function mudarCat(id: string, patch: Partial<Categoria>) {
    void salvarCats(cats.map(c => (c.id === id ? { ...c, ...patch } : c)));
  }
  function moverCat(i: number, d: number) {
    const l = [...cats];
    const j = i + d;
    if (j < 0 || j >= l.length) return;
    [l[i], l[j]] = [l[j], l[i]];
    void salvarCats(l);
  }
  async function adicionarCat() {
    if (!novaCat.nome.trim()) return;
    await salvarCats([...cats, { id: novoId(), nome: novaCat.nome.trim(), emoji: novaCat.emoji.trim() || '🏷️', essencial: false, ordem: cats.length, arquivada: false }]);
    novaCat = { emoji: '🏷️', nome: '' };
  }

  async function fixarAtalho(descricao: string, valor: number, categoriaId: string) {
    if (!descricao.trim() || !valor || !categoriaId) return;
    await estado.salvarAtalho({ id: novoId(), descricao: descricao.trim(), valor, categoriaId });
  }
  async function esconderAprendido(k: string) {
    await estado.ajustar({ atalhosOcultos: [...estado.ajustes.atalhosOcultos, k] });
  }

  async function backupAgora() {
    enviando = true;
    const ok = await enviarBackup();
    enviando = false;
    ui.avisar(ok ? 'Backup feito ☁️' : 'Não deu pra fazer o backup agora');
  }

  async function copiarCodigo() {
    try {
      await navigator.clipboard.writeText(estado.ajustes.codigo ?? '');
      ui.avisar('Código copiado');
    } catch {
      mostrarCodigo = true;
      ui.avisar('Não deu pra copiar; o código está na tela');
    }
  }

  async function buscarPorCodigo() {
    erro = null;
    const c = normalizarCodigo(codigoRestaurar);
    if (!c) { erro = 'Esse código não parece certo. São 20 letras e números.'; return; }
    restaurando = true;
    try {
      confirmarSubstituir = await baixarBackup(c);
    } catch (e) {
      erro = e instanceof Error ? e.message : 'Falhou';
    } finally {
      restaurando = false;
    }
  }

  async function lerArquivo(e: Event) {
    erro = null;
    const f = (e.currentTarget as HTMLInputElement).files?.[0];
    if (!f) return;
    try {
      confirmarSubstituir = await lerArquivoDeBackup(f);
    } catch (err) {
      erro = err instanceof Error ? err.message : 'Falhou';
    }
    if (arquivoInput) arquivoInput.value = '';
  }

  async function substituir() {
    if (!confirmarSubstituir) return;
    const codigoNovo = normalizarCodigo(codigoRestaurar);
    try {
      await estado.importar(confirmarSubstituir);
    } catch (e) {
      erro = 'Não consegui restaurar: ' + (e instanceof Error ? e.message : String(e));
      return;
    }
    if (codigoNovo) await estado.ajustar({ codigo: codigoNovo });
    confirmarSubstituir = null;
    codigoRestaurar = '';
    ui.ajustesAbertos = false;
    ui.festejar(fala('restaurado', estado.ajustes.tom));
    ui.avisar('Dados restaurados');
  }

  async function apagarTudo() {
    await estado.apagarTudo();
    ui.ajustesAbertos = false;
  }

  async function exportar(tipo: 'arquivo' | 'csv') {
    const r = tipo === 'arquivo' ? await exportarArquivo() : await exportarCSV();
    if (r !== 'cancelado') ui.avisar(tipo === 'arquivo' ? 'Arquivo de backup pronto' : 'Planilha pronta');
  }
</script>

<div class="tela-cheia" role="dialog" aria-modal="true" aria-label="Ajustes">
  <header class="topo">
    <button class="voltar" type="button" onclick={() => (ui.ajustesAbertos = false)}>‹ Voltar</button>
    <span class="titulo">Ajustes</span>
    <span class="espaco"></span>
  </header>

  <div class="rola">
    <section class="pagina">
      <div class="bloco">
        <div class="linha-interruptor">
          <div>
            <h3>🙈 Modo discreto</h3>
            <p class="nota">Troca todos os valores por “R$ •••” pra mostrar o app pra alguém. Planilha e backup continuam com os valores.</p>
          </div>
          <button class="interruptor" type="button" role="switch" aria-checked={estado.ajustes.esconderValores} aria-label="Esconder valores"
            onclick={() => estado.ajustar({ esconderValores: !estado.ajustes.esconderValores })}><i></i></button>
        </div>
      </div>

      <div class="bloco">
        <h3>🪙 Moedinha</h3>
        <label class="campo"><span>Nome</span>
          <input class="entrada" id="aj-nome" value={estado.ajustes.nomePet} maxlength="20" autocomplete="off"
            onchange={e => estado.ajustar({ nomePet: (e.currentTarget as HTMLInputElement).value.trim() || 'Moedinha' })} />
        </label>
        <div class="campo"><span>Tom</span>
          <div class="seg" role="radiogroup">
            <button type="button" class:on={estado.ajustes.tom === 'fofo'} onclick={() => estado.ajustar({ tom: 'fofo' })}>🧸 Fofo</button>
            <button type="button" class:on={estado.ajustes.tom === 'sem'} onclick={() => estado.ajustar({ tom: 'sem' })}>🌶️ Sem filtro</button>
          </div>
        </div>
      </div>

      <div class="bloco">
        <h3>🏷️ Categorias</h3>
        <p class="nota">Essencial não pergunta “valeu a pena?”. Arquivar esconde sem apagar o histórico.</p>
        <div class="cats">
          {#each cats as c, i (c.id)}
            <div class="cat" class:arquivada={c.arquivada}>
              <input class="emoji" value={c.emoji} aria-label="Emoji de {c.nome}" maxlength="4" onchange={e => mudarCat(c.id, { emoji: (e.currentTarget as HTMLInputElement).value.trim() || c.emoji })} />
              <input class="nome" value={c.nome} aria-label="Nome da categoria" onchange={e => mudarCat(c.id, { nome: (e.currentTarget as HTMLInputElement).value.trim() || c.nome })} />
              <button class="mini" class:ativo={c.essencial} type="button" onclick={() => mudarCat(c.id, { essencial: !c.essencial })}>{c.essencial ? 'essencial' : 'não essencial'}</button>
              <button class="seta" type="button" aria-label="Subir" disabled={i === 0} onclick={() => moverCat(i, -1)}>↑</button>
              <button class="seta" type="button" aria-label="Descer" disabled={i === cats.length - 1} onclick={() => moverCat(i, 1)}>↓</button>
              <button class="seta" type="button" aria-label={c.arquivada ? 'Reativar' : 'Arquivar'} onclick={() => mudarCat(c.id, { arquivada: !c.arquivada })}>{c.arquivada ? '↺' : '×'}</button>
            </div>
          {/each}
        </div>
        <form class="nova-cat" onsubmit={e => { e.preventDefault(); void adicionarCat(); }}>
          <input class="emoji entrada" aria-label="Emoji" bind:value={novaCat.emoji} maxlength="4" />
          <input class="entrada" placeholder="Nova categoria" aria-label="Nome da nova categoria" bind:value={novaCat.nome} />
          <button class="btn suave curto" type="submit" disabled={!novaCat.nome.trim()}>Criar</button>
        </form>
      </div>

      <div class="bloco">
        <h3>⚡ Atalhos</h3>
        <p class="nota">Aparecem no Início quando nenhum valor foi digitado: 1 toque registra.</p>
        {#each estado.atalhos as a (a.id)}
          <div class="item-linha"><span>{estado.categoria(a.categoriaId).emoji} {a.descricao} · {brl(a.valor)}<span class="meta">fixado</span></span>
            <button class="mini" type="button" onclick={() => estado.apagarAtalho(a.id)}>Remover</button></div>
        {/each}
        {#each aprendidos as a (chaveAtalho(a.descricao, a.valor, a.categoriaId))}
          <div class="item-linha"><span>{estado.categoria(a.categoriaId).emoji} {a.descricao} · {brl(a.valor)}<span class="meta">aprendido ({a.vezes}×)</span></span>
            <span class="acoes">
              <button class="mini" type="button" onclick={() => fixarAtalho(a.descricao, a.valor, a.categoriaId)}>Fixar</button>
              <button class="mini" type="button" onclick={() => esconderAprendido(chaveAtalho(a.descricao, a.valor, a.categoriaId))}>Esconder</button>
            </span></div>
        {/each}
        <form class="novo-atalho" onsubmit={e => { e.preventDefault(); void fixarAtalho(novoAtalho.descricao, novoAtalho.valor, novoAtalho.categoriaId).then(() => (novoAtalho = { descricao: '', valor: 0, categoriaId: '' })); }}>
          <input class="entrada" placeholder="Novo atalho (ex.: Café)" aria-label="Descrição do atalho" bind:value={novoAtalho.descricao} />
          <div class="duas">
            <CampoDinheiro rotulo="Valor do atalho" valor={novoAtalho.valor} largura="100%" aoMudar={v => (novoAtalho.valor = v)} />
            <select class="entrada" aria-label="Categoria do atalho" bind:value={novoAtalho.categoriaId}>
              <option value="">Categoria…</option>
              {#each estado.categoriasAtivas as c (c.id)}<option value={c.id}>{c.emoji} {c.nome}</option>{/each}
            </select>
          </div>
          <button class="btn suave" type="submit" disabled={!novoAtalho.descricao.trim() || !novoAtalho.valor || !novoAtalho.categoriaId}>Fixar atalho</button>
        </form>
      </div>

      <div class="bloco">
        <h3>⏱️ Custo em horas de trabalho</h3>
        <p class="nota">Mostra, depois de cada gasto, quanto tempo do seu trabalho ele custou. Deixe 0 pra desligar.</p>
        <label class="campo"><span>Horas trabalhadas por mês</span>
          <input class="entrada" id="aj-horas" type="number" inputmode="numeric" min="0" max="400" value={estado.ajustes.horasPorMes || ''} placeholder="0 (desligado)"
            onchange={e => estado.ajustar({ horasPorMes: Math.max(0, Math.min(400, Number((e.currentTarget as HTMLInputElement).value) || 0)) })} />
        </label>
      </div>

      <div class="bloco">
        <h3>☁️ Backup</h3>
        <div class="stats">
          <div class="stat"><div class="k">Nuvem</div><div class="v pequeno">{servidor === 'sim' ? 'Ligada' : servidor === 'offline' ? 'Sem internet' : servidor === 'nao-configurado' ? 'Não configurada' : '…'}</div></div>
          <div class="stat"><div class="k">Último backup</div><div class="v pequeno">{quando(estado.ajustes.ultimoBackupEm)}</div></div>
        </div>
        {#if __PREVIA__}
          <p class="nota">Na prévia, o backup na nuvem e os arquivos ficam desligados. Os dados daqui não vão pro app de verdade.</p>
        {:else if servidor === 'nao-configurado'}
          <p class="nota">O servidor ainda não tem o armazenamento de backup ligado (veja o guia de deploy). Enquanto isso, use o arquivo.</p>
        {/if}
        {#if estado.ajustes.backupErro && servidor === 'sim'}<p class="nota erro">Último erro: {estado.ajustes.backupErro}</p>{/if}
        <div class="codigo">
          <div class="rotulo">Seu código de recuperação</div>
          <div class="codigo-v num">{mostrarCodigo ? estado.ajustes.codigo : '•••••-•••••-•••••-•••••'}</div>
          <div class="btn-linha">
            <button class="btn suave" type="button" onclick={() => (mostrarCodigo = !mostrarCodigo)}>{mostrarCodigo ? 'Esconder' : 'Mostrar'}</button>
            <button class="btn suave" type="button" onclick={copiarCodigo}>Copiar</button>
          </div>
          <p class="nota">Ele é seu login e sua chave: guarde nas Notas ou nas Senhas do iPhone. Sem ele, um backup não abre.</p>
        </div>
        <button class="btn primario" type="button" disabled={enviando || servidor !== 'sim'} onclick={backupAgora}>{enviando ? 'Enviando…' : 'Fazer backup agora'}</button>
        {#if !__PREVIA__}
        <div class="btn-linha">
          <button class="btn suave" type="button" onclick={() => exportar('arquivo')}>Salvar arquivo</button>
          <button class="btn suave" type="button" onclick={() => exportar('csv')}>Planilha (CSV)</button>
        </div>
        <p class="nota">Arquivo salvo: {quando(estado.ajustes.ultimoArquivoEm)}.</p>
        {/if}

        {#if !__PREVIA__}
        <details class="restaurar">
          <summary>Restaurar de outro backup</summary>
          <div class="pilha">
            <input class="entrada num" placeholder="XXXXX-XXXXX-XXXXX-XXXXX" aria-label="Código de recuperação" autocapitalize="characters" autocomplete="off" bind:value={codigoRestaurar} />
            <button class="btn suave" type="button" disabled={restaurando || !codigoRestaurar.trim()} onclick={buscarPorCodigo}>{restaurando ? 'Buscando…' : 'Buscar pelo código'}</button>
            <button class="btn suave" type="button" onclick={() => arquivoInput?.click()}>Abrir arquivo de backup</button>
            <input type="file" accept="application/json,.json" hidden bind:this={arquivoInput} onchange={lerArquivo} />
            {#if erro}<p class="nota erro">{erro}</p>{/if}
            {#if confirmarSubstituir}
              <div class="confirma">
                <p>Achei um backup de <b>{new Date(confirmarSubstituir.criadoEm).toLocaleString('pt-BR')}</b> com {confirmarSubstituir.tabelas.gastos.length} gastos. Ele vai <b>substituir tudo</b> que está neste aparelho.</p>
                <div class="btn-linha">
                  <button class="btn perigo" type="button" onclick={substituir}>Substituir</button>
                  <button class="btn suave" type="button" onclick={() => (confirmarSubstituir = null)}>Cancelar</button>
                </div>
              </div>
            {/if}
          </div>
        </details>
        {/if}
      </div>

      <div class="bloco">
        <h3>Sobre</h3>
        <p class="nota">Okane {__VERSAO__} · seus dados ficam neste aparelho e no backup cifrado. Ninguém mais lê.</p>
        {#if !confirmarApagar}
          <button class="btn perigo" type="button" onclick={() => (confirmarApagar = true)}>Apagar todos os dados deste aparelho</button>
        {:else}
          <div class="confirma">
            <p>Isso apaga tudo daqui. O backup na nuvem continua lá (dá pra restaurar com o código).</p>
            <div class="btn-linha">
              <button class="btn perigo" type="button" onclick={apagarTudo}>Apagar mesmo</button>
              <button class="btn suave" type="button" onclick={() => (confirmarApagar = false)}>Cancelar</button>
            </div>
          </div>
        {/if}
      </div>
    </section>
  </div>
</div>

<style>
  .voltar { color: var(--gold-fill); font-weight: 700; font-size: 16px; padding: 6px 0; }
  .titulo { font-family: var(--f-display); font-weight: 800; font-size: 18px; }
  .espaco { width: 60px; }
  .rola { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding-bottom: var(--base); }
  .bloco { display: grid; gap: 10px; padding-bottom: 18px; border-bottom: 1px solid var(--line); }
  .bloco:last-child { border-bottom: 0; }
  h3 { font-family: var(--f-display); font-size: 18px; font-weight: 800; }
  .cats { display: grid; gap: 6px; }
  .cat { display: grid; grid-template-columns: 40px 1fr auto 30px 30px 30px; gap: 4px; align-items: center; }
  .cat.arquivada { opacity: .45; }
  .cat input { height: 38px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface-2); padding: 0 8px; min-width: 0; font-size: 16px; }
  .cat .emoji { text-align: center; padding: 0; }
  .mini { height: 32px; padding: 0 10px; border-radius: 10px; background: var(--surface-2); font-weight: 600; font-size: 12px; white-space: nowrap; }
  .mini.ativo { background: var(--ok-soft); color: var(--ok); }
  .seta { height: 32px; border-radius: 10px; color: var(--muted); font-size: 16px; }
  .seta:disabled { opacity: .25; }
  .nova-cat { display: grid; grid-template-columns: 56px 1fr auto; gap: 6px; }
  .nova-cat .emoji { text-align: center; padding: 0; }
  .curto { width: auto; }
  .acoes { display: flex; gap: 6px; }
  .novo-atalho { display: grid; gap: 8px; }
  .duas { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .duas :global(.dinheiro) { width: 100%; }
  .pequeno { font-size: 15px; }
  .codigo { background: var(--surface-2); border-radius: 16px; padding: 12px; display: grid; gap: 8px; }
  .codigo .btn { background: var(--surface); }
  .codigo-v { font-size: 18px; font-weight: 700; letter-spacing: .04em; word-break: break-all; }
  .erro { color: var(--bad); }
  .restaurar summary { cursor: pointer; font-weight: 600; color: var(--muted); padding: 8px 0; }
  .linha-interruptor { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
  .linha-interruptor > div { display: grid; gap: 4px; }
  .interruptor { flex: 0 0 auto; width: 52px; height: 32px; border-radius: 99px; background: var(--surface-2); border: 1px solid var(--line); position: relative; transition: background .2s; }
  .interruptor i { position: absolute; top: 3px; left: 3px; width: 24px; height: 24px; border-radius: 99px; background: var(--muted); transition: transform .2s, background .2s; }
  .interruptor[aria-checked="true"] { background: var(--gold-fill); border-color: var(--gold-fill); }
  .interruptor[aria-checked="true"] i { transform: translateX(20px); background: #fff; }
  .confirma { background: var(--bad-soft); border-radius: 14px; padding: 12px; display: grid; gap: 10px; }
</style>
