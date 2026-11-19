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
