import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockApi } from './fixtures';
import { gradeTruthTable } from '../../src/shared/logic/logicCore';

test.use({ locale: 'pt-BR' });

async function audit(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })), label).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), `${label}: largura`).toBeTruthy();
}

test('tabela-verdade grande: só a coluna final, linhas em páginas, envio completo', async ({ page }) => {
  await mockApi(page, 'student');
  const bodies: any[] = [];
  await page.route('**/api/exercises/attempts', async route => {
    const body = route.request().postDataJSON();
    bodies.push(body);
    const grade = gradeTruthTable(body.formula, body.cells, body.columns);
    await route.fulfill({ status: 201, json: { attemptId: 'a1', attemptNumber: 1, exerciseId: `truth_table:${body.formula}#final`, formula: body.formula, columns: body.columns, concepts: ['disjunction'], engineVersion: '1.1.0', ...grade } });
  });
  await page.goto('/practice/truth-table');
  await page.getByLabel('Fórmula', { exact: true }).selectOption('custom');
  await page.getByLabel('Sua fórmula (até 10 proposições, letras minúsculas)').fill('p | q | r | s | t | u');
  await page.getByRole('checkbox', { name: /Preencher só a coluna final/ }).check();
  await page.getByRole('button', { name: 'Usar fórmula' }).click();
  await expect(page.getByText('Nesta tabela, preencha só a coluna final.')).toBeVisible();
  await expect(page.getByText('64 linhas × 1 colunas · 0 de 64 preenchidas')).toBeVisible();
  await expect(page.getByText('Linhas 1–16 de 64')).toBeVisible();
  await audit(page, 'tabela grande, primeira página');

  // Row-by-row view (both projects): a disjunction is false only in the last row (all false).
  const byRow = page.getByRole('button', { name: 'Por linha' });
  if (await byRow.getAttribute('aria-pressed') !== 'true') await byRow.click();
  const pagination = page.getByRole('navigation', { name: 'Páginas de linhas da tabela' });
  for (let pageIndex = 0; pageIndex < 4; pageIndex++) {
    for (let row = pageIndex * 16 + 1; row <= pageIndex * 16 + 16; row++) {
      await page.getByRole('group', { name: new RegExp(`^Linha ${row}, coluna `) }).getByRole('button', { name: row === 64 ? 'F' : 'V' }).click();
    }
    if (pageIndex < 3) await pagination.getByRole('button', { name: 'Próxima' }).click();
  }
  await expect(page.getByText('64 linhas × 1 colunas · 64 de 64 preenchidas')).toBeVisible();
  await audit(page, 'tabela grande, última página');
  await page.getByRole('button', { name: 'Verificar' }).click();
  await expect(page.getByRole('status')).toContainText('Correto! As 64 células estão certas.');
  expect(bodies[0].columns).toBe('final');
  expect(Object.keys(bodies[0].cells)).toHaveLength(64);
});
