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

const OTHER_INSTITUTION = '00000000-0000-4000-8000-0000000000aa';
/** Two institutions, so A and B can be different entities of the same kind. */
async function twoInstitutions(page: Page) {
  await page.route('**/api/academic/filters', route => route.fulfill({ json: { data: { universities: [
    { id: ids.university, _id: ids.university, name: 'Universidade original', courses: [] },
    { id: OTHER_INSTITUTION, _id: OTHER_INSTITUTION, name: 'Instituto comparado', courses: [] },
  ] } } }));
}

async function chooseInstitution(page: Page) {
  const main = page.getByRole('main');
  await main.getByRole('combobox', { name: 'Selecione uma Entidade', exact: true }).click();
  await page.getByRole('option', { name: 'Instituição', exact: true }).click();
  await main.getByRole('combobox', { name: 'Selecione a instituição', exact: true }).click();
  await page.getByRole('option', { name: 'Universidade original', exact: true }).click();
}

/** Desktop: the side panel; mobile: the drawer opened from the page header. */
async function openPanel(page: Page, mobile: boolean) {
  if (mobile) {
    await page.getByRole('button', { name: 'Comparação e gráficos' }).click();
    return page.getByRole('dialog', { name: 'Comparação e gráficos' });
  }
  const panel = page.getByRole('complementary', { name: 'Comparação e gráficos' });
  const toggle = panel.locator('[data-dashboard-panel-toggle]');
  await toggle.waitFor();
  if (await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  return panel;
}

test('painel: recolher em faixa de ícones, escolher gráficos e ir direto a um deles', async ({ page }, info) => {
  const mobile = info.project.name === 'mobile';
  await mockApi(page, 'admin');
  await page.goto('/dashboard');
  await chooseInstitution(page);
  const panel = await openPanel(page, mobile);
  await panel.getByRole('checkbox', { name: 'Tempo de Uso Diário' }).uncheck();
  await panel.getByRole('button', { name: 'Ir para Jornada de Aprendizagem' }).click();
  await expect(page.getByRole('region', { name: 'Jornada de Aprendizagem' })).toBeFocused();
  await expect(page.locator('#usage-chart')).toHaveCount(0);
  await audit(page, 'dashboard com painel');
  if (!mobile) {
    await panel.getByRole('button', { name: 'Recolher painel' }).click();
    await expect(panel.getByRole('button', { name: 'Expandir painel' })).toHaveAttribute('aria-expanded', 'false');
    await expect(panel.getByRole('button', { name: 'Comparação' })).toBeVisible();
    await audit(page, 'painel recolhido');
    await page.reload();
    const collapsed = page.getByRole('complementary', { name: 'Comparação e gráficos' });
    await collapsed.getByRole('button', { name: 'Comparação' }).click();
    await expect(collapsed.getByRole('checkbox', { name: /Comparar com outra seleção/ })).toBeFocused();
  }
});

test('comparação: só entidades do mesmo tipo, colunas A e B com a mesma altura', async ({ page }, info) => {
  const mobile = info.project.name === 'mobile';
  await mockApi(page, 'admin');
  await twoInstitutions(page);
  await page.goto('/dashboard');
  await chooseInstitution(page);
  const panel = await openPanel(page, mobile);
  await panel.getByRole('checkbox', { name: /Comparar com outra seleção/ }).check();
  await expect(panel.getByText('Comparar com outro(a) Instituição')).toBeVisible();
  await expect(panel.getByRole('combobox', { name: 'Selecione uma Entidade', exact: true })).toHaveCount(0);
  // The entity chosen in A is not offered again in B.
  await panel.getByRole('combobox', { name: 'Selecione a instituição', exact: true }).click();
  await expect(page.getByRole('option', { name: 'Universidade original', exact: true })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await panel.getByRole('combobox', { name: 'Selecione a instituição', exact: true }).click();
  await page.getByRole('option', { name: 'Instituto comparado', exact: true }).click();
  if (mobile) await panel.getByRole('button', { name: 'Fechar' }).click();
  await expect(page.locator('#usage-chart-a')).toBeVisible();
  await expect(page.locator('#usage-chart-b')).toBeVisible();
  await expect(page.locator('[data-comparison-header]')).toContainText('Seleção B · Instituição: Instituto comparado');
  await expect(page.getByRole('button', { name: 'Análise geral da seleção B' })).toBeVisible();
  // A, B and both together.
  let comparisonBody: any = null;
  await page.route('**/api/dashboard/insights/comparison', route => { comparisonBody = route.request().postDataJSON(); return route.fulfill({ json: { insight: '## Resumo da comparação\nA acerta mais em variáveis.', language: 'pt-BR', generatedAt: '2026-11-18T10:00:00Z', cached: false } }); });
  await page.getByRole('button', { name: 'Análise comparativa A × B' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Resumo da comparação');
  expect(comparisonBody.a.universityId).toBe(ids.university);
  expect(comparisonBody.b.universityId).toBe(OTHER_INSTITUTION);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  if (!mobile) {
    const heights = await Promise.all(['#correct-wrong-chart-a', '#correct-wrong-chart-b'].map(id => page.locator(id).evaluate(el => el.getBoundingClientRect().height)));
    expect(Math.abs(heights[0] - heights[1])).toBeLessThanOrEqual(1);
  }
  await audit(page, 'dashboard em comparação');

  // The A/B heading stays glued to the top edge of the scrolling area, with nothing showing above it.
  const header = page.locator('[data-comparison-header]');
  const area = page.getByRole('main');
  await area.evaluate(element => { element.scrollTop = 1500; });
  await expect.poll(async () => Math.abs((await header.boundingBox())!.y - (await area.boundingBox())!.y)).toBeLessThanOrEqual(1);
  expect(await header.evaluate(element => getComputedStyle(element).backgroundColor)).not.toMatch(/rgba\(.*, 0\.\d+\)$/);
});

test('o painel recolhe com transição suave, que some com movimento reduzido', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'No celular o painel é uma gaveta.');
  await mockApi(page, 'admin');
  await page.goto('/dashboard');
  const panel = await openPanel(page, false);
  const duration = () => panel.evaluate(element => parseFloat(getComputedStyle(element).transitionDuration));
  expect(await duration()).toBeGreaterThan(0);
  await panel.getByRole('button', { name: 'Recolher painel' }).click();
  await expect.poll(async () => (await panel.boundingBox())!.width).toBeLessThanOrEqual(65);
  await expect(panel.getByRole('checkbox', { name: 'Tempo de Uso Diário' })).toBeHidden();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await duration()).toBeLessThan(0.001);
});

test('a comparação some quando o admin a bloqueia', async ({ page }, info) => {
  await mockApi(page, 'professor');
  await page.route('**/api/features/me', route => route.fulfill({ json: { features: { dashboard: true, dashboard_comparison: false } } }));
  await page.goto('/dashboard');
  const panel = await openPanel(page, info.project.name === 'mobile');
  await expect(panel.getByRole('checkbox', { name: 'Tempo de Uso Diário' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: /Comparar com outra seleção/ })).toHaveCount(0);
});

test('o dashboard bloqueado mostra a página indisponível', async ({ page }) => {
  await mockApi(page, 'professor');
  await page.route('**/api/features/me', route => route.fulfill({ json: { features: { dashboard: false } } }));
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Funcionalidade indisponível' })).toBeVisible();
});

test('gráficos de comparação direta: diferença por assunto, radar sobreposto e distribuição', async ({ page }, info) => {
  const mobile = info.project.name === 'mobile';
  await mockApi(page, 'admin');
  const OTHER = OTHER_INSTITUTION;
  await twoInstitutions(page);
  // Each side gets its own answers, by the institution in the request.
  await page.route('**/api/dashboard/topic-performance', route => route.fulfill({ json: route.request().postDataJSON()?.universityId !== OTHER
    ? [{ topic: 'variaveis', successPercentage: 80, errorPercentage: 20 }, { topic: 'condicionais', successPercentage: 40, errorPercentage: 60 }]
    : [{ topic: 'variaveis', successPercentage: 60, errorPercentage: 40 }, { topic: 'condicionais', successPercentage: 70, errorPercentage: 30 }] }));
  await page.route('**/api/dashboard/proficiency-radar', route => route.fulfill({ json: { labels: ['variaveis', 'condicionais', 'lacos'], data: [70, 55, null] } }));
  await page.route('**/api/dashboard/effort-matrix', route => route.fulfill({ json: { points: [
    { name: 'x', performance: 15, effort: 1 }, { name: 'y', performance: 65, effort: 2 }, { name: 'z', performance: 92, effort: 3 }, { name: 'w', performance: null, effort: 1 },
  ], averages: { avgPerformance: 57, avgEffort: 2 } } }));
  await page.goto('/dashboard');
  await chooseInstitution(page);
  const panel = await openPanel(page, mobile);
  await panel.getByRole('checkbox', { name: /Comparar com outra seleção/ }).check();
  await panel.getByRole('combobox', { name: 'Selecione a instituição', exact: true }).click();
  await page.getByRole('option', { name: 'Instituto comparado', exact: true }).click();
  await expect(panel.getByRole('checkbox', { name: 'Diferença de acerto por assunto' })).toBeChecked();
  if (mobile) await panel.getByRole('button', { name: 'Fechar' }).click();

  const topics = page.getByRole('region', { name: 'Diferença de acerto por assunto' });
  await expect(topics.locator('.recharts-bar-rectangle rect')).toHaveCount(2);
  await topics.getByRole('button', { name: 'Ver dados em tabela' }).click();
  const table = topics.getByRole('table');
  await expect(table.getByRole('row').filter({ hasText: 'Condicionais' }).or(table.getByRole('row').filter({ hasText: 'condicionais' }))).toContainText('−30,0 p.p.');
  await expect(table.getByRole('row').filter({ hasText: /vari/i })).toContainText('+20,0 p.p.');

  const radar = page.getByRole('region', { name: 'Proficiência sobreposta' });
  await expect(radar.locator('.recharts-radar')).toHaveCount(2);
  const distribution = page.getByRole('region', { name: 'Distribuição do desempenho por aluno' });
  await expect(distribution).toContainText('3 avaliados');
  await audit(page, 'gráficos de comparação');
});

test('período: vale para os gráficos, agrupa por semana e a jornada mostra os últimos 10', async ({ page }) => {
  await mockApi(page, 'admin');
  const bodies: any[] = [];
  await page.route('**/api/logs/students/summary', route => {
    bodies.push(route.request().postDataJSON());
    const days = Array.from({ length: 60 }, (_item, index) => ({ date: new Date(Date.UTC(2026, 8, 1) + index * 86400000).toISOString().slice(0, 10), usage: 10, sessions: [] }));
    return route.fulfill({ json: { usageTimeInSeconds: 36000, dailyUsage: days, sessions: [] } });
  });
  await page.route('**/api/dashboard/learning-journey', route => route.fulfill({ json: { labels: Array.from({ length: 14 }, (_item, index) => `Quiz ${index + 1}`), data: Array.from({ length: 14 }, (_item, index) => 40 + index) } }));
  await page.goto('/dashboard');
  await chooseInstitution(page);

  const usage = page.locator('#usage-chart');
  await expect(usage).toContainText('Agrupado por semana');
  // 60 days from Tuesday 1 Sept fall into 9 weeks starting on Monday 31 Aug.
  await expect(usage.locator('.recharts-bar-rectangle')).toHaveCount(9);
  const journey = page.locator('#learning-journey-chart');
  await expect(journey).toContainText('Mostrando os últimos 10 de 14 quizzes.');
  await expect(journey.locator('.recharts-line-dot, .recharts-dot')).toHaveCount(10);
  await journey.getByRole('button', { name: 'Ver todos os 14' }).click();
  await expect(journey.locator('.recharts-line-dot, .recharts-dot')).toHaveCount(14);

  await page.getByRole('combobox', { name: 'Período', exact: true }).selectOption('7');
  await expect.poll(() => bodies.at(-1)?.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(bodies.at(-1).endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

  await page.getByRole('combobox', { name: 'Período', exact: true }).selectOption('custom');
  await page.getByLabel('De', { exact: true }).fill('2026-10-10');
  await page.getByLabel('Até', { exact: true }).fill('2026-10-01');
  await expect(page.getByRole('alert').filter({ hasText: 'A data final precisa ser igual ou posterior à inicial.' })).toBeVisible();
  await expect(page.getByLabel('Até', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await page.getByLabel('Até', { exact: true }).fill('2026-10-20');
  await expect.poll(() => bodies.at(-1)).toMatchObject({ startDate: '2026-10-10', endDate: '2026-10-20' });
  await audit(page, 'dashboard com período');
});

test('menu esquerdo recolhe em ícones com transição e o conteúdo ganha espaço', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'No celular o menu é uma gaveta.');
  await page.setViewportSize({ width: 1600, height: 900 });
  await mockApi(page, 'admin');
  await page.goto('/dashboard');
  const sidebar = page.locator('aside').first();
  const toggle = sidebar.getByRole('button', { name: 'Recolher menu' });
  const area = page.locator('main > div').first();
  const before = (await area.boundingBox())!.width;
  expect(await sidebar.locator('.side-rail').evaluate(element => parseFloat(getComputedStyle(element).transitionDuration))).toBeGreaterThan(0);
  await toggle.click();
  await expect(sidebar.getByRole('button', { name: 'Expandir menu' })).toHaveAttribute('aria-expanded', 'false');
  await expect.poll(async () => (await sidebar.boundingBox())!.width).toBeLessThanOrEqual(65);
  // Links keep their names (accessible name and tooltip) while only the icons show.
  const dashboard = sidebar.getByRole('link', { name: 'Dashboard' });
  await expect(dashboard).toHaveAttribute('title', 'Dashboard');
  await page.getByRole('complementary', { name: 'Comparação e gráficos' }).locator('[data-dashboard-panel-toggle]').waitFor();
  await expect.poll(async () => (await area.boundingBox())!.width).toBeGreaterThan(before);
  await audit(page, 'menu recolhido');
  await page.reload();
  await expect(page.locator('aside').first().getByRole('button', { name: 'Expandir menu' })).toBeVisible();
});

test('o cabeçalho A/B tem a mesma largura dos cartões', async ({ page }, info) => {
  const mobile = info.project.name === 'mobile';
  await mockApi(page, 'admin');
  await twoInstitutions(page);
  await page.goto('/dashboard');
  await chooseInstitution(page);
  const panel = await openPanel(page, mobile);
  await panel.getByRole('checkbox', { name: /Comparar com outra seleção/ }).check();
  await panel.getByRole('combobox', { name: 'Selecione a instituição', exact: true }).click();
  await page.getByRole('option', { name: 'Instituto comparado', exact: true }).click();
  if (mobile) await panel.getByRole('button', { name: 'Fechar' }).click();
  const header = (await page.locator('[data-comparison-header]').boundingBox())!;
  const card = (await page.getByRole('region', { name: 'Diferença de acerto por assunto' }).boundingBox())!;
  expect(Math.abs(header.x - card.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(header.width - card.width)).toBeLessThanOrEqual(1);
});

test('comparação: provas, chat, engajamento, maiores diferenças e análise por IA de cada gráfico', async ({ page }, info) => {
  const mobile = info.project.name === 'mobile';
  await mockApi(page, 'admin');
  const OTHER = OTHER_INSTITUTION;
  await twoInstitutions(page);
  const sideB = (route: { request(): { postDataJSON(): { universityId?: string } } }) => route.request().postDataJSON()?.universityId === OTHER;
  await page.route('**/api/dashboard/topic-performance', route => route.fulfill({ json: sideB(route)
    ? [{ topic: 'variaveis', successPercentage: 60, errorPercentage: 40 }] : [{ topic: 'variaveis', successPercentage: 75, errorPercentage: 25 }] }));
  await page.route('**/api/dashboard/compare/exams', route => route.fulfill({ json: sideB(route)
    ? { exams: [{ title: 'Prova B', releasedAt: '2026-11-10', expected: 20, submitted: 10, submissionRate: 0.5, averageGrade: 6.5 }], expected: 20, submitted: 10, submissionRate: 0.5, averageGrade: 6.5 }
    : { exams: [{ title: 'Prova A', releasedAt: '2026-11-09', expected: 10, submitted: 9, submissionRate: 0.9, averageGrade: 7.8 }], expected: 10, submitted: 9, submissionRate: 0.9, averageGrade: 7.8 } }));
  await page.route('**/api/dashboard/compare/engagement', route => route.fulfill({ json: sideB(route)
    ? { students: 20, averageActiveShare: 0.3, weeks: [{ week: '2026-11-02', activeStudents: 6, sessions: 9, minutes: 120, activeShare: 0.3 }, { week: '2026-11-09', activeStudents: 6, sessions: 7, minutes: 100, activeShare: 0.3 }] }
    : { students: 10, averageActiveShare: 0.65, weeks: [{ week: '2026-11-02', activeStudents: 6, sessions: 8, minutes: 90, activeShare: 0.6 }, { week: '2026-11-09', activeStudents: 7, sessions: 9, minutes: 110, activeShare: 0.7 }] } }));
  await page.route('**/api/dashboard/compare/chat-satisfaction', route => route.fulfill({ json: sideB(route)
    ? { available: false, reason: 'small', total: 3, minGroupSize: 5 }
    : { available: true, days: 365, disciplineIgnored: false, total: 10, up: 6, partial: 2, down: 2, score: 0.7, byTopic: [] } }));
  let insightBody: { chart?: string; a?: { universityId?: string }; b?: { universityId?: string } } = {};
  await page.route('**/api/dashboard/insights/comparison-chart', route => {
    insightBody = route.request().postDataJSON();
    return route.fulfill({ json: { insight: '## Principais diferenças\nA entrega mais provas.', language: 'pt-BR', generatedAt: '2026-11-19T10:00:00Z', cached: false } });
  });

  await page.goto('/dashboard');
  await chooseInstitution(page);
  const panel = await openPanel(page, mobile);
  await panel.getByRole('checkbox', { name: /Comparar com outra seleção/ }).check();
  await panel.getByRole('combobox', { name: 'Selecione a instituição', exact: true }).click();
  await page.getByRole('option', { name: 'Instituto comparado', exact: true }).click();
  for (const name of ['Maiores diferenças', 'Resultados das provas', 'Satisfação com o chat', 'Engajamento semanal'])
    await expect(panel.getByRole('checkbox', { name })).toBeChecked();
  if (mobile) await panel.getByRole('button', { name: 'Fechar' }).click();

  // Largest gaps first: submission rate (+40 p.p.), active students (+35 p.p.), subject (+15 p.p.), grade (+1.3).
  const highlights = page.getByRole('region', { name: 'Maiores diferenças' });
  await expect(highlights.getByRole('listitem')).toHaveCount(4);
  await expect(highlights.getByRole('listitem').first()).toContainText('Entrega das provas');
  await expect(highlights.getByRole('listitem').first()).toContainText('à frente por 40,0 p.p.');
  await expect(highlights).toContainText('1,3 ponto(s) na nota');

  const exams = page.getByRole('region', { name: 'Resultados das provas' });
  await expect(exams).toContainText('7,8');
  await expect(exams).toContainText('90%');
  await exams.getByRole('button', { name: 'Ver dados em tabela' }).click();
  await expect(exams.getByRole('table')).toContainText('9 de 10');

  const chat = page.getByRole('region', { name: 'Satisfação com o chat' });
  await expect(chat).toContainText('Satisfação: 70%');
  await expect(chat).toContainText('Menos de 5 avaliações no período: oculto.');

  const engagement = page.getByRole('region', { name: 'Engajamento semanal' });
  await expect(engagement.locator('.recharts-line')).toHaveCount(2);
  await expect(engagement).toContainText('10 alunos no grupo');
  await audit(page, 'comparação: provas, chat e engajamento');

  await exams.getByRole('button', { name: /Gerar insight de IA para Resultados das provas/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Resultados das provas');
  await expect(dialog).toContainText('A entrega mais provas.');
  expect(insightBody.chart).toBe('exam-results');
  expect(insightBody.a?.universityId).toBe(ids.university);
  expect(insightBody.b?.universityId).toBe(OTHER);
  await audit(page, 'análise por IA de um gráfico de comparação');
});

test('os botões de recolher do menu e do painel seguem o mesmo padrão', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'Menus laterais fixos do desktop.');
  await mockApi(page, 'admin');
  await page.goto('/dashboard');
  const left = page.locator('[data-sidebar-toggle]');
  const right = page.getByRole('complementary', { name: 'Comparação e gráficos' }).locator('[data-dashboard-panel-toggle]');
  await expect(left).toBeVisible();
  await expect(right).toBeVisible();
  const look = (locator: typeof left) => locator.evaluate((element) => {
    const style = getComputedStyle(element);
    const icon = element.querySelector('svg')!.getBoundingClientRect();
    return { width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height, color: style.color, radius: style.borderRadius, icon: [icon.width, icon.height] };
  });
  expect(await look(right)).toEqual(await look(left));
  // Mirrored: each one on the edge that faces the page content (menu on its right, panel on its left).
  const edges = (locator: typeof left) => locator.evaluate((element) => {
    const own = element.getBoundingClientRect();
    const box = element.parentElement!.getBoundingClientRect();
    return { left: own.left - box.left, right: box.right - own.right };
  });
  const menu = await edges(left);
  const panel = await edges(right);
  expect(menu.right).toBeLessThan(menu.left);
  expect(panel.left).toBeLessThan(panel.right);
  expect(Math.abs(menu.right - panel.left)).toBeLessThanOrEqual(4);
});
