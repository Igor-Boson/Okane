import { expect, test, type Page } from '@playwright/test';

const FOTOS = process.env.FOTOS_DIR;
const foto = async (page: Page, nome: string) => { if (FOTOS) await page.screenshot({ path: `${FOTOS}/${nome}.png` }); };

async function digitar(page: Page, teclas: string) {
  for (const t of teclas) await page.getByRole('button', { name: t === ',' ? 'Vírgula' : t, exact: true }).click();
}

async function preencherDinheiro(page: Page, rotulo: string, valor: string) {
  const campo = page.getByLabel(rotulo, { exact: true });
  await campo.fill(valor);
  await campo.blur();
}

test('do primeiro uso ao fechamento do mês', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-25T10:00:00-03:00'));

  await test.step('iPhone no Safari pede pra instalar primeiro (O0)', async () => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Instale o Okane' })).toBeVisible();
    await foto(page, '00-instalar');
    await page.getByRole('button', { name: 'Usar no navegador mesmo assim' }).click();
    await page.getByRole('button', { name: 'Entendi, continuar no navegador' }).click();
  });

  await test.step('primeiro uso (O1)', async () => {
    await page.getByRole('button', { name: 'Começar' }).click();
    await preencherDinheiro(page, 'Salário', '5000');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Aluguel', exact: true }).click();
    await preencherDinheiro(page, 'Aluguel', '1500');
    await foto(page, '01-fixos');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: '+ Adicionar parcela' }).click();
    await page.getByLabel('Nome da parcela').fill('Notebook');
    await preencherDinheiro(page, 'Valor da parcela', '200');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Continuar' }).click(); // categorias
    await page.getByLabel('Nome da moedinha').fill('Dobrão');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByTestId('codigo')).toHaveText(/^[0-9A-Z]{5}-[0-9A-Z]{5}-[0-9A-Z]{5}-[0-9A-Z]{5}$/);
    await page.getByRole('button', { name: /Guardo depois/ }).click();
    // começou dia 25: novembro proporcional (6 de 30 dias)
    await expect(page.getByText('por semana pra gastar.')).toBeVisible();
    await foto(page, '02-pronto');
    await page.getByRole('button', { name: 'Bora!' }).click();
  });

  await test.step('número da semana', async () => {
    // livre = (5000 − 1500 − 200) × 6/30 = 660; semana 25–29 (5 de 6 dias restantes) = 550
    await expect(page.getByTestId('pode')).toHaveText('R$ 550');
    await foto(page, '03-inicio');
  });

  await test.step('registrar em valor + 1 toque, com sugestão pela descrição (F1/F2)', async () => {
    await digitar(page, '20');
    await expect(page.getByTestId('valor')).toContainText('R$ 20');
    await page.getByLabel('Descrição').fill('sorvete');
    const sugerida = page.locator('.chip.sug');
    await expect(sugerida).toContainText('Besteirinha');
    await sugerida.click();
    await expect(page.getByText('Sobram R$ 530 na semana')).toBeVisible();
    await foto(page, '04-reflexao');
    await page.getByRole('button', { name: 'Valeu a pena', exact: true }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('pode')).toHaveText('R$ 530');
  });

  await test.step('texto livre "uber 12,50" sem usar o teclado', async () => {
    await page.getByLabel('Descrição').fill('uber 12,50');
    await expect(page.getByTestId('valor')).toContainText('R$ 12,50');
    await expect(page.locator('.chip.sug')).toContainText('Transporte');
    await page.locator('.chip.sug').click();
    await expect(page.getByText(/Sobram R\$ 518/)).toBeVisible();
    await page.keyboard.press('Escape');
  });

  await test.step('3 cafés iguais viram atalho de 1 toque', async () => {
    for (let i = 0; i < 3; i++) {
      await digitar(page, '8');
      await page.getByLabel('Descrição').fill('Café');
      await page.locator('.chip.sug').click();
      await page.keyboard.press('Escape');
    }
    const atalho = page.getByRole('button', { name: /Café R\$ 8/ });
    await expect(atalho).toBeVisible();
    await atalho.click();
    await page.keyboard.press('Escape');
    // 550 − 20 − 12,50 − 4 × 8 = 485,50
    await expect(page.getByTestId('pode')).toHaveText('R$ 486');
  });

  await test.step('gasto grande destaca a porcentagem', async () => {
    await digitar(page, '180');
    await page.getByLabel('Descrição').fill('tênis');
    await page.locator('.chip.sug').click();
    await expect(page.getByText(/Isso é \d+% da tua semana/)).toBeVisible();
    await page.getByRole('button', { name: 'desfazer' }).click();
    await expect(page.getByTestId('pode')).toHaveText('R$ 486');
  });

  await test.step('Gastos: lista e edição', async () => {
    await page.getByRole('button', { name: 'Gastos' }).click();
    await expect(page.getByRole('heading', { name: 'Gastos' })).toBeVisible();
    await foto(page, '05-gastos');
    await page.getByRole('button', { name: /sorvete/ }).click();
    await page.locator('#ed-valor').fill('25');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText('Gasto atualizado')).toBeVisible();
  });

  await test.step('Plano', async () => {
    await page.getByRole('button', { name: 'Plano' }).click();
    await expect(page.getByRole('heading', { name: 'Plano de novembro' })).toBeVisible();
    await expect(page.getByText('Notebook')).toBeVisible();
    await foto(page, '06-plano');
  });

  await test.step('Ajustes: tom sem filtro', async () => {
    await page.getByRole('button', { name: 'Ajustes' }).click();
    await page.getByRole('button', { name: '🌶️ Sem filtro' }).click();
    await foto(page, '07-ajustes');
    await page.getByRole('button', { name: '‹ Voltar' }).click();
  });

  await test.step('os dados continuam depois de recarregar', async () => {
    await page.reload();
    await page.getByRole('button', { name: 'Início' }).click();
    // sorvete foi de 20 pra 25: 480,50
    await expect(page.getByTestId('pode')).toHaveText('R$ 481');
  });

  await test.step('virada do mês e da semana (R2, R3) e check de ontem (F3)', async () => {
    await page.clock.setFixedTime(new Date('2026-12-01T09:00:00-03:00'));
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Novembro fechado' })).toBeVisible();
    await foto(page, '08-mes');
    await page.getByRole('button', { name: 'Sim, tudo igual' }).click();
    await expect(page.getByRole('heading', { name: /Semana 23–29 nov fechada/ })).toBeVisible();
    await foto(page, '09-semana');
    await page.getByRole('button', { name: /Guardar R\$/ }).click();
    await page.getByRole('button', { name: 'Fechar' }).click();
    await expect(page.getByText(/Foi dia de monge|Foi dia sem gastos/)).toBeVisible();
    await page.getByRole('button', { name: /Sim, zero gasto/ }).click();
    await expect(page.getByText('Dia sem gastos registrado ✨')).toBeVisible();
    await foto(page, '10-dezembro');
  });
});
