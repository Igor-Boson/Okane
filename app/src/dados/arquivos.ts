import { centavosParaTexto } from '../dominio/dinheiro';
import { hojeISO } from '../dominio/datas';
import { validarSnapshot, type Snapshot } from './db';
import { estado } from './estado.svelte';

/** Entrega um arquivo pro usuário: no iPhone abre o Compartilhar (Salvar em Arquivos); senão baixa. */
async function entregar(nome: string, conteudo: string, tipo: string): Promise<'compartilhado' | 'baixado' | 'cancelado'> {
  const arquivo = new File([conteudo], nome, { type: tipo });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [arquivo] })) {
    try {
      await nav.share({ files: [arquivo], title: nome });
      return 'compartilhado';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelado';
    }
  }
  const url = URL.createObjectURL(arquivo);
  const a = document.createElement('a');
  a.href = url; a.download = nome;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return 'baixado';
}

/** Backup manual em arquivo (JSON legível). */
export async function exportarArquivo() {
  const snap = await estado.snapshot();
  const r = await entregar(`okane-backup-${hojeISO()}.json`, JSON.stringify(snap), 'application/json');
  if (r !== 'cancelado') await estado.ajustar({ ultimoArquivoEm: Date.now() }, true);
  return r;
}

/** Gastos em CSV pra abrir em planilha (separador ; e vírgula decimal, como o Excel brasileiro gosta). */
export async function exportarCSV() {
  const linhas = [['data', 'descrição', 'categoria', 'valor', 'valeu a pena'].join(';')];
  const esc = (s: string) => (/[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  for (const g of [...estado.gastos].sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : a.criadoEm - b.criadoEm))) {
    const c = estado.categoria(g.categoriaId);
    linhas.push([g.data, esc(g.descricao), esc(c.nome), centavosParaTexto(g.valor), g.valeu === null ? '' : g.valeu ? 'sim' : 'não'].join(';'));
  }
  return entregar(`okane-gastos-${hojeISO()}.csv`, '﻿' + linhas.join('\n'), 'text/csv');
}

export async function lerArquivoDeBackup(arquivo: File): Promise<Snapshot> {
  let dados: unknown;
  try {
    dados = JSON.parse(await arquivo.text());
  } catch {
    throw new Error('Esse arquivo não é um backup do Okane.');
  }
  if (!validarSnapshot(dados)) throw new Error('Esse arquivo não é um backup do Okane.');
  return dados;
}
