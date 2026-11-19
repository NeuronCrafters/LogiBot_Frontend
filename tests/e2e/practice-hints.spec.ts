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

async function answerAllTrue(page: Page) {
  const byRow = page.getByRole('button', { name: 'Por linha' });
  if (await byRow.getAttribute('aria-pressed') !== 'true') await byRow.click();
  for (let row = 1; row <= 4; row++) await page.getByRole('group', { name: `Linha ${row}, coluna p → q` }).getByRole('button', { name: 'V' }).click();
  await page.getByRole('button', { name: 'Verificar' }).click();
}

test('o aluno pede até 3 dicas depois de errar a tabela-verdade', async ({ page }) => {
  await mockApi(page, 'student');
  await page.route('**/api/exercises/attempts', async route => {
    const body = route.request().postDataJSON();
    await route.fulfill({ status: 201, json: { attemptId: '30000000-0000-4000-8000-000000000001', attemptNumber: 1, exerciseId: `truth_table:${body.formula}`, formula: body.formula, concepts: ['conditional'], engineVersion: '1.0.0', ...gradeTruthTable(body.formula, body.cells) } });
  });
  const texts = [
    'Revise o condicional: em que única situação ele é falso?',
    'Confira a coluna p → q na linha 2: aplique a regra de condicional aos valores dessa linha.',
    'Faça um exemplo menor com outras proposições e siga o mesmo caminho.',
  ];
  const asked: string[] = [];
  await page.route('**/api/exercises/hints**', route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { hints: [], remaining: 3 } });
    asked.push(route.request().postDataJSON().attemptId);
    const level = asked.length;
    return route.fulfill({ status: 201, json: { level, text: texts[level - 1], remaining: 3 - level, usedMaterial: level === 2, materials: level === 2 ? ['Apostila da turma'] : [], concepts: ['conditional'] } });
  });

  await page.goto('/practice/truth-table');
  await answerAllTrue(page);
  const hints = page.getByRole('region', { name: 'Dicas' });
  await expect(hints).toBeVisible();
  const ask = hints.getByRole('button', { name: /^Pedir dica/ });
  expect((await ask.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await ask.click();
  await expect(hints).toContainText(texts[0]);
  await hints.getByRole('button', { name: 'Pedir dica (2 restantes)' }).click();
  await expect(hints).toContainText('Com base no material da turma: Apostila da turma');
  await audit(page, 'bancada com dicas');
  await hints.getByRole('button', { name: 'Pedir dica (1 restantes)' }).click();
  await expect(hints).toContainText(texts[2]);
  await expect(hints).toContainText('Você já usou as 3 dicas deste exercício.');
  await expect(hints.getByRole('button')).toHaveCount(0);
  expect(asked).toEqual(Array(3).fill('30000000-0000-4000-8000-000000000001'));
});

test('sem liberação, a bancada não mostra dicas', async ({ page }) => {
  await mockApi(page, 'student');
  await page.route('**/api/features/me', route => route.fulfill({ json: { features: { practice_hints: false } } }));
  await page.route('**/api/exercises/attempts', async route => {
    const body = route.request().postDataJSON();
    await route.fulfill({ status: 201, json: { attemptId: 'a', attemptNumber: 1, exerciseId: 'x', formula: body.formula, concepts: [], engineVersion: '1.0.0', ...gradeTruthTable(body.formula, body.cells) } });
  });
  await page.goto('/practice/truth-table');
  await answerAllTrue(page);
  await expect(page.getByRole('status')).toContainText('células');
  await expect(page.getByRole('region', { name: 'Dicas' })).toHaveCount(0);
});
