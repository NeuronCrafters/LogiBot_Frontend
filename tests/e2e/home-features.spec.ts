import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ locale: 'pt-BR' });

test('a home apresenta os seis recursos na ordem combinada', async ({ page }) => {
  await page.route('**/api/**', route => route.fulfill({ status: 401, json: { message: 'unauthenticated' } }));
  await page.goto('/');
  await expect(page).toHaveTitle('LogiBots.AI');
  const features = page.locator('#features h3');
  await expect(features).toHaveText(['Quiz adaptativo', 'Chat especializado', 'Treino de lógica', 'Acessível e em três idiomas', 'Provas online', 'Analytics educacional']);
  await page.locator('#features').scrollIntoViewIfNeeded();
  const results = await new AxeBuilder({ page }).include('#features').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations.map(item => item.id)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2)).toBeTruthy();
});

test('ao ir para Recursos, a linha que separa de Perfis não aparece cortando a tela', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'Seções da altura da tela só em telas grandes.');
  await page.addInitScript(() => localStorage.setItem('logibot.preferences', JSON.stringify({ motion: 'reduce' })));
  await page.route('**/api/**', route => route.fulfill({ status: 401, json: { message: 'unauthenticated' } }));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.getByRole('navigation').getByRole('link', { name: 'Recursos' }).click();
  await expect(page).toHaveURL(/#features$/);
  // The section starts under the header and its bottom border stays below the visible area.
  await expect.poll(() => page.locator('#features').evaluate((section) => section.getBoundingClientRect().bottom)).toBeGreaterThan(900);
});
