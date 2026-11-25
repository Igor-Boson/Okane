import { expect, test } from '@playwright/test';
import { KVFalso, digitar, primeiroUsoRapido, pularInstalacao, servidorFalso } from './ajuda';

test('backup cifrado: celular novo volta com tudo pelo código', async ({ browser }) => {
  const kv = new KVFalso();
  const quando = new Date('2026-11-25T10:00:00-03:00');

  // celular 1
  const ctx1 = await browser.newContext({ ...test.info().project.use });
  await servidorFalso(ctx1, kv);
  const p1 = await ctx1.newPage();
  await p1.clock.setFixedTime(quando);
  await primeiroUsoRapido(p1);
  await digitar(p1, '42');
  await p1.getByLabel('Descrição').fill('pizza');
  await p1.locator('.chip.sug').click();
  await p1.keyboard.press('Escape');
  // livre = (5.000 − 1.500) × 6/30 = 700; semana (5 de 6 dias) = 583; − 42 = 541
  const pode = 'R$ 541';
  await expect(p1.getByTestId('pode')).toHaveText(pode);

  await p1.getByRole('button', { name: 'Ajustes' }).click();
  await expect(p1.getByText('Ligada')).toBeVisible();
  await p1.getByRole('button', { name: 'Fazer backup agora' }).click();
  await expect(p1.getByText('Backup feito ☁️')).toBeVisible();
  await p1.getByRole('button', { name: 'Mostrar' }).click();
  const codigo = (await p1.locator('.codigo-v').textContent())!.trim();
  expect(codigo).toMatch(/^[0-9A-Z]{5}(-[0-9A-Z]{5}){3}$/);

  // o servidor só tem bytes cifrados: nada de "pizza" lá dentro
  const guardado = [...kv.dados.values()].map(b => Buffer.from(b).toString('latin1')).join('');
  expect(guardado.length).toBeGreaterThan(0);
  expect(guardado).not.toContain('pizza');
  await ctx1.close();

  // celular 2 (sem nada)
  const ctx2 = await browser.newContext({ ...test.info().project.use });
  await servidorFalso(ctx2, kv);
  const p2 = await ctx2.newPage();
  await p2.clock.setFixedTime(quando);
  await p2.goto('/');
  await pularInstalacao(p2);
  await p2.getByRole('button', { name: 'Já uso o Okane' }).click();
  await p2.getByLabel('Código de recuperação').fill(codigo.toLowerCase().replace(/-/g, ' '));
  await p2.getByRole('button', { name: 'Buscar backup' }).click();
  await expect(p2.getByText(/com 1 gastos/)).toBeVisible();
  await p2.getByRole('button', { name: 'Restaurar tudo' }).click();
  await expect(p2.getByTestId('pode')).toHaveText(pode);
  await p2.getByRole('button', { name: 'Gastos' }).click();
  await expect(p2.getByRole('button', { name: /pizza/ })).toBeVisible();

  // código errado não abre
  await p2.getByRole('button', { name: 'Ajustes' }).click();
  await p2.getByText('Restaurar de outro backup').click();
  await p2.getByLabel('Código de recuperação').fill('ZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ');
  await p2.getByRole('button', { name: 'Buscar pelo código' }).click();
  await expect(p2.getByText('Não achei backup com esse código.')).toBeVisible();
  await ctx2.close();
});
