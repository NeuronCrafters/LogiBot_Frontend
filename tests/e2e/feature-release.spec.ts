import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockApi } from './fixtures';

test.use({ locale: 'pt-BR' });

async function audit(page: Page, label: string) {
  await page.evaluate(() => Promise.allSettled(document.getAnimations()
    .filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity)
    .map(animation => animation.finished)));
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })), label).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), `${label}: largura`).toBeTruthy();
}

test('o aluno não vê nem abre pela URL o que não foi liberado', async ({ page }, info) => {
  await mockApi(page, 'student');
  await page.route('**/api/features/me', route => route.fulfill({ json: { features: { chat: true, quiz: true, exams: false, practice_parsons: false, notifications: false } } }));
  await page.goto('/chat');
  if (info.project.name === 'mobile') await page.getByRole('button', { name: 'Abrir menu' }).click();
  const nav = page.locator('#header-menu-options').last();
  await expect(nav.getByRole('link', { name: 'Tabela-verdade' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Provas' })).toHaveCount(0);
  await expect(nav.getByRole('link', { name: 'Montar algoritmo' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Notificações/ })).toHaveCount(0);
  await page.goto('/exams');
  await expect(page.getByRole('heading', { name: 'Funcionalidade indisponível' })).toBeVisible();
  await audit(page, 'funcionalidade indisponível');
});

test('o admin bloqueia uma funcionalidade para uma instituição', async ({ page }) => {
  await mockApi(page, 'admin', { isOwner: true });
  const rules: any[] = [{ id: 'r1', feature: 'chat', scope: 'global', scopeId: '', enabled: false, updatedAt: '' }];
  const calls: any[] = [];
  await page.route('**/api/features/rules**', async route => {
    const request = route.request();
    if (request.method() === 'GET') return route.fulfill({ json: { features: [], rules } });
    const body = request.postDataJSON();
    calls.push({ method: request.method(), body });
    if (request.method() === 'PUT') { rules.push({ id: `r${rules.length + 1}`, ...body, updatedAt: '' }); return route.fulfill({ json: body }); }
    rules.splice(rules.findIndex(rule => rule.feature === body.feature && rule.scope === body.scope && rule.scopeId === body.scopeId), 1);
    return route.fulfill({ status: 204, body: '' });
  });
  await page.goto('/admin/features');
  await expect(page.getByRole('heading', { name: 'Funcionalidades em: Toda a plataforma' })).toBeVisible();
  await expect(page.getByLabel('Situação de Chat neste nível')).toHaveValue('off');
  await page.getByLabel('Instituição', { exact: true }).selectOption({ label: 'Universidade original' });
  const chat = page.getByLabel('Situação de Chat neste nível');
  await expect(chat).toHaveValue('inherit');
  await expect(chat).toHaveAccessibleDescription(/Bloqueada herdado de: Toda a plataforma/);
  await audit(page, 'liberação de funcionalidades');
  await page.getByLabel('Situação de Provas neste nível').selectOption('off');
  await expect.poll(() => calls.at(-1)).toMatchObject({ method: 'PUT', body: { feature: 'exams', scope: 'institution', enabled: false } });
  await expect(page.getByLabel('Situação de Provas neste nível')).toHaveAccessibleDescription(/Bloqueada definido neste nível/);
  await page.getByLabel('Situação de Provas neste nível').selectOption('inherit');
  await expect.poll(() => calls.at(-1)).toMatchObject({ method: 'POST', body: { feature: 'exams', scope: 'institution' } });
});
