import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockApi, selectLanguage } from './fixtures';
import { gradeTruthTable } from '../../src/shared/logic/logicCore';

test.use({ locale: 'pt-BR' });

async function audit(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations.map(item => ({ id: item.id, impact: item.impact, targets: item.nodes.map(node => node.target) })), label).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), `${label}: largura`).toBeTruthy();
}

/** Mocks the attempt endpoint with the same logic core the API uses. */
async function mockAttempts(page: Page) {
  const bodies: any[] = [];
  let attempt = 0;
  await page.route('**/api/exercises/attempts', async route => {
    const body = route.request().postDataJSON();
    bodies.push(body);
    attempt++;
    const grade = gradeTruthTable(body.formula, body.cells);
    await route.fulfill({ status: 201, json: { attemptId: `attempt-${attempt}`, attemptNumber: attempt, exerciseId: `truth_table:${body.formula}`, formula: body.formula, concepts: ['conditional'], engineVersion: '1.0.0', ...grade } });
  });
  return bodies;
}

async function setPreferences(page: Page, preferences: Record<string, unknown>) {
  await page.addInitScript(value => localStorage.setItem('logibot.preferences', JSON.stringify(value)), preferences);
}

for (const language of ['pt-BR', 'en-US', 'es-ES']) {
  test(`bancada: acessibilidade da tabela-verdade em ${language}`, async ({ page }) => {
    await mockApi(page, 'student');
    await mockAttempts(page);
    await page.goto('/practice/truth-table');
    await selectLanguage(page, language);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await audit(page, `${language}: inicial`);

    const viewGroup = page.locator('[role=group]').filter({ has: page.locator('button[aria-pressed]') }).first();
    await viewGroup.getByRole('button').first().click();
    await expect(page.getByRole('table')).toBeVisible();
    const cells = page.getByRole('table').getByRole('button');
    for (let index = 0; index < 4; index++) await cells.nth(index).press(index === 1 ? 'f' : 't');
    await page.getByRole('button', { name: /^(Verificar|Check)$/ }).click();
    await expect(page.getByRole('status')).not.toBeEmpty();
    await audit(page, `${language}: tabela com resultado`);

    await viewGroup.getByRole('button').nth(1).click();
    await expect(page.getByRole('list').filter({ has: page.getByRole('listitem') }).first()).toBeVisible();
    await audit(page, `${language}: por linha com resultado`);
  });
}

test('bancada: fluxo completo só por teclado com resultado do servidor', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'Fluxo de teclado físico no desktop.');
  await mockApi(page, 'student');
  const bodies = await mockAttempts(page);
  await page.goto('/practice/truth-table');
  await page.getByRole('button', { name: 'Tabela', exact: true }).click();

  const first = page.getByRole('button', { name: 'Linha 1, coluna p → q: vazia' });
  await first.focus();
  await page.keyboard.press('v');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('f');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('v');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('f');
  await expect(page.getByRole('button', { name: 'Linha 4, coluna p → q: F (falso)' })).toBeFocused();

  // A single tab stop for the grid: Tab leaves it and reaches the actions.
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Verificar' })).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page.getByRole('status')).toContainText('3 de 4 células certas.');
  await expect(page.getByRole('status')).toContainText('Erros por conceito: condicional (1).');
  await expect(page.getByRole('status')).toContainText('Tentativa 1 registrada.');
  await expect(page.getByRole('button', { name: 'Linha 4, coluna p → q: F (falso), incorreta' })).toBeVisible();
  expect(bodies[0]).toMatchObject({ type: 'truth_table', source: 'catalog', formula: 'p → q', cells: { '0|p → q': true, '1|p → q': false, '2|p → q': true, '3|p → q': false } });
});

test('bancada: células vazias são anunciadas e recebem o foco', async ({ page }) => {
  await mockApi(page, 'student');
  const bodies = await mockAttempts(page);
  await page.goto('/practice/truth-table');
  await page.getByRole('button', { name: 'Verificar' }).click();
  await expect(page.getByRole('alert')).toHaveText('Preencha todas as células antes de verificar (4 vazias).');
  await expect(page.locator(':focus')).toHaveAccessibleName(/^(Linha 1, coluna p → q: vazia|V)$/);
  expect(bodies).toHaveLength(0);
});

test('bancada: fórmula própria com erro traduzido e correção', async ({ page }) => {
  await mockApi(page, 'student');
  await mockAttempts(page);
  await page.goto('/practice/truth-table');
  await page.getByLabel('Fórmula', { exact: true }).selectOption('custom');
  const input = page.getByLabel('Sua fórmula (até 10 proposições, letras minúsculas)');
  await input.fill('p -> chove');
  await page.getByRole('button', { name: 'Usar fórmula' }).click();
  await expect(page.getByRole('alert')).toHaveText('Use proposições de uma letra (p, q, r…). Encontrado: “chove”.');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await input.fill('(p | q) <-> ~r');
  await input.press('Enter');
  await expect(page.getByRole('paragraph').filter({ hasText: /^\(p ∨ q\) ↔ ¬r$/ })).toBeVisible();
  await audit(page, 'fórmula própria');
});

for (const settings of [
  { width: 320, textSize: 'default', theme: 'light' },
  { width: 320, textSize: 'larger', theme: 'dark' },
  { width: 393, textSize: 'default', theme: 'dark' },
  { width: 768, textSize: 'larger', theme: 'light' },
]) {
  test(`bancada: celular ${settings.width}px, texto ${settings.textSize}, tema ${settings.theme}`, async ({ page }) => {
    await page.setViewportSize({ width: settings.width, height: 852 });
    await setPreferences(page, { theme: settings.theme, motion: 'reduce', textSize: settings.textSize });
    await mockApi(page, 'student');
    await mockAttempts(page);
    await page.goto('/practice/truth-table');

    // Narrow screens start in the row-by-row view, without horizontal scrolling of the page.
    await expect(page.getByRole('button', { name: 'Por linha' })).toHaveAttribute('aria-pressed', 'true');
    const groups = page.getByRole('group', { name: /^Linha \d, coluna p → q$/ });
    await expect(groups).toHaveCount(4);
    for (const box of await Promise.all((await groups.getByRole('button').all()).map(button => button.boundingBox()))) {
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.x + box!.width).toBeLessThanOrEqual(settings.width);
    }
    for (const [index, value] of ['V', 'F', 'V', 'V'].entries()) {
      await page.getByRole('group', { name: `Linha ${index + 1}, coluna p → q` }).getByRole('button', { name: value }).click();
    }
    await page.getByRole('button', { name: 'Verificar' }).click();
    await expect(page.getByRole('status')).toContainText('Correto! As 4 células estão certas.');
    await audit(page, `celular ${settings.width}px`);
  });
}

test('bancada: item no menu do aluno leva à página', async ({ page }, info) => {
  await mockApi(page, 'student');
  await page.goto('/chat');
  if (info.project.name === 'mobile') await page.getByRole('button', { name: /Abrir menu|Open menu|Abrir menú/ }).click();
  await page.getByRole('link', { name: 'Tabela-verdade', exact: true }).click();
  await expect(page).toHaveURL(/\/practice\/truth-table$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Tabela-verdade' })).toBeVisible();
});

test('bancada: transição entre chat, bancada e quiz mantém o menu e só esmaece o conteúdo', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'O menu lateral fixo existe só no desktop.');
  await page.addInitScript(() => localStorage.setItem('logibot.preferences', JSON.stringify({ mascot: 'static', motion: 'full' })));
  await mockApi(page, 'student');
  await page.goto('/chat');
  const link = page.getByRole('link', { name: 'Tabela-verdade', exact: true });
  await expect.poll(() => page.getByRole('main').evaluate(node => getComputedStyle(node).opacity)).toBe('1');

  // Hover warms up the page code, so the fade does not fall back to the full-screen loader.
  const chunk = page.waitForRequest(request => /PracticePage[-.][\w-]*\.js$/.test(request.url()));
  await link.hover();
  await chunk;

  const samples = await link.evaluate(async (anchor: HTMLAnchorElement) => {
    const sidebar = document.querySelector('aside');
    const values: { phase?: string; scope?: string; opacity: number; sidebarMounted: boolean; loader: boolean }[] = [];
    anchor.click();
    const start = performance.now();
    await new Promise<void>(resolve => {
      const sample = () => {
        const root = document.querySelector<HTMLElement>('.navigation-transition')!;
        const main = document.querySelector('main');
        values.push({
          phase: root.dataset.routePhase, scope: root.dataset.routeScope,
          opacity: main ? Number(getComputedStyle(main).opacity) : 1,
          sidebarMounted: !!sidebar?.isConnected, loader: !main,
        });
        if (performance.now() - start < 650) requestAnimationFrame(sample); else resolve();
      };
      requestAnimationFrame(sample);
    });
    return values;
  });
  expect(samples.every(value => value.scope === 'content')).toBe(true);
  expect(samples.every(value => value.sidebarMounted)).toBe(true);
  expect(samples.some(value => value.phase === 'exit' && value.opacity < 0.95)).toBe(true);
  expect(samples.some(value => value.phase === 'enter' && value.opacity < 0.95)).toBe(true);
  expect(samples.some(value => value.loader)).toBe(false);
  await expect(page).toHaveURL(/\/practice\/truth-table$/);
  await expect(page.getByRole('link', { name: 'Tabela-verdade', exact: true })).toHaveAttribute('aria-current', 'page');

  await page.getByRole('link', { name: 'Quiz', exact: true }).click();
  await expect(page).toHaveURL(/\/quiz$/);
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Tabela-verdade' })).toBeVisible();
});

test('bancada: movimento reduzido troca de página sem animação', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mockApi(page, 'student');
  await page.goto('/chat');
  // On the phone the menu is a drawer: wait for its button instead of checking once before the page renders.
  if (info.project.name === 'mobile') await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page.getByRole('link', { name: 'Tabela-verdade', exact: true }).click();
  await expect(page).toHaveURL(/\/practice\/truth-table$/);
  await expect(page.locator('.navigation-transition')).toHaveAttribute('data-route-phase', 'idle');
  expect(await page.getByRole('main').evaluate(node => node.getAnimations().length)).toBe(0);
});

test('bancada: cabeçalho do celular mostra o título da página', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'O cabeçalho compacto existe só no celular.');
  await mockApi(page, 'student');
  await page.goto('/practice/truth-table');
  await expect(page.locator('#chat-header-menu-button').locator('..')).toContainText('Tabela-verdade');
});

test('bancada: clique na célula abre a escolha entre V e F', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'A visualização em tabela é a padrão no desktop.');
  await mockApi(page, 'student');
  const bodies = await mockAttempts(page);
  await page.goto('/practice/truth-table');
  for (const [row, value] of [[1, 'V'], [2, 'F'], [3, 'V'], [4, 'V']] as const) {
    await page.getByRole('button', { name: `Linha ${row}, coluna p → q: vazia` }).click();
    const choice = page.getByRole('group', { name: `Linha ${row}, coluna p → q` });
    await expect(choice.getByRole('button')).toHaveCount(3);
    await expect(choice.getByRole('button', { name: 'V (verdadeiro)' })).toBeFocused();
    await choice.getByRole('button', { name: value === 'V' ? 'V (verdadeiro)' : 'F (falso)' }).click();
    await expect(choice).toHaveCount(0);
    await expect(page.getByRole('button', { name: `Linha ${row}, coluna p → q: ${value === 'V' ? 'V (verdadeiro)' : 'F (falso)'}` })).toBeFocused();
  }
  await page.getByRole('button', { name: 'Verificar' }).click();
  await expect(page.getByRole('status')).toContainText('Correto! As 4 células estão certas.');
  expect(bodies[0].cells).toEqual({ '0|p → q': true, '1|p → q': false, '2|p → q': true, '3|p → q': true });
});

test('celular: a gaveta do menu desliza ao abrir e ao fechar junto com a transição', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'Gaveta existe só no celular.');
  await page.addInitScript(() => localStorage.setItem('logibot.preferences', JSON.stringify({ mascot: 'static', motion: 'full' })));
  await mockApi(page, 'student');
  await page.goto('/chat');
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const link = dialog.getByRole('link', { name: 'Tabela-verdade', exact: true });
  const samples = await link.evaluate(async (anchor: HTMLAnchorElement) => {
    const drawer = anchor.closest('.mobile-drawer') as HTMLElement;
    const values: { mounted: boolean; x: number; inert: boolean; dialog: boolean }[] = [];
    anchor.click();
    const start = performance.now();
    await new Promise<void>(resolve => {
      const sample = () => {
        const matrix = drawer.isConnected ? new DOMMatrix(getComputedStyle(drawer).transform) : null;
        values.push({ mounted: drawer.isConnected, x: matrix ? matrix.m41 : 0, inert: drawer.hasAttribute('inert'), dialog: drawer.getAttribute('role') === 'dialog' });
        if (performance.now() - start < 500) requestAnimationFrame(sample); else resolve();
      };
      requestAnimationFrame(sample);
    });
    return values;
  });
  const leaving = samples.filter(value => value.mounted);
  expect(leaving.some(value => value.x < -1 && value.x > -230), 'posições intermediárias da gaveta').toBe(true);
  expect(leaving.every(value => !value.dialog && value.inert)).toBe(true);
  expect(samples.at(-1)!.mounted).toBe(false);
  await expect(page).toHaveURL(/\/practice\/truth-table$/);
  await expect(page.getByRole('button', { name: 'Abrir menu' })).toBeVisible();
});

test('celular: com movimento reduzido a gaveta fecha sem animação', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'Gaveta existe só no celular.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mockApi(page, 'student');
  await page.goto('/chat');
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  expect(await page.locator('.mobile-drawer').evaluate(node => node.getAnimations().length)).toBe(0);
  await page.getByRole('dialog').getByRole('link', { name: 'Tabela-verdade', exact: true }).click();
  await expect(page.locator('.mobile-drawer')).toHaveCount(0);
  await expect(page).toHaveURL(/\/practice\/truth-table$/);
});
