import { expect, test, type Page } from '@playwright/test';
import { digitar, primeiroUsoRapido } from './ajuda';

/** Nenhum "R$ <número>" na tela (o "R$ •••" pode). O valor sendo digitado no teclado fica de fora. */
async function semValores(page: Page) {
  const valorDigitado = page.getByTestId('valor');
  const digitado = (await valorDigitado.count()) ? await valorDigitado.innerText() : '';
  const texto = (await page.locator('.casca').innerText()).replace(digitado, '');
  // o único "R$ 0" que sobra é texto de ajuda fixo do Plano, não um valor seu
  expect(texto.replace('deixe em R$ 0 e só observe', '')).not.toMatch(/R\$ ?[−-]?\d/);
}

test('modo discreto troca todos os valores por R$ ••• e volta ao desligar', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-25T10:00:00-03:00'));
  await primeiroUsoRapido(page);

  await digitar(page, '20');
  await page.getByLabel('Descrição').fill('sorvete');
  await page.locator('.chip.sug').click();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('pode')).toHaveText('R$ 563');

  await page.getByRole('button', { name: 'Ajustes' }).click();
  const interruptor = page.getByRole('switch', { name: 'Esconder valores' });
  await expect(interruptor).toHaveAttribute('aria-checked', 'false');
  await interruptor.click();
  await expect(interruptor).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: '‹ Voltar' }).click();

  await expect(page.getByTestId('pode')).toHaveText('R$ •••');
  await semValores(page);

  await page.getByRole('button', { name: 'Gastos' }).click();
  await expect(page.getByText('sorvete')).toBeVisible();
  await semValores(page);
  await page.getByText('sorvete').click();
  await expect(page.locator('#ed-valor')).toHaveValue('R$ •••');
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Plano' }).click();
  await expect(page.getByRole('button', { name: 'Salário: escondido' })).toBeVisible();
  await semValores(page);

  // continua escondido depois de fechar e abrir
  await page.reload();
  await expect(page.getByTestId('pode')).toHaveText('R$ •••');

  await page.getByRole('button', { name: 'Ajustes' }).click();
  await page.getByRole('switch', { name: 'Esconder valores' }).click();
  await page.getByRole('button', { name: '‹ Voltar' }).click();
  await expect(page.getByTestId('pode')).toHaveText('R$ 563');
});
