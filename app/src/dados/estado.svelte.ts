import { CATEGORIAS_PADRAO } from '../dominio/categorias';
import { hojeISO, mesDe } from '../dominio/datas';
import { calcularSemana, contaDoMes, planoDoMes } from '../dominio/orcamento';
import { diasJuntos, fomeDoPet, humorDoStatus, nivelDe, sequencia } from '../dominio/pet';
import type {
  Atalho, Categoria, Dados, DataISO, Desejo, DiaSemGasto, EntradaExtra, FechamentoSemana, Gasto, MesFechado, MesISO, Parcela, PlanoMes,
} from '../dominio/tipos';
import { gerarCodigo } from './cripto';
import { gerarExemplo } from './exemplo';
import { AJUSTES_PADRAO, OkaneDB, exportarTudo, gravarAjustes, importarTudo, lerAjustes, type Ajustes, type Snapshot } from './db';

export const novoId = () => crypto.randomUUID();

/**
 * Estado do app: tudo carregado em memória (são poucos milhares de linhas por ano)
 * e espelhado no IndexedDB a cada mudança. Os números vêm do motor de regras (R4).
 */
class Estado {
  db = new OkaneDB();
  carregado = $state(false);
  erroCarga = $state<string | null>(null);

  gastos = $state.raw<Gasto[]>([]);
  diasSemGasto = $state.raw<DiaSemGasto[]>([]);
  categorias = $state.raw<Categoria[]>([]);
  atalhos = $state.raw<Atalho[]>([]);
  planos = $state.raw<PlanoMes[]>([]);
  parcelas = $state.raw<Parcela[]>([]);
  extras = $state.raw<EntradaExtra[]>([]);
  fechamentos = $state.raw<FechamentoSemana[]>([]);
  meses = $state.raw<MesFechado[]>([]);
  desejos = $state.raw<Desejo[]>([]);
  ajustes = $state.raw<Ajustes>(AJUSTES_PADRAO);

  /** Hoje (atualizado quando o app volta pro primeiro plano ou vira o dia). */
  hoje = $state(hojeISO());

  /** Chamado depois de qualquer mudança (o backup se pendura aqui). */
  aoMudar: (() => void) | null = null;

  dados: Dados = $derived({
    gastos: this.gastos, diasSemGasto: this.diasSemGasto, planos: this.planos, parcelas: this.parcelas,
    extras: this.extras, fechamentos: this.fechamentos, inicio: this.ajustes.inicio ?? this.hoje,
  });
  mes: MesISO = $derived(mesDe(this.hoje));
  semana = $derived(calcularSemana(this.dados, this.hoje));
  contaMes = $derived(contaDoMes(this.dados, this.mes));
  planoAtual = $derived(planoDoMes(this.dados, this.mes));
  fome = $derived(fomeDoPet(this.dados, this.hoje));
  humor = $derived(humorDoStatus(this.semana.status));
  seq = $derived(sequencia(this.dados, this.hoje));
  juntos = $derived(diasJuntos(this.dados, this.hoje));
  nivel = $derived(nivelDe(this.juntos));
  categoriasAtivas = $derived([...this.categorias].filter(c => !c.arquivada).sort((a, b) => a.ordem - b.ordem));
  categoriaPorId = $derived(new Map(this.categorias.map(c => [c.id, c])));

  async carregar() {
    try {
      const d = this.db;
      const [gastos, dias, cats, atalhos, planos, parcelas, extras, fech, meses, desejos, ajustes] = await Promise.all([
        d.gastos.toArray(), d.diasSemGasto.toArray(), d.categorias.toArray(), d.atalhos.toArray(), d.planos.toArray(),
        d.parcelas.toArray(), d.extras.toArray(), d.fechamentos.toArray(), d.meses.toArray(), d.desejos.toArray(), lerAjustes(d),
      ]);
      this.gastos = gastos.sort(porCriacao);
      this.diasSemGasto = dias;
      this.categorias = cats;
      this.atalhos = atalhos;
      this.planos = planos;
      this.parcelas = parcelas;
      this.extras = extras;
      this.fechamentos = fech;
      this.meses = meses;
      this.desejos = desejos;
      this.ajustes = ajustes;
      this.hoje = hojeISO();
      this.carregado = true;
      try { await navigator.storage?.persist?.(); } catch { /* o iOS pode negar; o backup cobre */ }
    } catch (e) {
      this.erroCarga = e instanceof Error ? e.message : String(e);
    }
  }

  atualizarHoje() {
    const h = hojeISO();
    if (h !== this.hoje) this.hoje = h;
  }

  private mudou() { this.aoMudar?.(); }

  categoria(id: string): Categoria {
    return this.categoriaPorId.get(id) ?? { id, nome: 'Sem categoria', emoji: '❔', essencial: false, ordem: 99, arquivada: true };
  }

  // ------------------------------------------------------------ gastos

  async adicionarGasto(g: Omit<Gasto, 'id' | 'criadoEm' | 'valeu'> & Partial<Pick<Gasto, 'valeu'>>): Promise<Gasto> {
    const novo: Gasto = { valeu: null, ...g, id: novoId(), criadoEm: Date.now() };
    await this.db.gastos.put(novo);
    this.gastos = [...this.gastos, novo];
    this.mudou();
    return novo;
  }

  async alterarGasto(id: string, patch: Partial<Gasto>) {
    const atual = this.gastos.find(g => g.id === id);
    if (!atual) return;
    const novo = { ...atual, ...patch, id, alteradoEm: Date.now() };
    await this.db.gastos.put(novo);
    this.gastos = this.gastos.map(g => (g.id === id ? novo : g));
    this.mudou();
  }

  async apagarGasto(id: string): Promise<Gasto | undefined> {
    const atual = this.gastos.find(g => g.id === id);
    await this.db.gastos.delete(id);
    this.gastos = this.gastos.filter(g => g.id !== id);
    this.mudou();
    return atual;
  }

  async restaurarGasto(g: Gasto) {
    await this.db.gastos.put(g);
    this.gastos = [...this.gastos, g].sort(porCriacao);
    this.mudou();
  }

  async marcarDiaSemGasto(data: DataISO) {
    const d: DiaSemGasto = { data, criadoEm: Date.now() };
    await this.db.diasSemGasto.put(d);
    this.diasSemGasto = [...this.diasSemGasto.filter(x => x.data !== data), d];
    this.mudou();
  }

  async desmarcarDiaSemGasto(data: DataISO) {
    await this.db.diasSemGasto.delete(data);
    this.diasSemGasto = this.diasSemGasto.filter(x => x.data !== data);
    this.mudou();
  }

  // ------------------------------------------------------------ plano

  /** Plano do mês pra editar: se o mês herda de outro, cria uma cópia própria. */
  planoEditavel(mes: MesISO): PlanoMes {
    const proprio = this.planos.find(p => p.mes === mes);
    if (proprio) return proprio;
    const base = planoDoMes(this.dados, mes);
    return { mes, salario: base?.salario ?? 0, metaGuardar: base?.metaGuardar ?? 0, fixos: (base?.fixos ?? []).map(f => ({ ...f })) };
  }

  async salvarPlano(p: PlanoMes) {
    const limpo: PlanoMes = { mes: p.mes, salario: p.salario, metaGuardar: p.metaGuardar, fixos: p.fixos.map(f => ({ id: f.id, nome: f.nome, valor: f.valor, ...(f.cada && f.cada > 1 ? { cada: f.cada } : {}) })) };
    await this.db.planos.put(limpo);
    this.planos = [...this.planos.filter(x => x.mes !== p.mes), limpo];
    this.mudou();
  }

  async salvarParcela(p: Parcela) {
    await this.db.parcelas.put({ ...p });
    this.parcelas = [...this.parcelas.filter(x => x.id !== p.id), { ...p }];
    this.mudou();
  }

  async apagarParcela(id: string) {
    await this.db.parcelas.delete(id);
    this.parcelas = this.parcelas.filter(x => x.id !== id);
    this.mudou();
  }

  async salvarExtra(e: EntradaExtra) {
    await this.db.extras.put({ ...e });
    this.extras = [...this.extras.filter(x => x.id !== e.id), { ...e }];
    this.mudou();
  }

  async apagarExtra(id: string) {
    await this.db.extras.delete(id);
    this.extras = this.extras.filter(x => x.id !== id);
    this.mudou();
  }

  // ------------------------------------------------------------ fechamentos

  async fecharSemana(f: FechamentoSemana) {
    await this.db.fechamentos.put(f);
    this.fechamentos = [...this.fechamentos.filter(x => x.semana !== f.semana), f];
    this.mudou();
  }

  async fecharMes(m: MesFechado) {
    await this.db.meses.put(m);
    this.meses = [...this.meses.filter(x => x.mes !== m.mes), m];
    this.mudou();
  }

  // ------------------------------------------------------------ categorias e atalhos

  async salvarCategorias(cats: Categoria[]) {
    await this.db.transaction('rw', this.db.categorias, async () => {
      await this.db.categorias.clear();
      await this.db.categorias.bulkPut(cats.map(c => ({ ...c })));
    });
    this.categorias = cats.map(c => ({ ...c }));
    this.mudou();
  }

  async salvarAtalho(a: Atalho) {
    await this.db.atalhos.put({ ...a });
    this.atalhos = [...this.atalhos.filter(x => x.id !== a.id), { ...a }];
    this.mudou();
  }

  async apagarAtalho(id: string) {
    await this.db.atalhos.delete(id);
    this.atalhos = this.atalhos.filter(x => x.id !== id);
    this.mudou();
  }

  // ------------------------------------------------------------ desejos

  async salvarDesejo(d: Desejo) {
    await this.db.desejos.put({ ...d });
    this.desejos = [...this.desejos.filter(x => x.id !== d.id), { ...d }];
    this.mudou();
  }

  async apagarDesejo(id: string) {
    await this.db.desejos.delete(id);
    this.desejos = this.desejos.filter(x => x.id !== id);
    this.mudou();
  }

  // ------------------------------------------------------------ ajustes

  /** `silencioso`: não dispara backup (ex.: status do próprio backup). */
  async ajustar(patch: Partial<Ajustes>, silencioso = false) {
    const novo = { ...this.ajustes, ...patch };
    await gravarAjustes(this.db, novo);
    this.ajustes = novo;
    if (!silencioso) this.mudou();
  }

  // ------------------------------------------------------------ primeiro uso

  async concluirPrimeiroUso(p: {
    salario: number; fixos: { nome: string; valor: number }[]; parcelas: { nome: string; valor: number; faltam: number }[];
    categoriasDesligadas: string[]; nomePet: string; tom: Ajustes['tom']; codigo: string;
  }) {
    const hoje = hojeISO();
    const mes = mesDe(hoje);
    const cats = CATEGORIAS_PADRAO.map(c => ({ ...c, arquivada: p.categoriasDesligadas.includes(c.id) }));
    const plano: PlanoMes = { mes, salario: p.salario, metaGuardar: 0, fixos: p.fixos.map(f => ({ id: novoId(), nome: f.nome, valor: f.valor })) };
    const parcelas: Parcela[] = p.parcelas.filter(x => x.valor > 0 && x.faltam > 0).map(x => ({ id: novoId(), nome: x.nome || 'Parcela', valor: x.valor, primeiroMes: mes, total: x.faltam }));
    await this.db.transaction('rw', [this.db.categorias, this.db.planos, this.db.parcelas, this.db.ajustes], async () => {
      await this.db.categorias.bulkPut(cats);
      await this.db.planos.put(plano);
      if (parcelas.length) await this.db.parcelas.bulkPut(parcelas);
    });
    this.categorias = cats;
    this.planos = [plano];
    this.parcelas = parcelas;
    await this.ajustar({ inicio: hoje, nomePet: p.nomePet.trim() || 'Moedinha', tom: p.tom, codigo: p.codigo, ultimoCheckOntem: hoje });
  }

  // ------------------------------------------------------------ prévia

  /** Só na prévia: começa com ~18 dias de dados de exemplo. */
  async carregarExemplo() {
    const ex = gerarExemplo(hojeISO(), novoId);
    await this.db.transaction('rw', [this.db.categorias, this.db.planos, this.db.parcelas, this.db.gastos, this.db.desejos], async () => {
      await this.db.categorias.bulkPut(ex.categorias);
      await this.db.planos.bulkPut(ex.planos);
      await this.db.parcelas.bulkPut(ex.parcelas);
      await this.db.gastos.bulkPut(ex.gastos);
      await this.db.desejos.bulkPut(ex.desejos);
    });
    await gravarAjustes(this.db, { ...AJUSTES_PADRAO, inicio: ex.inicio, codigo: gerarCodigo(), nomePet: 'Moedinha', ultimoCheckOntem: hojeISO() });
    this.carregado = false;
    await this.carregar();
  }

  // ------------------------------------------------------------ backup e importação

  snapshot(): Promise<Snapshot> {
    return exportarTudo(this.db);
  }

  async importar(s: Snapshot) {
    // garante objetos simples (o IndexedDB não grava proxies reativos)
    await importarTudo(this.db, $state.snapshot(s) as Snapshot);
    this.carregado = false;
    await this.carregar();
  }

  async apagarTudo() {
    await this.db.delete();
    this.db = new OkaneDB();
    await this.db.open();
    this.carregado = false;
    await this.carregar();
  }
}

const porCriacao = (a: Gasto, b: Gasto) => a.criadoEm - b.criadoEm;

export const estado = new Estado();
