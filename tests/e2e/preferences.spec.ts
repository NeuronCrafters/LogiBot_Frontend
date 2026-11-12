import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockApi } from './fixtures';

const KEY = 'logibot.preferences';

test.use({ locale: 'pt-BR' });

async function withPreferences(page: Page, preferences: Record<string, string>) {
  await page.addInitScript(([key, value]) => { localStorage.setItem(key, value); }, [KEY, JSON.stringify(preferences)] as const);
}

async function audit(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations.map(item => ({ id: item.id, impact: item.impact, targets: item.nodes.map(node => node.target) })), label).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), `${label}: largura`).toBeTruthy();
}

test('tema escuro é o padrão sem escolha salva', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/dark/);
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(10, 10, 10)');
});

test('tema claro é aplicado antes da renderização e segue o sistema quando escolhido', async ({ page }) => {
  await withPreferences(page, { theme: 'system' });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/signin');
  await expect(page.locator('html')).toHaveClass(/light/);
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(228, 232, 238)');
});

test('preferências podem ser alteradas antes do login e ficam salvas', async ({ page }) => {
  await page.goto('/signin');
  await page.getByRole('button', { name: 'Aparência e acessibilidade' }).click();
  const dialog = page.getByRole('dialog', { name: 'Aparência e acessibilidade' });
  await expect(dialog).toBeVisible();
  await audit(page, 'preferências: modal');
  await dialog.getByRole('group', { name: 'Tema' }).getByText('Claro', { exact: true }).click();
  await dialog.getByRole('group', { name: 'Tamanho do texto' }).getByText('Muito maior', { exact: true }).click();
  await dialog.getByRole('group', { name: 'Movimento' }).getByText('Reduzido', { exact: true }).click();
  await expect(dialog.getByRole('group', { name: 'Tema' }).getByLabel('Claro')).toBeChecked();
  await expect(page.locator('html')).toHaveClass(/light/);
  await expect(page.locator('html')).toHaveAttribute('data-text', 'larger');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Aparência e acessibilidade' })).toBeFocused();
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/light/);
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe('20px');
});

for (const route of ['/', '/signin']) {
  test(`diálogo de preferências cabe inteiro na tela em ${route}`, async ({ page }) => {
    await page.goto(route);
    await page.getByRole('button', { name: 'Aparência e acessibilidade' }).click();
    const box = await page.getByRole('dialog', { name: 'Aparência e acessibilidade' }).boundingBox();
    const viewport = page.viewportSize()!;
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
  });
}

test('movimento reduzido do sistema interrompe a animação da logo', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce');
  await page.waitForTimeout(100);
  const running = await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length);
  expect(running).toBe(0);
});

test('campos de autenticação têm rótulo visível e autocomplete', async ({ page }) => {
  await page.goto('/signup');
  for (const [label, autocomplete] of [['Nome completo', 'name'], ['E-mail', 'email'], ['Senha', 'new-password']]) {
    const input = page.getByLabel(label, { exact: true });
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('autocomplete', autocomplete);
  }
  await expect(page.locator('label[for="signup-email-input"]')).toBeVisible();
});

test('rota inexistente mostra página de não encontrado', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '/');
});

for (const contrast of ['default', 'more']) {
  for (const route of ['/', '/signin', '/signup', '/profile', '/chat', '/quiz', '/entities/create/university', '/entities/manage', '/entities', '/rag', '/quiz/manage', '/feedback', '/admin/feedbacks', '/dashboard']) {
    test(`tema claro (${contrast}) ${route}`, async ({ page }) => {
      await withPreferences(page, { theme: 'light', contrast });
      if (!['/', '/signin', '/signup'].includes(route)) await mockApi(page, ['/chat', '/quiz'].includes(route) ? 'student' : 'admin');
      await page.goto(route);
      await expect(page.locator('html')).toHaveClass(/light/);
      await page.waitForLoadState('networkidle');
      await audit(page, `${route} claro ${contrast}`);
    });
  }
}

test('contraste reforçado no tema escuro mantém a página sem violações', async ({ page }) => {
  await withPreferences(page, { contrast: 'more' });
  await mockApi(page, 'admin');
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  await audit(page, 'dashboard escuro reforçado');
});

test('texto muito maior não cria rolagem horizontal', async ({ page }) => {
  await withPreferences(page, { textSize: 'larger' });
  await mockApi(page, 'admin');
  for (const route of ['/', '/signin', '/dashboard', '/profile']) {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), route).toBeTruthy();
  }
});

test('grade dos gráficos permanece visível no tema claro', async ({ page }) => {
  await withPreferences(page, { theme: 'light' });
  await mockApi(page, 'admin');
  await page.goto('/dashboard');
  await page.getByRole('combobox', { name: 'Selecione uma Entidade', exact: true }).click();
  await page.getByRole('option', { name: 'Universidade', exact: true }).click();
  await page.getByRole('combobox', { name: 'Selecione a universidade', exact: true }).click();
  await page.getByRole('option', { name: 'Universidade original', exact: true }).click();
  for (const selector of ['#usage-chart .recharts-cartesian-grid line', '#proficiency-radar-chart .recharts-polar-grid-concentric-polygon']) {
  const grid = page.locator(selector).first();
  await expect(grid, selector).toBeAttached();
  const contrast = await grid.evaluate(line => {
    const lum = (rgb: number[]) => rgb.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
    const parse = (value: string) => { const m = value.match(/[\d.]+/g)!.map(Number); return { rgb: m.slice(0, 3), a: m[3] ?? 1 }; };
    const stroke = parse(getComputedStyle(line).stroke);
    const opacity = Number(getComputedStyle(line).strokeOpacity || 1);
    let el: Element | null = line; let bg = [255, 255, 255];
    while (el) { const c = parse(getComputedStyle(el).backgroundColor); if (c.a > .9) { bg = c.rgb; break; } el = el.parentElement; }
    const a = stroke.a * opacity; const mixed = stroke.rgb.map((v, i) => v * a + bg[i] * (1 - a));
    const [x, y] = [lum(mixed), lum(bg)];
    return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
  });
  expect(contrast, selector).toBeGreaterThanOrEqual(1.7);
  }
});

for (const route of ['/', '/signin', '/dashboard']) {
  test(`controles do cabeçalho têm a mesma altura e alinhamento em ${route}`, async ({ page }) => {
    if (route === '/dashboard') await mockApi(page, 'admin');
    await page.goto(route);
    if (route === '/dashboard' && await page.locator('#chat-header-menu-button').isVisible()) await page.locator('#chat-header-menu-button').click();
    const scope = route === '/dashboard' && await page.getByRole('dialog').count() ? page.getByRole('dialog') : page;
    const controls = [scope.getByRole('button', { name: 'Aparência e acessibilidade' }).first(), scope.getByRole('combobox', { name: 'Idioma' }).first()];
    if (route === '/') controls.push(page.locator('#play-button'));
    const boxes = await Promise.all(controls.map(control => control.boundingBox()));
    for (const box of boxes) {
      expect(box).not.toBeNull();
      expect(Math.round(box!.height)).toBe(Math.round(boxes[0]!.height));
      expect(Math.abs(box!.y - boxes[0]!.y)).toBeLessThanOrEqual(1);
    }
  });
}
