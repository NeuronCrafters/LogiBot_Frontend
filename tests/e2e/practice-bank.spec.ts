import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockApi } from './fixtures';

test.use({ locale: 'pt-BR' });

const questions: Record<string, unknown[]> = {
  truth_table: [{ id: 'q-tt', type: 'truth_table', statement: 'Tabela do condicional da aula 3', language: 'pt-BR', concepts: [], content: { formula: 'p → q' } }],
  translation: [{ id: 'q-tr', type: 'translation', statement: 'Se estudo, então passo.', language: 'pt-BR', concepts: [], content: { legend: [{ letter: 'e', text: 'estudo' }, { letter: 'a', text: 'passo' }] } }],
  parsons: [{ id: 'q-pa', type: 'parsons', statement: 'Mostre o maior de dois números.', language: 'pt-BR', concepts: [], content: { lines: [{ id: 'lnb', text: 'escreva(a)' }, { id: 'lna', text: 'se a > b então' }] } }],
};

async function mockPractice(page: Page) {
  const bodies: any[] = [];
  await page.route('**/api/exercises/bank**', route => route.fulfill({ json: questions[new URL(route.request().url()).searchParams.get('type') ?? ''] ?? [] }));
  await page.route('**/api/exercises/attempts', async route => {
    const body = route.request().postDataJSON();
    bodies.push(body);
    const base = { attemptId: 'a', attemptNumber: bodies.length, engineVersion: '1', concepts: [], exerciseId: `bank:${body.bankQuestionId}` };
    if (body.type === 'translation') return route.fulfill({ status: 201, json: { ...base, correct: true, normalizedAnswer: 'e → a' } });
    return route.fulfill({ status: 201, json: { ...base, correct: false, total: 4, right: 0, empty: 0, wrong: [], errorsByConcept: {}, marks: {}, formula: 'p → q' } });
  });
  return bodies;
}

async function audit(page: Page, label: string) {
  await page.evaluate(() => Promise.allSettled(document.getAnimations()
    .filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity)
    .map(animation => animation.finished)));
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })), label).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), `${label}: largura`).toBeTruthy();
}

test('o aluno pratica as questões do professor nas três bancadas', async ({ page }) => {
  await mockApi(page, 'student');
  const bodies = await mockPractice(page);

  await page.goto('/practice/translation');
  const sentence = page.getByLabel('Frase', { exact: true });
  await expect(sentence.locator('optgroup[label="Da sua turma"] option')).toHaveCount(1);
  await sentence.selectOption('bank:q-tr');
  await expect(page.locator('blockquote')).toHaveText('Se estudo, então passo.');
  await page.getByLabel('Sua fórmula').fill('e -> a');
  await page.getByRole('button', { name: 'Verificar' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Tentativa' })).toBeVisible();
  expect(bodies[0]).toMatchObject({ type: 'translation', bankQuestionId: 'q-tr', answer: 'e -> a' });
  expect(bodies[0].exerciseId).toBeUndefined();
  await audit(page, 'tradução com questão do professor');

  await page.goto('/practice/truth-table');
  await page.getByLabel('Fórmula', { exact: true }).selectOption('bank:q-tt');
  await expect(page.getByText('Tabela do condicional da aula 3', { exact: true })).toBeVisible();
  await audit(page, 'tabela-verdade com questão do professor');

  await page.goto('/practice/parsons');
  await page.getByLabel('Exercício', { exact: true }).selectOption('bank:q-pa');
  await expect(page.getByRole('list', { name: 'Linhas disponíveis' }).getByRole('listitem')).toHaveCount(2);
  await audit(page, 'montagem com questão do professor');
});
