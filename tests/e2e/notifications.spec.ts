import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockApi, selectLanguage } from './fixtures';

test.use({ locale: 'pt-BR' });

async function mockNotifications(page: Page) {
  const calls: string[] = [];
  let unread = 2;
  const items = () => [
    { id: '10000000-0000-4000-8000-0000000000a1', type: 'quiz_published', params: { quizTitle: 'Laços de repetição', disciplineName: 'Lógica' }, link: '/quiz/00000000-0000-4000-8000-000000000005', readAt: unread > 0 ? null : '2026-11-16T12:00:00Z', createdAt: '2026-11-16T10:00:00Z', updatedAt: '2026-11-16T10:00:00Z' },
    { id: '10000000-0000-4000-8000-0000000000a2', type: 'quiz_completion_progress', params: { quizTitle: 'Vetores', completed: 3, total: 10, lastStudentName: 'Bia' }, link: '/quiz/manage', readAt: unread > 1 ? null : '2026-11-16T12:00:00Z', createdAt: '2026-11-15T10:00:00Z', updatedAt: '2026-11-15T10:00:00Z' },
  ];
  await page.route('**/api/notifications**', async route => {
    const url = new URL(route.request().url());
    calls.push(`${route.request().method()} ${url.pathname.replace(/^\/api/, '')}`);
    if (url.pathname.endsWith('/preferences')) return route.fulfill({ json: { emailEnabled: route.request().method() === 'PUT' ? route.request().postDataJSON().emailEnabled : false } });
    if (url.pathname.endsWith('/read-all')) { unread = 0; return route.fulfill({ json: { updated: 2 } }); }
    if (url.pathname.endsWith('/read')) { unread = Math.max(0, unread - 1); return route.fulfill({ status: 204, body: '' }); }
    return route.fulfill({ json: { items: items(), unreadCount: unread } });
  });
  return calls;
}

async function audit(page: Page, label: string) {
  // Measure contrast only after entry animations (page fade) have finished.
  // Cancelled animations reject and infinite ones never finish: wait only for the finite ones.
  await page.evaluate(() => Promise.allSettled(document.getAnimations()
    .filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity)
    .map(animation => animation.finished)));
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })), label).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), `${label}: largura`).toBeTruthy();
}

const bell = (page: Page) => page.getByRole('button', { name: /^Notificações/ }).filter({ visible: true });

for (const language of ['pt-BR', 'en-US', 'es-ES']) {
  test(`notificações: painel acessível em ${language}`, async ({ page }) => {
    await mockApi(page, 'student');
    await mockNotifications(page);
    await page.goto('/chat');
    await selectLanguage(page, language);
    const trigger = page.getByRole('button', { name: /^(Notificações|Notifications|Notificaciones) \(2/ }).filter({ visible: true });
    await trigger.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await audit(page, `notificações ${language}`);
  });
}

test('notificações: abrir, ler e voltar o foco, pelo teclado', async ({ page }) => {
  await mockApi(page, 'student');
  const calls = await mockNotifications(page);
  await page.goto('/chat');
  const trigger = bell(page);
  await expect(trigger).toHaveAccessibleName('Notificações (2 não lidas)');
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Notificações' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Novo quiz para a sua turma: “Laços de repetição” (Lógica).')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();

  await trigger.click();
  await dialog.getByRole('button', { name: 'Marcar todas como lidas' }).click();
  await expect(bell(page)).toHaveAccessibleName('Notificações');
  expect(calls).toContain('POST /notifications/read-all');
  await dialog.getByRole('checkbox', { name: /Receber também por e-mail/ }).check();
  await expect.poll(() => calls.includes('PUT /notifications/preferences')).toBe(true);
});

test('notificações: no celular o painel cabe na tela e o item leva à página', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'Cabeçalho do celular.');
  await page.setViewportSize({ width: 320, height: 700 });
  await page.addInitScript(() => localStorage.setItem('logibot.preferences', JSON.stringify({ textSize: 'larger', theme: 'dark', motion: 'reduce' })));
  await mockApi(page, 'student');
  await mockNotifications(page);
  await page.goto('/chat');
  const trigger = bell(page);
  const box = (await trigger.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(44);
  await trigger.tap();
  const dialog = page.getByRole('dialog', { name: 'Notificações' });
  const panel = (await dialog.boundingBox())!;
  expect(panel.x).toBeGreaterThanOrEqual(0);
  expect(panel.x + panel.width).toBeLessThanOrEqual(320);
  await audit(page, 'notificações 320px');
  await dialog.getByRole('link', { name: /Laços de repetição/ }).tap();
  await expect(page).toHaveURL(/\/quiz\/00000000-0000-4000-8000-000000000005$/);
});
