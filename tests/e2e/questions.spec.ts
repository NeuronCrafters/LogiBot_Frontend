import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ids, mockApi, selectLanguage } from './fixtures';
import { checkQuestion } from '../../src/shared/logic/questionCore';

test.use({ locale: 'pt-BR' });

/** In-memory question bank that validates like the API (same shared core). */
async function mockBank(page: Page) {
  const store: any[] = [{
    id: 'q-1', ownerId: 'test-user', disciplineId: ids.discipline, disciplineName: 'Lógica original', version: 1, sourceQuizQuestionId: null,
    createdAt: '2026-11-16T10:00:00Z', updatedAt: '2026-11-16T10:00:00Z', type: 'truth_table', statement: 'Monte a tabela de p → q.', weight: 1,
    subject: 'operadores_logicos', concepts: ['conditional'], language: 'pt-BR', content: { type: 'truth_table', formula: 'p → q' },
  }];
  let next = 2;
  await page.route('**/api/questions**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/^\/api/, '');
    const method = request.method();
    const save = (body: any, current?: any) => {
      const result = checkQuestion(body, (kind, index) => `${kind}-${index}`);
      if (!result.ok) return route.fulfill({ status: 400, json: { code: 'questions.invalid', message: 'invalid', issues: result.issues } });
      const saved = { ...(current ?? { id: `q-${next++}`, ownerId: 'test-user', sourceQuizQuestionId: null, createdAt: '2026-11-16T12:00:00Z', version: 0 }),
        ...result.question, disciplineId: body.disciplineId, disciplineName: 'Lógica original', updatedAt: '2026-11-16T12:00:00Z', practiceEnabled: body.practiceEnabled === true };
      saved.version += 1;
      if (current) store.splice(store.indexOf(current), 1, saved); else store.unshift(saved);
      return route.fulfill({ status: current ? 200 : 201, json: saved });
    };
    const match = /^\/questions\/([^/]+)(?:\/edit)?$/.exec(path);
    if (path === '/questions' && method === 'GET') return route.fulfill({ json: store });
    if (path === '/questions' && method === 'POST') return save(request.postDataJSON());
    if (match && method === 'GET') return route.fulfill({ json: store.find(item => item.id === match[1]) });
    if (match && method === 'PUT') return save(request.postDataJSON(), store.find(item => item.id === match[1]));
    if (match && method === 'DELETE') { store.splice(store.findIndex(item => item.id === match[1]), 1); return route.fulfill({ status: 204, body: '' }); }
    return route.fulfill({ json: { imported: 0, skipped: 0, invalid: 0 } });
  });
  return store;
}

async function audit(page: Page, label: string) {
  await expect(page.locator('.navigation-transition')).toHaveAttribute('data-route-phase', 'idle');
  // The page fades in on mount: measure contrast only after the entry animation.
  await page.getByRole('main').evaluate(node => Promise.all(node.getAnimations().map(animation => animation.finished)));
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })), label).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2 && document.documentElement.scrollHeight <= innerHeight + 1), `${label}: sem rolagem da janela`).toBeTruthy();
}

for (const language of ['pt-BR', 'en-US', 'es-ES']) {
  test(`banco de questões: lista e editor acessíveis em ${language}`, async ({ page }) => {
    await mockApi(page, 'professor');
    await mockBank(page);
    await page.goto('/questions');
    await selectLanguage(page, language);
    await expect(page.getByRole('article')).toHaveCount(1);
    await audit(page, `${language}: lista`);
    await page.goto('/questions/new');
    const typeSelect = page.locator('select:has(option[value="essay"])');
    for (const type of ['quiz', 'truth_table', 'translation', 'parsons', 'essay']) {
      await typeSelect.selectOption(type);
      await audit(page, `${language}: editor ${type}`);
    }
    await page.locator('form button[type=submit]').click();
    await expect(page.getByRole('alert').first()).toBeVisible();
    await audit(page, `${language}: editor com erros`);
  });
}

test('banco de questões: erros levam o foco ao primeiro campo, pelo teclado', async ({ page }) => {
  await mockApi(page, 'professor');
  await mockBank(page);
  await page.goto('/questions/new');
  await page.getByRole('button', { name: 'Salvar questão' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('alert').first()).toHaveText('Revise os campos marcados (4).');
  await expect(page.getByLabel('Enunciado')).toBeFocused();
  await expect(page.getByLabel('Enunciado')).toHaveAttribute('aria-invalid', 'true');
});

test('banco de questões: criar, editar com nova versão e remover', async ({ page }) => {
  await mockApi(page, 'professor');
  const store = await mockBank(page);
  await page.goto('/questions');
  await page.getByRole('link', { name: 'Nova questão' }).click();
  await page.getByLabel('Tipo de questão').selectOption('parsons');
  await page.getByLabel('Enunciado').fill('Escreva n se for positivo.');
  await page.getByLabel('Solução (uma linha de código por linha)').fill('leia(n)\nse n > 0 então\n  escreva(n)\nfimse');
  await page.getByLabel('Linhas distratoras (opcional)').fill('escreva(0)');
  await expect(page.getByText('Linha 3, recuo 1: escreva(n)')).toBeAttached();
  await page.getByRole('button', { name: 'Salvar questão' }).click();
  await expect(page).toHaveURL(/\/questions$/);
  const card = page.getByRole('article', { name: 'Escreva n se for positivo.' });
  await expect(card).toContainText('Montar algoritmo');
  expect(store[0].content.solutions[0]).toEqual([['line-0', 0], ['line-1', 0], ['line-2', 1], ['line-3', 0]]);

  await card.getByRole('link', { name: /^Editar questão/ }).click();
  await expect(page.getByLabel('Solução (uma linha de código por linha)')).toHaveValue('leia(n)\nse n > 0 então\n  escreva(n)\nfimse');
  await expect(page.getByLabel('Tipo de questão')).toBeDisabled();
  await page.getByLabel('Peso').fill('2.5');
  await page.getByRole('button', { name: 'Salvar questão' }).click();
  await expect(page.getByRole('article', { name: 'Escreva n se for positivo.' })).toContainText('Peso 2,5 · Versão 2');

  await page.getByRole('button', { name: 'Remover questão: Escreva n se for positivo.' }).click();
  await page.getByRole('dialog', { name: 'Remover questão do banco?' }).getByRole('button', { name: 'Remover' }).click();
  await expect(page.getByRole('article', { name: 'Escreva n se for positivo.' })).toHaveCount(0);
});

test('banco de questões: editor no celular com texto ampliado', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.addInitScript(() => localStorage.setItem('logibot.preferences', JSON.stringify({ textSize: 'larger', theme: 'dark', motion: 'reduce' })));
  await mockApi(page, 'professor');
  await mockBank(page);
  await page.goto('/questions/new');
  for (const button of await page.getByRole('button', { name: /^Remover alternativa/ }).all()) {
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  expect((await page.getByRole('radio').first().locator('xpath=..').boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.getByLabel('Tipo de questão').selectOption('translation');
  await audit(page, 'editor 320px');
});

test('banco de questões: item do menu da equipe logo após Quizzes', async ({ page }, info) => {
  await mockApi(page, 'professor');
  await mockBank(page);
  await page.goto('/dashboard');
  if (info.project.name === 'mobile') await page.getByRole('button', { name: 'Abrir menu' }).click();
  const menu = info.project.name === 'mobile' ? page.getByRole('dialog') : page.locator('aside').first();
  const labels = await menu.getByRole('link').allTextContents();
  expect(labels[labels.indexOf('Quizzes') + 1]).toBe('Banco de questões');
  await menu.getByRole('link', { name: 'Banco de questões' }).click();
  await expect(page).toHaveURL(/\/questions$/);
});

test('campos opcionais: asterisco explica ao passar o mouse, tocar e pelo teclado', async ({ page }, info) => {
  await mockApi(page, 'professor');
  await mockBank(page);
  await page.goto('/questions/new');
  const concepts = page.getByLabel('Conceitos (separados por vírgula) (opcional)', { exact: true });
  await expect(concepts).toBeVisible();
  const mark = page.locator('label', { has: page.locator('[data-optional-mark]') }).filter({ hasText: 'Conceitos' }).locator('[data-optional-mark]');
  await expect(mark).toHaveAccessibleName('(opcional)');
  const box = (await mark.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(24);
  expect(box.height).toBeGreaterThanOrEqual(24);
  if (info.project.name !== 'mobile') {
    await mark.hover();
    await expect(page.getByRole('tooltip', { name: 'Campo opcional' })).toContainText('não é obrigatório');
    await page.mouse.move(0, 0);
    await expect(page.getByRole('tooltip')).toHaveCount(0);
  }
  await mark.click();
  const dialog = page.getByRole('dialog', { name: 'Campo opcional' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Fechar' })).toBeFocused();
  await expect(concepts).not.toBeFocused();
  await audit(page, 'explicação de campo opcional');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(mark).toBeFocused();
});

test('professor marca a questão para a bancada e confere o gabarito', async ({ page }) => {
  await mockApi(page, 'professor');
  await mockBank(page);
  await page.goto('/questions/new');
  await page.getByLabel('Tipo de questão').selectOption('truth_table');
  await page.getByLabel('Enunciado', { exact: true }).fill('Monte a tabela do condicional.');
  await page.getByLabel('Fórmula', { exact: true }).fill('p -> q');
  const key = page.getByRole('region', { name: 'Gabarito: tabela-verdade de p → q' });
  await expect(key.getByRole('row')).toHaveCount(5);
  await audit(page, 'editor com gabarito');
  await page.getByRole('checkbox', { name: 'Usar na bancada de exercícios' }).check();
  await page.getByRole('button', { name: 'Salvar questão' }).click();
  await expect(page.getByRole('article', { name: /Monte a tabela do condicional/ })).toContainText('Na bancada');
});

test('importar de um quiz: o modal fecha mesmo sem quiz escolhido', async ({ page }) => {
  await mockApi(page, 'professor');
  await mockBank(page);
  await page.goto('/questions');
  for (const close of ['Fechar modal', 'Cancelar']) {
    await page.getByRole('button', { name: 'Importar de um quiz' }).click();
    const dialog = page.getByRole('dialog', { name: 'Importar questões de um quiz' });
    await expect(dialog.getByRole('button', { name: 'Importar', exact: true })).toBeDisabled();
    await dialog.getByRole('button', { name: close, exact: true }).click();
    await expect(dialog).toHaveCount(0);
  }
});
