import { test, expect, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockApi, selectLanguage } from './fixtures';
import { formatFormula, gradeTranslation, parseFormula } from '../../src/shared/logic/logicCore';
import { gradeParsons } from '../../src/shared/logic/parsonsCore';
import { findParsonsExercise, findTranslationExercise } from '../../src/shared/logic/exerciseCatalog';

test.use({ locale: 'pt-BR' });
const INDENT_PX = 24;

/** Waits until the route fade is over, so contrast is measured on the settled page. */
async function settle(page: Page) {
  await expect(page.locator('.navigation-transition')).toHaveAttribute('data-route-phase', 'idle');
  await expect.poll(() => page.getByRole('main').evaluate(node => getComputedStyle(node).opacity)).toBe('1');
}

async function audit(page: Page, label: string) {
  await settle(page);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations.map(item => ({ id: item.id, impact: item.impact, targets: item.nodes.map(node => node.target) })), label).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), `${label}: largura`).toBeTruthy();
}

/** Grades like the API, with the same shared cores and catalog. */
async function mockAttempts(page: Page) {
  const bodies: any[] = [];
  await page.route('**/api/exercises/attempts', async route => {
    const body = route.request().postDataJSON();
    bodies.push(body);
    const base = { attemptId: `attempt-${bodies.length}`, attemptNumber: bodies.length, engineVersion: '1.0.0', concepts: [] };
    if (body.type === 'translation') {
      const exercise = findTranslationExercise(body.exerciseId)!;
      const grade = gradeTranslation(exercise.target, exercise.legend.map(entry => entry.letter), body.answer);
      if (grade.status === 'invalid') return route.fulfill({ status: 400, json: { message: 'invalid' } });
      const json: any = { ...base, exerciseId: `translation:${exercise.id}`, correct: grade.status === 'correct', normalizedAnswer: grade.normalizedAnswer };
      if (grade.status === 'correct' && !grade.identicalToTarget) json.equivalentTo = formatFormula(parseFormula(exercise.target));
      if (grade.status === 'incorrect') Object.assign(json, { counterexample: grade.counterexample, answerValue: grade.answerValue, expectedValue: grade.expectedValue });
      return route.fulfill({ status: 201, json });
    }
    const exercise = findParsonsExercise(body.exerciseId)!;
    const { solutionIndex: _ignored, ...grade } = gradeParsons(exercise, body.solution);
    return route.fulfill({ status: 201, json: { ...base, exerciseId: `parsons:${exercise.id}`, ...grade } });
  });
  return bodies;
}

const bank = (page: Page) => page.getByRole('list', { name: 'Linhas disponíveis' });
const solution = (page: Page) => page.getByRole('list', { name: 'Sua solução' });

/** Mouse drag with small steps, as a person would do it. */
async function mouseDrag(page: Page, source: Locator, toX: number, toY: number) {
  const box = (await source.boundingBox())!;
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 10, start.y + 10, { steps: 3 });
  await page.mouse.move(toX, toY, { steps: 15 });
  await page.mouse.up();
}

/** Real touch events through the DevTools protocol (Chromium mobile project). */
async function touchDrag(page: Page, source: Locator, toX: number, toY: number, holdMs: number) {
  const client = await page.context().newCDPSession(page);
  const box = (await source.boundingBox())!;
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
  if (holdMs) await page.waitForTimeout(holdMs);
  for (let step = 1; step <= 12; step++) {
    const point = { x: start.x + ((toX - start.x) * step) / 12, y: start.y + ((toY - start.y) * step) / 12 };
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point] });
    await page.waitForTimeout(16);
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

for (const language of ['pt-BR', 'en-US', 'es-ES']) {
  test(`fase 3: acessibilidade da tradução e do Parsons em ${language}`, async ({ page }) => {
    await mockApi(page, 'student');
    await mockAttempts(page);
    await page.goto('/practice/translation');
    await selectLanguage(page, language);
    await audit(page, `${language}: tradução inicial`);
    await page.locator('input[aria-describedby]').fill('q -> p');
    await page.locator('form button[type=submit]').click();
    await expect(page.getByRole('table')).toBeVisible();
    await audit(page, `${language}: tradução com contraexemplo`);

    await page.goto('/practice/parsons');
    await audit(page, `${language}: Parsons inicial`);
    await page.getByRole('list').filter({ has: page.getByRole('button') }).first().getByRole('button').first().click();
    await page.locator('[role=group] button:not([disabled])').first().click();
    await page.getByRole('button', { name: /^(Verificar|Check)$/ }).click();
    await expect(page.locator('[role=status][aria-atomic=true]').filter({ hasText: /\S/ })).toBeVisible();
    await audit(page, `${language}: Parsons com resultado`);
  });
}

test('fase 3: tradução pelo teclado de símbolos no celular sem abrir o teclado virtual', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'Toque no celular.');
  await page.setViewportSize({ width: 320, height: 760 });
  await page.addInitScript(() => localStorage.setItem('logibot.preferences', JSON.stringify({ theme: 'dark', motion: 'reduce', textSize: 'larger' })));
  await mockApi(page, 'student');
  const bodies = await mockAttempts(page);
  await page.goto('/practice/translation');
  for (const name of ['Inserir ¬ (negação)', 'Inserir p (chove)', 'Inserir ∨ (disjunção)', 'Inserir q (a rua fica molhada)']) {
    const key = page.getByRole('button', { name });
    const box = (await key.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);
    await key.tap();
  }
  await expect(page.getByLabel('Sua fórmula')).toHaveValue('¬p ∨ q');
  expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe('INPUT');
  await expect(page.getByText('Leitura: ¬p ∨ q')).toBeVisible();
  await page.getByRole('button', { name: 'Verificar' }).tap();
  await expect(page.getByText('Correto! Sua fórmula traduz a frase.')).toBeVisible();
  await expect(page.getByText('Ela é equivalente à forma esperada, p → q.')).toBeVisible();
  expect(bodies[0]).toMatchObject({ type: 'translation', exerciseId: 'tr-rain-street', answer: '¬p ∨ q' });
  await audit(page, 'tradução 320px');
});

test('fase 3: Parsons só pelo teclado até o resultado correto', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'Teclado físico no desktop.');
  await mockApi(page, 'student');
  const bodies = await mockAttempts(page);
  await page.goto('/practice/parsons');
  const steps: Array<[string, number]> = [['leia(n)', 0], ['se n % 2 = 0 então', 0], ['escreva("par")', 1], ['senão', 0], ['escreva("ímpar")', 1], ['fimse', 0]];
  for (const [text, indent] of steps) {
    await bank(page).getByRole('button', { name: text, exact: true }).focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('m');
    for (let i = 0; i < indent; i++) await page.keyboard.press('ArrowRight');
    await expect(solution(page).getByRole('button', { name: `${text}, recuo ${indent}`, exact: true })).toBeFocused();
  }
  await page.getByRole('button', { name: 'Verificar' }).click();
  await expect(page.getByText('Algoritmo correto!')).toBeVisible();
  await expect(page.getByText('Tentativa 1 registrada.')).toBeVisible();
  expect(bodies[0].solution).toEqual([
    { id: 'read', indent: 0 }, { id: 'if', indent: 0 }, { id: 'even', indent: 1 }, { id: 'else', indent: 0 }, { id: 'odd', indent: 1 }, { id: 'endif', indent: 0 },
  ]);
});

test('fase 3: Parsons por arraste com mouse, com recuo pela posição horizontal', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'Mouse no desktop.');
  await page.addInitScript(() => localStorage.setItem('logibot.preferences', JSON.stringify({ motion: 'reduce' })));
  await mockApi(page, 'student');
  await mockAttempts(page);
  await page.goto('/practice/parsons');
  await settle(page);
  await bank(page).scrollIntoViewIfNeeded();
  const bankBox = (await bank(page).boundingBox())!;
  const solutionBox = (await solution(page).boundingBox())!;
  const shift = solutionBox.x - bankBox.x;

  const read = bank(page).getByRole('button', { name: 'leia(n)', exact: true });
  const readBox = (await read.boundingBox())!;
  await mouseDrag(page, read, readBox.x + readBox.width / 2 + shift, solutionBox.y + 30);
  await expect(solution(page).getByRole('button', { name: 'leia(n), recuo 0', exact: true })).toBeVisible();

  const even = bank(page).getByRole('button', { name: 'escreva("par")', exact: true });
  const evenBox = (await even.boundingBox())!;
  const below = (await solution(page).boundingBox())!;
  await mouseDrag(page, even, evenBox.x + evenBox.width / 2 + shift + INDENT_PX, below.y + below.height - 10);
  await expect(solution(page).getByRole('button', { name: 'escreva("par"), recuo 1', exact: true })).toBeVisible();
  await expect(bank(page).getByRole('button')).toHaveCount(5);
});

test('fase 3: Parsons por toque segurando a linha, e o deslize rápido continua rolando', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'Toque no celular.');
  await mockApi(page, 'student');
  await mockAttempts(page);
  await page.goto('/practice/parsons');
  const read = bank(page).getByRole('button', { name: 'leia(n)', exact: true });
  await read.scrollIntoViewIfNeeded();

  // A quick swipe is a scroll gesture: the line must stay where it is.
  const readBox = (await read.boundingBox())!;
  await touchDrag(page, read, readBox.x + readBox.width / 2, readBox.y - 80, 0);
  await expect(bank(page).getByRole('button', { name: 'leia(n)', exact: true })).toBeVisible();

  // Press and hold, then drag into the solution.
  await read.scrollIntoViewIfNeeded();
  const target = (await solution(page).boundingBox())!;
  const start = (await read.boundingBox())!;
  await touchDrag(page, read, start.x + start.width / 2, Math.min(target.y + 30, page.viewportSize()!.height - 10), 350);
  await expect(solution(page).getByRole('button', { name: 'leia(n), recuo 0', exact: true })).toBeVisible();
});

for (const settings of [{ width: 320, textSize: 'larger', theme: 'dark' }, { width: 393, textSize: 'default', theme: 'light' }]) {
  test(`fase 3: Parsons no celular ${settings.width}px, texto ${settings.textSize}`, async ({ page }) => {
    await page.setViewportSize({ width: settings.width, height: 800 });
    await page.addInitScript(value => localStorage.setItem('logibot.preferences', JSON.stringify({ ...value, motion: 'reduce' })), settings);
    await mockApi(page, 'student');
    await mockAttempts(page);
    await page.goto('/practice/parsons');
    await bank(page).getByRole('button', { name: 'senão', exact: true }).click();
    const toolbar = page.getByRole('group', { name: 'Ações da linha selecionada' });
    for (const button of await toolbar.getByRole('button').all()) {
      const box = (await button.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.x + box.width).toBeLessThanOrEqual(settings.width);
    }
    await toolbar.getByRole('button', { name: 'Mover para a solução' }).click();
    await toolbar.getByRole('button', { name: 'Aumentar recuo' }).click();
    await expect(solution(page).getByRole('button', { name: 'senão, recuo 1', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Verificar' }).click();
    await expect(page.getByText('Linhas com recuo incorreto: 1.')).toBeVisible();
    await audit(page, `Parsons ${settings.width}px`);
  });
}

test('fase 3: cada tipo de exercício é uma opção própria no menu, logo abaixo do Quiz', async ({ page }, info) => {
  await mockApi(page, 'student');
  await page.goto('/chat');
  const openMenu = async () => { if (info.project.name === 'mobile') await page.getByRole('button', { name: 'Abrir menu' }).click(); };
  await openMenu();
  const menu = info.project.name === 'mobile' ? page.getByRole('dialog') : page.locator('aside').first();
  const labels = await menu.getByRole('link').allTextContents();
  const quiz = labels.indexOf('Quiz');
  expect(labels.slice(quiz, quiz + 4)).toEqual(['Quiz', 'Tabela-verdade', 'Tradução', 'Montar algoritmo']);

  for (const [name, path, heading] of [
    ['Tradução', '/practice/translation', 'Tradução para fórmula'],
    ['Montar algoritmo', '/practice/parsons', 'Montar algoritmo'],
    ['Tabela-verdade', '/practice/truth-table', 'Tabela-verdade'],
  ] as const) {
    if (info.project.name === 'mobile' && !(await page.getByRole('dialog').isVisible())) await openMenu();
    await menu.getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await expect(page.locator('.navigation-transition')).toHaveAttribute('data-route-scope', 'content');
    if (info.project.name !== 'mobile') await expect(menu.getByRole('link', { name, exact: true })).toHaveAttribute('aria-current', 'page');
  }
  await page.goto('/practice');
  await expect(page).toHaveURL(/\/practice\/truth-table$/);
});

for (const path of ['/practice/truth-table', '/practice/translation', '/practice/parsons']) {
  test(`fase 3: ${path} rola só o conteúdo, sem segunda barra na janela`, async ({ page }) => {
    await page.setViewportSize({ width: page.viewportSize()!.width, height: 640 });
    await mockApi(page, 'student');
    await mockAttempts(page);
    await page.goto(path);
    await settle(page);
    const pageScrolls = () => page.evaluate(() => document.documentElement.scrollHeight > innerHeight + 1 || document.body.scrollHeight > innerHeight + 1);
    expect(await pageScrolls(), 'inicial').toBe(false);
    // Interact so that live regions and marks are rendered at the bottom of long content.
    if (path.endsWith('parsons')) {
      await bank(page).getByRole('button').first().click();
      await page.getByRole('group', { name: 'Ações da linha selecionada' }).getByRole('button').first().click();
    } else if (path.endsWith('translation')) {
      await page.getByLabel('Sua fórmula').fill('q -> p');
    }
    await page.getByRole('button', { name: 'Verificar' }).click();
    await page.getByRole('main').evaluate(node => { node.scrollTop = node.scrollHeight; });
    expect(await pageScrolls(), 'após verificar e rolar até o fim').toBe(false);
    expect(await page.evaluate(() => scrollY)).toBe(0);
  });
}
