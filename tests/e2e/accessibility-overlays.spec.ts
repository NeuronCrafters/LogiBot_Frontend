import { test, expect, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockApi } from './fixtures';

test.use({ locale: 'pt-BR' });

async function preferences(page: Page, values: Record<string, string>) {
  await page.addInitScript(value => localStorage.setItem('logibot.preferences', JSON.stringify(value)), values);
}

async function universityDashboard(page: Page) {
  await mockApi(page, 'admin');
  await page.goto('/dashboard');
  await page.getByRole('combobox', { name: 'Selecione uma Entidade', exact: true }).click();
  await page.getByRole('option', { name: 'Universidade', exact: true }).click();
  await page.getByRole('combobox', { name: 'Selecione a universidade', exact: true }).click();
  await page.getByRole('option', { name: 'Universidade original', exact: true }).click();
  await expect(page.locator('#proficiency-radar-chart .recharts-polar-angle-axis-tick text').first()).toBeVisible();
}

async function insideViewport(page: Page, element: Locator, margin = 0) {
  await expect(element).toBeVisible();
  const box = await element.boundingBox();
  const viewport = page.viewportSize()!;
  expect(box!.x).toBeGreaterThanOrEqual(margin - 1);
  expect(box!.y).toBeGreaterThanOrEqual(margin - 1);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width - margin + 1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height - margin + 1);
}

for (const viewport of [{ width: 320, height: 640 }, { width: 393, height: 852 }, { width: 1280, height: 800 }]) {
  test(`preferences leave margins and lock the page at ${viewport.width}px`, async ({ page }, info) => {
    await page.setViewportSize(viewport);
    await preferences(page, { theme: 'light', textSize: 'larger' });
    await page.goto('/');
    await page.getByRole('button', { name: 'Aparência e acessibilidade' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Aparência e acessibilidade' });
    await insideViewport(page, dialog, 16);
    expect((await dialog.boundingBox())!.width).toBeLessThanOrEqual(560);
    const before = await page.evaluate(() => scrollY);
    await page.mouse.move(4, viewport.height / 2);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(150);
    expect(await page.evaluate(() => scrollY)).toBe(before);
    const scrollPanel = dialog.locator('.overflow-y-auto');
    await scrollPanel.hover();
    await page.mouse.wheel(0, 700);
    await expect.poll(() => scrollPanel.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
    await insideViewport(page, dialog.getByRole('button', { name: 'Fechar', exact: true }));
    await dialog.getByRole('button', { name: 'Restaurar padrões' }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath(`preferences-${viewport.width}.png`) });
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Aparência e acessibilidade' }).first()).toBeFocused();
    await page.mouse.move(viewport.width / 2, viewport.height / 2);
    await page.mouse.wheel(0, 500);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before);
  });
}

test('preferences also lock the independently scrollable dashboard panel', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await universityDashboard(page);
  const background = page.locator('main.overflow-y-auto');
  await background.evaluate(node => { node.scrollTop = 250; });
  await page.getByRole('button', { name: 'Aparência e acessibilidade' }).first().click();
  const before = await background.evaluate(node => node.scrollTop);
  await page.mouse.move(1100, 600);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(150);
  expect(await background.evaluate(node => node.scrollTop)).toBe(before);
  await page.keyboard.press('Escape');
  await background.hover();
  await page.mouse.wheel(0, 400);
  await expect.poll(() => background.evaluate(node => node.scrollTop)).toBeGreaterThan(before);
});

test('chart information fits narrow and short screens and restores keyboard focus', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 480 });
  await preferences(page, { textSize: 'larger', theme: 'light', motion: 'reduce' });
  await universityDashboard(page);
  for (const id of ['usage-chart', 'correct-wrong-chart', 'general-score-card', 'category-chart', 'proficiency-radar-chart', 'effort-matrix-chart', 'learning-journey-chart']) {
    const trigger = page.locator(`#${id}`).getByRole('button', { name: 'Informações sobre o gráfico', exact: true });
    await trigger.click();
    const popup = page.getByRole('dialog', { name: 'Sobre este gráfico', exact: true });
    await insideViewport(page, popup, 16);
    expect(await popup.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
    await expect(popup.getByRole('button', { name: 'Fechar', exact: true })).toBeFocused();
    if (id === 'learning-journey-chart') await page.screenshot({ path: info.outputPath('chart-info-320.png') });
    await page.keyboard.press('Escape');
    await expect(popup).toHaveCount(0);
    await expect(trigger).toBeFocused();
  }
});

test('long chart tooltips fit the viewport on touch and mouse input', async ({ page, isMobile }, info) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await preferences(page, { theme: 'light', textSize: 'larger', motion: 'reduce' });
  await mockApi(page, 'admin');
  const name = 'Participante IFPA 02 — Nome completo bastante longo para consultar os resultados';
  await page.route('**/api/dashboard/effort-matrix', route => route.fulfill({ json: { points: [{ name, effort: 130.3, performance: 66.7 }], averages: { avgPerformance: 70, avgEffort: 29.2 } } }));
  await page.goto('/dashboard');
  await page.getByRole('combobox', { name: 'Selecione uma Entidade', exact: true }).click();
  await page.getByRole('option', { name: 'Universidade', exact: true }).click();
  await page.getByRole('combobox', { name: 'Selecione a universidade', exact: true }).click();
  await page.getByRole('option', { name: 'Universidade original', exact: true }).click();
  const point = page.locator('#effort-matrix-chart .recharts-scatter-symbol').first();
  if (isMobile) await point.tap(); else await point.hover();
  const tooltip = page.locator('[data-chart-tooltip]').filter({ hasText: name });
  await insideViewport(page, tooltip, 16);
  expect(await tooltip.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
  await page.screenshot({ path: info.outputPath('chart-tooltip-320.png') });
});

test('long radar names, headings and metrics remain readable at 125% and 200%', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await preferences(page, { theme: 'dark', motion: 'reduce' });
  await mockApi(page, 'admin');
  const labels = ['Estruturas de Repetição', 'Vetores, Matrizes e Arrays', 'linguagem Python', 'Assunto cadastrado sem respostas'];
  await page.route('**/api/dashboard/proficiency-radar', route => route.fulfill({ json: { labels, data: [72, 60, 60, null] } }));
  await page.goto('/dashboard');
  await page.getByRole('combobox', { name: 'Selecione uma Entidade', exact: true }).click();
  await page.getByRole('option', { name: 'Universidade', exact: true }).click();
  await page.getByRole('combobox', { name: 'Selecione a universidade', exact: true }).click();
  await page.getByRole('option', { name: 'Universidade original', exact: true }).click();
  for (const font of [20, 32]) {
    await page.evaluate(size => { document.documentElement.style.fontSize = `${size}px`; }, font);
    const card = page.locator('#proficiency-radar-chart');
    await expect(card.locator('.radar-labels li')).toHaveText(labels);
    await expect.poll(() => card.evaluate(card => {
      const bounds = card.getBoundingClientRect();
      const nodes = [...card.querySelectorAll('h3, .chart-actions button, .chart-metrics > span, .radar-labels li, .recharts-polar-angle-axis-tick text')];
      return nodes.filter(node => { const r = node.getBoundingClientRect(); return r.width > 0 && (r.x < bounds.x - 1 || r.right > bounds.right + 1); }).map(node => ({ text: node.textContent || node.getAttribute('aria-label'), tag: node.tagName }));
    })).toEqual([]);
    const heading = await card.getByRole('heading').boundingBox();
    const actions = await card.locator('.chart-actions').boundingBox();
    expect(heading!.y + heading!.height).toBeLessThanOrEqual(actions!.y + 1);
    await card.screenshot({ path: info.outputPath(`radar-${font}.png`) });
  }
});

for (const theme of ['dark', 'light']) for (const colorScheme of ['dark', 'light'] as const) {
  test(`forced colors keep labels readable: app ${theme}, system ${colorScheme}`, async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'WebKit does not emulate forced-colors.');
    await preferences(page, { theme, motion: 'reduce' });
    await page.emulateMedia({ forcedColors: 'active', colorScheme });
    await universityDashboard(page);
    const colors = await page.locator('#proficiency-radar-chart .recharts-polar-angle-axis-tick text').first().evaluate(node => {
      const probe = document.createElement('span');
      probe.style.cssText = 'color:CanvasText;background:Canvas';
      document.body.append(probe);
      const system = getComputedStyle(probe);
      const result = { fill: getComputedStyle(node).fill, text: system.color, background: system.backgroundColor };
      probe.remove();
      return result;
    });
    expect(colors.fill).toBe(colors.text);
    expect(colors.fill).not.toBe(colors.background);
    const pattern = page.locator('#correct-wrong-chart pattern');
    expect(await pattern.locator('.chart-hatch-background').evaluate(node => getComputedStyle(node).fill)).toBe(colors.background);
    expect(await pattern.locator('.chart-hatch-line').evaluate(node => getComputedStyle(node).fill)).toBe(colors.text);
  });
}

test('the eighth chart offers its data table by keyboard', async ({ page }) => {
  await mockApi(page, 'admin');
  await page.goto('/dashboard');
  const choose = async (placeholder: string, label: string) => {
    await page.getByRole('combobox', { name: placeholder, exact: true }).click();
    await page.getByRole('option', { name: label, exact: true }).click();
  };
  await choose('Selecione uma Entidade', 'Aluno');
  await choose('Selecione o Curso', 'Curso original');
  await choose('Selecione a Turma', 'Turma original');
  await choose('Selecione o aluno', 'João da Silva');
  const card = page.locator('#access-pattern-chart');
  const toggle = card.locator('button[aria-controls]');
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(card.getByRole('table')).toContainText('28/10/2026');
  await expect(card.getByRole('columnheader')).toHaveCount(4);
  const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(audit.violations.map(item => item.id)).toEqual([]);
});
