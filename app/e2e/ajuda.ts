import { expect, type BrowserContext, type Page } from '@playwright/test';
import { tratarBackup, type KVMinimo } from '../server/backup';

export async function digitar(page: Page, teclas: string) {
  for (const t of teclas) await page.getByRole('button', { name: t === ',' ? 'Vírgula' : t, exact: true }).click();
}

export async function preencherDinheiro(page: Page, rotulo: string, valor: string) {
  const campo = page.getByLabel(rotulo, { exact: true });
  await campo.fill(valor);
  await campo.blur();
}

/** No iPhone (Safari), pula a tela de instalação. */
export async function pularInstalacao(page: Page) {
  await expect(page.getByRole('heading', { name: 'Instale o Okane' })).toBeVisible();
  await page.getByRole('button', { name: 'Usar no navegador mesmo assim' }).click();
  await page.getByRole('button', { name: 'Entendi, continuar no navegador' }).click();
}

/** Primeiro uso mínimo: salário 5.000, aluguel 1.500. */
export async function primeiroUsoRapido(page: Page) {
  await page.goto('/');
  await pularInstalacao(page);
  await page.getByRole('button', { name: 'Começar' }).click();
  await preencherDinheiro(page, 'Salário', '5000');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Aluguel', exact: true }).click();
  await preencherDinheiro(page, 'Aluguel', '1500');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Não tenho' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: /Guardo depois/ }).click();
  await page.getByRole('button', { name: 'Bora!' }).click();
  await expect(page.getByTestId('pode')).toBeVisible();
}

export class KVFalso implements KVMinimo {
  dados = new Map<string, ArrayBuffer>();
  async get(chave: string) { return this.dados.get(chave) ?? null; }
  async put(chave: string, valor: ArrayBuffer) { this.dados.set(chave, valor); }
  async list({ prefix }: { prefix: string }) { return { keys: [...this.dados.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })) }; }
}

/** Serve /api com o código real do servidor (server/backup.ts) sobre um KV em memória. */
export async function servidorFalso(contexto: BrowserContext, kv: KVFalso) {
  await contexto.route('**/api/**', async rota => {
    const req = rota.request();
    const url = new URL(req.url());
    if (url.pathname === '/api/saude') return rota.fulfill({ json: { ok: true, backup: true } });
    const partes = url.pathname.replace(/^\/api\/backup\/?/, '').split('/').filter(Boolean);
    const corpo = req.postDataBuffer();
    const r = await tratarBackup(new Request(url, { method: req.method(), body: corpo ? new Uint8Array(corpo) : undefined }), kv, partes);
    await rota.fulfill({ status: r.status, headers: Object.fromEntries(r.headers), body: Buffer.from(await r.arrayBuffer()) });
  });
}
