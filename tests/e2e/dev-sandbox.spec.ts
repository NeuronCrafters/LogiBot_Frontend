import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ids, mockApi } from './fixtures';

test.use({ locale: 'pt-BR' });

async function audit(page: Page, label: string) {
  await page.evaluate(() => Promise.allSettled(document.getAnimations()
    .filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity)
    .map(animation => animation.finished)));
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })), label).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), `${label}: largura`).toBeTruthy();
}

const status = {
  configured: true, passwordConfigured: true,
  structure: [{ institution: 'Faculdade SAEL (teste)', courses: ['Ciência da Computação (teste)'] }],
  periods: [0, 7, 15, 30, 90, 180, 365],
  accounts: [{ email: 'adm@dev.sael.com', role: 'admin' }, { email: 'professor@dev.sael.com', role: 'professor' }, { email: 'aluno0@dev.sael.com', role: 'student' }],
  suppressedMails: [{ to: 'aluno0@dev.sael.com', subject: 'Nova prova: Lógica', at: '2026-11-18T10:00:00Z' }],
};

test('o owner entra como conta de teste e restaura o ambiente', async ({ page }) => {
  await mockApi(page, 'admin', { isOwner: true, environment: 'production' });
  const calls: any[] = [];
  await page.route('**/api/dev/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/^\/api/, '');
    if (request.method() === 'GET') return route.fulfill({ json: status });
    calls.push({ path, body: request.postDataJSON() });
    if (path === '/dev/sandbox/reset') return route.fulfill({ json: { accounts: 33, institutions: 2, sessions: 4800, answers: 14000, quizAttempts: 600 } });
    return route.fulfill({ json: { environment: 'sandbox' } });
  });
  await page.goto('/dev');
  await expect(page.getByRole('heading', { name: 'Ambiente de teste (Dev)' })).toBeVisible();
  await expect(page.getByText('Nova prova: Lógica')).toBeVisible();
  await audit(page, 'área dev');
  await page.getByLabel('Atividade gerada').selectOption({ label: 'Um ano' });
  await page.getByRole('button', { name: 'Restaurar ambiente de teste' }).click();
  await page.getByRole('dialog', { name: 'Restaurar o ambiente de teste?' }).getByRole('button', { name: 'Restaurar ambiente de teste' }).click();
  await expect.poll(() => calls.at(-1)).toEqual({ path: '/dev/sandbox/reset', body: { days: 365 } });
  await expect(page.getByText('Ambiente de teste recriado: 4800 sessões')).toBeVisible();
  // After entering, the session is read again: answer as the test account.
  let entered = false;
  await page.route('**/api/auth/me', async route => {
    if (!entered) return route.fallback();
    return route.fulfill({ json: {
      id: 'test-professor', _id: 'test-professor', name: 'Professor (teste)', email: 'professor@dev.sael.com', role: ['professor'], preferredLanguage: 'pt-BR',
      school: ids.university, schoolId: [ids.university], courses: [], classes: [], disciplines: [],
      environment: 'sandbox', canReturnToOwner: true, isOwner: false,
    } });
  });
  await page.evaluate(() => { (window as unknown as { keptAcrossSwitch: boolean }).keptAcrossSwitch = true; });
  await page.getByLabel('Conta de teste').selectOption('professor@dev.sael.com');
  entered = true;
  await page.getByRole('button', { name: 'Entrar como esta conta' }).click();
  await expect.poll(() => calls.at(-1)).toEqual({ path: '/dev/sandbox/enter', body: { email: 'professor@dev.sael.com' } });
  await expect(page.getByRole('region', { name: 'Ambiente de teste' })).toContainText('professor@dev.sael.com');
  // No blank reload: the page kept its state and only the route changed, with the veil gone afterwards.
  expect(await page.evaluate(() => (window as unknown as { keptAcrossSwitch?: boolean }).keptAcrossSwitch)).toBe(true);
  await expect(page.locator('[data-account-switch]')).toHaveCount(0);
});

test('a área dev não aparece para admin que não é owner', async ({ page }) => {
  await mockApi(page, 'admin');
  await page.goto('/admin/features');
  await expect(page.getByRole('link', { name: 'Ambiente de teste' })).toHaveCount(0);
  await page.goto('/dev');
  await expect(page.getByText('Acesso restrito.')).toBeVisible();
});

test('a conta de teste mostra a faixa e volta para a conta do owner', async ({ page }) => {
  await mockApi(page, 'professor', { environment: 'sandbox', canReturnToOwner: true, email: 'professor@dev.sael.com' });
  let left = false;
  await page.route('**/api/dev/sandbox/leave', route => { left = true; return route.fulfill({ json: { environment: 'production' } }); });
  await page.goto('/profile');
  const banner = page.getByRole('region', { name: 'Ambiente de teste' });
  await expect(banner).toContainText('AMBIENTE DE TESTE · professor@dev.sael.com');
  await audit(page, 'faixa do ambiente de teste');
  await banner.getByRole('button', { name: 'Voltar para minha conta' }).click();
  await expect.poll(() => left).toBe(true);
});

test('liberação de funções e ambiente de teste aparecem só para o owner', async ({ page }) => {
  const cases: Array<[string, Record<string, unknown>, boolean]> = [
    ['admin', { isOwner: true, environment: 'production' }, true],
    ['admin', { isOwner: false, environment: 'production' }, false],
    ['admin', { isOwner: false, environment: 'sandbox', email: 'adm@dev.sael.com' }, false],
    ['course-coordinator', {}, false],
    ['professor', {}, false],
    ['student', {}, false],
  ];
  for (const [role, overrides, visible] of cases) {
    await page.unrouteAll({ behavior: 'ignoreErrors' });
    await mockApi(page, role, overrides);
    await page.goto('/profile');
    const opener = page.getByRole('button', { name: 'Abrir menu' });
    await opener.or(page.locator('aside:visible')).first().waitFor();
    if (await opener.isVisible()) await opener.click();
    const menu = page.locator('#header-menu-options').last();
    await expect(menu.getByRole('link').first()).toBeVisible();
    const label = `${role} ${JSON.stringify(overrides)}`;
    await expect(menu.getByRole('link', { name: 'Liberação de funções' }), label).toHaveCount(visible ? 1 : 0);
    await expect(menu.getByRole('link', { name: 'Ambiente de teste' }), label).toHaveCount(visible ? 1 : 0);
  }
});
