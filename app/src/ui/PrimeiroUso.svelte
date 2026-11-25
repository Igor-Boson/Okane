<script lang="ts">
  import { lerArquivoDeBackup } from '../dados/arquivos';
  import { baixarBackup } from '../dados/backup';
  import { gerarCodigo, normalizarCodigo } from '../dados/cripto';
  import type { Snapshot } from '../dados/db';
  import { estado } from '../dados/estado.svelte';
  import { CATEGORIAS_PADRAO } from '../dominio/categorias';
  import { diaDoMes, diasNoMes, mesDe } from '../dominio/datas';
  import { brl0 } from '../dominio/dinheiro';
  import { fala } from '../dominio/falas';
  import type { Tom } from '../dominio/tipos';
  import CampoDinheiro from './CampoDinheiro.svelte';
  import Pet from './Pet.svelte';
  import { ui } from './ui.svelte';

  type Passo = 'oi' | 'restaurar' | 'salario' | 'fixos' | 'parcelas' | 'categorias' | 'moedinha' | 'codigo' | 'pronto';
  const ORDEM: Passo[] = ['salario', 'fixos', 'parcelas', 'categorias', 'moedinha', 'codigo', 'pronto'];
  const SUGESTOES_FIXOS = ['Aluguel', 'Condomínio', 'Luz', 'Água', 'Gás', 'Internet', 'Celular', 'Academia', 'Streaming', 'Plano de saúde', 'Faculdade', 'Transporte'];

  let passo = $state<Passo>('oi');
  let salario = $state(0);
  let fixos = $state<{ nome: string; valor: number }[]>([]);
  let novoFixo = $state('');
  let parcelas = $state<{ nome: string; valor: number; faltam: number }[]>([]);
  let desligadas = $state<string[]>([]);
  let nomePet = $state('Moedinha');
  let tom = $state<Tom>('fofo');
  const codigo = gerarCodigo();
  let guardou = $state(false);
  let salvando = $state(false);

  // restaurar
  let codigoRestaurar = $state('');
  let erro = $state<string | null>(null);
  let buscando = $state(false);
  let achado = $state.raw<Snapshot | null>(null);
  let arquivoInput: HTMLInputElement | undefined = $state();

  const indice = $derived(ORDEM.indexOf(passo));
  const totalFixos = $derived(fixos.reduce((s, f) => s + f.valor, 0));
  const totalParcelas = $derived(parcelas.reduce((s, p) => s + (p.faltam > 0 ? p.valor : 0), 0));
  const livreMes = $derived(salario - totalFixos - totalParcelas);
  const mes = mesDe(estado.hoje);
  const diasRestantes = diasNoMes(mes) - diaDoMes(estado.hoje) + 1;
  const porSemana = $derived(Math.max(0, livreMes) * 7 / diasNoMes(mes));

  function avancar() { passo = ORDEM[Math.min(ORDEM.length - 1, indice + 1)]; }
  function voltar() { passo = indice <= 0 ? 'oi' : ORDEM[indice - 1]; }

  function alternarFixo(nome: string) {
    fixos = fixos.some(f => f.nome === nome) ? fixos.filter(f => f.nome !== nome) : [...fixos, { nome, valor: 0 }];
  }
  function adicionarFixo() {
    const n = novoFixo.trim();
    if (n && !fixos.some(f => f.nome === n)) fixos = [...fixos, { nome: n, valor: 0 }];
    novoFixo = '';
  }

  async function copiar() {
    try { await navigator.clipboard.writeText(codigo); ui.avisar('Código copiado'); } catch { /* o código está na tela */ }
  }

  async function concluir() {
    salvando = true;
    await estado.concluirPrimeiroUso({
      salario, fixos: fixos.filter(f => f.valor > 0), parcelas, categoriasDesligadas: desligadas, nomePet, tom, codigo,
    });
  }

  async function buscar() {
    erro = null;
    const c = normalizarCodigo(codigoRestaurar);
    if (!c) { erro = 'Esse código não parece certo. São 20 letras e números.'; return; }
    buscando = true;
    try { achado = await baixarBackup(c); } catch (e) { erro = e instanceof Error ? e.message : 'Falhou'; } finally { buscando = false; }
  }
  async function abrirArquivo(e: Event) {
    erro = null;
    const f = (e.currentTarget as HTMLInputElement).files?.[0];
    if (!f) return;
    try { achado = await lerArquivoDeBackup(f); } catch (err) { erro = err instanceof Error ? err.message : 'Falhou'; }
  }
  async function restaurar() {
    if (!achado) return;
    erro = null;
    const c = normalizarCodigo(codigoRestaurar);
    try {
      await estado.importar(achado);
      if (c) await estado.ajustar({ codigo: c });
      else if (!estado.ajustes.codigo) await estado.ajustar({ codigo: gerarCodigo() });
      ui.festejar(fala('restaurado', estado.ajustes.tom));
    } catch (e) {
      erro = 'Não consegui restaurar: ' + (e instanceof Error ? e.message : String(e));
    }
  }
</script>

<div class="po">
  {#if passo !== 'oi' && passo !== 'restaurar'}
    <header class="po-topo">
      <button class="voltar" type="button" onclick={voltar}>‹</button>
      <div class="pontos" aria-label="Passo {indice + 1} de {ORDEM.length}">
        {#each ORDEM as p, i (p)}<span class:on={i <= indice}></span>{/each}
      </div>
      <span class="espaco"></span>
    </header>
  {/if}

  <div class="po-corpo">
    {#if passo === 'oi'}
      <div class="centro">
        <Pet imagem="feliz" tamanho={150} />
        <h1>Okane</h1>
        <p class="lema">Registre em segundos. Sinta cada gasto.</p>
        <p class="fala-oi">{fala('boasVindas', 'fofo')}</p>
      </div>
      <div class="acoes">
        <button class="btn ouro" type="button" onclick={() => (passo = 'salario')}>Começar</button>
        <button class="btn suave" type="button" onclick={() => (passo = 'restaurar')}>Já uso o Okane</button>
      </div>

    {:else if passo === 'restaurar'}
      <h1>Restaurar</h1>
      <p class="nota">Digite o código de recuperação que você guardou. Ou abra um arquivo de backup.</p>
      <input class="entrada num grande-in" placeholder="XXXXX-XXXXX-XXXXX-XXXXX" aria-label="Código de recuperação" autocapitalize="characters" autocomplete="off" bind:value={codigoRestaurar} />
      <button class="btn primario" type="button" disabled={buscando || !codigoRestaurar.trim()} onclick={buscar}>{buscando ? 'Buscando…' : 'Buscar backup'}</button>
      <button class="btn suave" type="button" onclick={() => arquivoInput?.click()}>Abrir arquivo de backup</button>
      <input type="file" accept="application/json,.json" hidden bind:this={arquivoInput} onchange={abrirArquivo} />
      {#if erro}<p class="nota erro">{erro}</p>{/if}
      {#if achado}
        <div class="achado">
          <p>Achei! Backup de <b>{new Date(achado.criadoEm).toLocaleString('pt-BR')}</b>, com {achado.tabelas.gastos.length} gastos.</p>
          <button class="btn ouro" type="button" onclick={restaurar}>Restaurar tudo</button>
        </div>
      {/if}
      <button class="link" type="button" onclick={() => (passo = 'oi')}>‹ Voltar</button>

    {:else if passo === 'salario'}
      <h1>Quanto cai na sua conta por mês?</h1>
      <p class="nota">Salário líquido, o que entra de verdade.</p>
      <div class="grande-campo"><CampoDinheiro id="po-salario" rotulo="Salário" valor={salario} largura="100%" aoMudar={v => (salario = v)} /></div>
      <div class="acoes"><button class="btn primario" type="button" disabled={!salario} onclick={avancar}>Continuar</button></div>

    {:else if passo === 'fixos'}
      <h1>Quais são seus gastos fixos?</h1>
      <p class="nota">Contas que vêm todo mês. Elas saem antes do seu dinheiro da semana e não pedem reflexão.</p>
      <div class="chips-po">
        {#each SUGESTOES_FIXOS as s (s)}
          <button type="button" class="chip-po" class:on={fixos.some(f => f.nome === s)} onclick={() => alternarFixo(s)}>{s}</button>
        {/each}
      </div>
      {#each fixos as f, i (f.nome)}
        <div class="item-linha">
          <span>{f.nome}</span>
          <span class="dir">
            <CampoDinheiro rotulo={f.nome} valor={f.valor} largura="100px" aoMudar={v => (fixos[i].valor = v)} />
            <button class="x" type="button" aria-label="Remover {f.nome}" onclick={() => (fixos = fixos.filter((_, j) => j !== i))}>×</button>
          </span>
        </div>
      {/each}
      <form class="novo" onsubmit={e => { e.preventDefault(); adicionarFixo(); }}>
        <input class="entrada" placeholder="Outro fixo…" aria-label="Outro gasto fixo" bind:value={novoFixo} />
        <button class="btn suave curto" type="submit" disabled={!novoFixo.trim()}>+</button>
      </form>
      <p class="nota">Total: <b>{brl0(totalFixos)}</b></p>
      <div class="acoes"><button class="btn primario" type="button" onclick={avancar}>{fixos.length ? 'Continuar' : 'Pular'}</button></div>

    {:else if passo === 'parcelas'}
      <h1>Tem parcelas em aberto?</h1>
      <p class="nota">Compras parceladas que ainda estão caindo. Elas somem sozinhas quando acabarem.</p>
      {#each parcelas as p, i (i)}
        <div class="parcela">
          <input class="entrada" placeholder="O que é (ex.: notebook)" aria-label="Nome da parcela" bind:value={parcelas[i].nome} />
          <div class="duas">
            <label class="campo"><span>Valor da parcela</span><CampoDinheiro rotulo="Valor da parcela" valor={p.valor} largura="100%" aoMudar={v => (parcelas[i].valor = v)} /></label>
            <label class="campo"><span>Faltam (com esta)</span><input class="entrada" type="number" inputmode="numeric" min="1" max="99" bind:value={parcelas[i].faltam} /></label>
          </div>
          <button class="link" type="button" onclick={() => (parcelas = parcelas.filter((_, j) => j !== i))}>Remover</button>
        </div>
      {/each}
      <button class="btn suave" type="button" onclick={() => (parcelas = [...parcelas, { nome: '', valor: 0, faltam: 2 }])}>+ Adicionar parcela</button>
      <div class="acoes"><button class="btn primario" type="button" onclick={avancar}>{parcelas.length ? 'Continuar' : 'Não tenho'}</button></div>

    {:else if passo === 'categorias'}
      <h1>Suas categorias</h1>
      <p class="nota">Poucas e suas. Toque pra desligar as que não fazem sentido. Dá pra mudar tudo depois.</p>
      <div class="grade-cat">
        {#each CATEGORIAS_PADRAO as c (c.id)}
          <button type="button" class:on={!desligadas.includes(c.id)} onclick={() => (desligadas = desligadas.includes(c.id) ? desligadas.filter(x => x !== c.id) : [...desligadas, c.id])}>
            <span>{c.emoji}</span><span class="nome-cat">{c.nome}</span>
          </button>
        {/each}
      </div>
      <p class="nota">🛒 Mercado, 🚗 Transporte e 💊 Saúde são essenciais: não perguntam “valeu a pena?”.</p>
      <div class="acoes"><button class="btn primario" type="button" disabled={desligadas.length >= CATEGORIAS_PADRAO.length} onclick={avancar}>Continuar</button></div>

    {:else if passo === 'moedinha'}
      <div class="centro"><Pet imagem={tom === 'fofo' ? 'feliz' : 'preocupado'} tamanho={120} /></div>
      <h1>Como ela se chama?</h1>
      <input class="entrada grande-in" aria-label="Nome da moedinha" maxlength="20" bind:value={nomePet} />
      <div class="campo"><span>Jeito de falar</span>
        <div class="seg">
          <button type="button" class:on={tom === 'fofo'} onclick={() => (tom = 'fofo')}>🧸 Fofo</button>
          <button type="button" class:on={tom === 'sem'} onclick={() => (tom = 'sem')}>🌶️ Sem filtro</button>
        </div>
      </div>
      <div class="fala"><img src="/pet/{tom === 'fofo' ? 'feliz' : 'preocupado'}.webp" alt="" /><p>{fala('grande', tom, { v: 'R$ 180', pct: 45 }, () => 0)}</p></div>
      <div class="acoes"><button class="btn primario" type="button" disabled={!nomePet.trim()} onclick={avancar}>Continuar</button></div>

    {:else if passo === 'codigo'}
      <h1>Seu código de recuperação</h1>
      <p class="nota">Ele é seu login e a chave do seu backup. Trocou de celular? É com ele que tudo volta. <b>Guarde bem</b>: nas Notas, nas Senhas do iPhone ou num papel.</p>
      <div class="codigo num" data-testid="codigo">{codigo}</div>
      <button class="btn suave" type="button" onclick={copiar}>Copiar código</button>
      <label class="check"><input type="checkbox" bind:checked={guardou} /> Guardei em lugar seguro</label>
      <div class="acoes">
        <button class="btn primario" type="button" disabled={!guardou} onclick={avancar}>Continuar</button>
        <button class="link" type="button" onclick={avancar}>Guardo depois (fica em Ajustes)</button>
      </div>

    {:else if passo === 'pronto'}
      <div class="centro">
        <Pet imagem="comemorando" tamanho={140} />
        <p class="lema">Você tem</p>
        <p class="valor-final num">≈ {brl0(porSemana)}</p>
        <p class="lema">por semana pra gastar.</p>
      </div>
      <p class="nota centro-t">
        {#if diasRestantes < diasNoMes(mes)}Este mês começa hoje, então ele conta só os {diasRestantes} dias que faltam (e esta semana, só os dias que sobram dela). {/if}
        No primeiro mês a meta de guardar fica em R$ 0: é só pra observar quanto sobra de verdade.
      </p>
      <div class="acoes"><button class="btn ouro" type="button" disabled={salvando} onclick={concluir}>Bora!</button></div>
    {/if}
  </div>
</div>

<style>
  .po { height: 100%; display: flex; flex-direction: column; background: var(--surface); padding-top: var(--topo); }
  .po-topo { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px 0; }
  .voltar { width: 40px; height: 36px; font-size: 26px; font-weight: 700; color: var(--muted); text-align: left; }
  .espaco { width: 40px; }
  .pontos { display: flex; gap: 6px; }
  .pontos span { width: 22px; height: 5px; border-radius: 9px; background: var(--line); }
  .pontos span.on { background: var(--gold-fill); }
  .po-corpo { flex: 1; min-height: 0; overflow-y: auto; padding: 16px 20px calc(24px + var(--base)); display: flex; flex-direction: column; gap: 14px; }
  h1 { font-family: var(--f-display); font-weight: 800; font-size: 28px; letter-spacing: -.02em; line-height: 1.1; }
  .centro { display: grid; justify-items: center; gap: 6px; text-align: center; margin-top: 8px; }
  .centro-t { text-align: center; }
  .lema { color: var(--muted); font-size: 16px; }
  .fala-oi { background: var(--surface-2); border-radius: 16px; padding: 12px 14px; margin-top: 8px; max-width: 340px; }
  .acoes { margin-top: auto; display: grid; gap: 10px; padding-top: 12px; }
  .grande-in { height: 54px; font-size: 20px; }
  .grande-campo :global(.entrada) { height: 60px; font-size: 26px; }
  .grande-campo :global(.dinheiro) { width: 100%; }
  .grande-campo :global(.rs) { font-size: 22px; }
  .chips-po { display: flex; flex-wrap: wrap; gap: 8px; }
  .chip-po { height: 36px; padding: 0 12px; border-radius: 999px; background: var(--surface-2); border: 1px solid transparent; font-weight: 600; font-size: 14px; }
  .chip-po.on { border-color: var(--gold-fill); background: var(--gold-soft); }
  .dir { display: flex; align-items: center; gap: 4px; }
  .x { width: 32px; height: 32px; color: var(--muted); font-size: 20px; }
  .novo { display: grid; grid-template-columns: 1fr auto; gap: 8px; }
  .curto { width: 56px; }
  .parcela { display: grid; gap: 8px; padding: 12px; border-radius: 16px; background: var(--surface-2); }
  .parcela .entrada { background: var(--surface); }
  .duas { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .duas :global(.dinheiro) { width: 100%; }
  .codigo { font-size: 22px; font-weight: 800; letter-spacing: .05em; text-align: center; background: var(--gold-soft); border-radius: 16px; padding: 18px 10px; word-break: break-all; user-select: all; -webkit-user-select: all; }
  .check { display: flex; align-items: center; gap: 10px; font-weight: 600; }
  .check input { width: 22px; height: 22px; accent-color: var(--gold-fill); }
  .valor-final { font-size: 52px; font-weight: 800; color: var(--gold); letter-spacing: -.02em; line-height: 1; }
  .erro { color: var(--bad); }
  .achado { background: var(--gold-soft); border-radius: 16px; padding: 12px; display: grid; gap: 10px; }
</style>
