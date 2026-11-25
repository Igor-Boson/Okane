import { expect, test } from '@playwright/test';
import { digitar, primeiroUsoRapido } from './ajuda';

test('conferir com o extrato acha o que faltou registrar', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-25T10:00:00-03:00'));
  await primeiroUsoRapido(page); // começa dia 25, aluguel de 1.500 no plano
  await digitar(page, '20');
  await page.getByLabel('Descrição').fill('sorvete');
  await page.locator('.chip.sug').click();
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Gastos' }).click();
  await page.getByRole('button', { name: /Conferir com o extrato do banco/ }).click();
  const csv = [
    'Data,Valor,Identificador,Descrição',
    '24/11/2026,-300.00,a0,Antes do início',
    '25/11/2026,-20.00,a1,Compra no débito - SORVETERIA GELATO LTDA',
    '25/11/2026,-12.50,a2,Pix enviado - Uber do Brasil',
    '25/11/2026,-1500.00,a3,Pix enviado - Imobiliária',
    '25/11/2026,2000.00,a4,Transferência recebida',
  ].join('\n');
  await page.locator('input[type=file]').setInputFiles({ name: 'nubank.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });

  await expect(page.getByText('50%')).toBeVisible();
  await expect(page.getByText('Uber do Brasil')).toBeVisible();
  await expect(page.getByText(/Parecem fixos ou parcelas do plano \(1\)/)).toBeVisible();
  // categoria sugerida pela descrição limpa
  await expect(page.getByRole('combobox', { name: 'Categoria' })).toHaveValue('transporte');
  await page.getByRole('button', { name: 'Registrar', exact: true }).click();
  await expect(page.getByText('100%')).toBeVisible();
  await expect(page.getByText(/meta batida/)).toBeVisible();
  await page.getByRole('button', { name: '‹ Voltar' }).click();
  await expect(page.getByRole('button', { name: /Uber do Brasil/ })).toBeVisible();
});
