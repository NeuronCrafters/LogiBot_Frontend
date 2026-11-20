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

const ID = '40000000-0000-4000-8000-000000000001';
type Level = 'student' | 'professor' | 'coordinator' | 'admin';
const WEEKS = ['2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26', '2026-11-02', '2026-11-09', '2026-11-16'];
/** Each profile receives its own part, as the API sends it. */
function pageData(level: Level) {
  const admin = level === 'admin';
  const header = {
    viewer: { level, canEdit: admin, canChangeStatus: false, canChangeComponents: false },
    components: { location: true, photo: true },
    institution: { id: ID, name: 'Faculdade Teste', kind: 'faculdade', city: 'Belém', state: 'PA', country: 'Brasil',
      address: 'Av. Exemplo', addressNumber: '100', district: 'Guamá', postalCode: '66000-000', latitude: -1.4558, longitude: -48.4902, website: 'https://teste.edu.br',
      links: [{ kind: 'instagram', url: 'https://instagram.com/faculdade.teste' }, { kind: 'blog', url: 'https://blog.teste.edu.br' }], about: 'Formação em computação.', logo: null, cover: null, active: true, deactivatedAt: null },
    minGroupSize: 5,
  };
  if (level === 'student') return {
    ...header,
    myClass: {
      id: 'k1', name: 'Turma A', course: 'Ciência da Computação',
      disciplines: [{ id: 'd1', name: 'Lógica de Programação', professors: ['Ana Souza'] }, { id: 'd2', name: 'Algoritmos', professors: [] }],
      classmates: ['Bruno Lima', 'Carla Dias', 'Diego Melo'],
    },
  };
  if (level === 'professor') return {
    ...header,
    teaching: {
      classes: [{ id: 'k1', name: 'Turma A', course: 'Ciência da Computação', students: 8 }, { id: 'k2', name: 'Turma B', course: 'Ciência da Computação', students: 6 }],
      disciplines: [
        { id: 'd1', name: 'Lógica de Programação', course: 'Ciência da Computação', classes: ['Turma A', 'Turma B'],
          students: [{ name: 'Bruno Lima', className: 'Turma A' }, { name: 'Carla Dias', className: 'Turma B' }], weeks: WEEKS.map((week, index) => ({ week, active: index })) },
        { id: 'd2', name: 'Algoritmos', course: 'Ciência da Computação', classes: ['Turma A'],
          students: [{ name: 'Bruno Lima', className: 'Turma A' }], weeks: WEEKS.map((week) => ({ week, active: 1 })) },
      ],
    },
  };
  return {
    ...header,
    counts: { courses: 2, classes: 3, disciplines: 2 },
    overview: {
      students: 18, activeShare: 0.61, activeChange: -2, quizAccuracy: 0.58, chatSatisfaction: admin ? 0.7 : null,
      weeks: WEEKS.map((week, index) => ({ week, active: 8 + index })),
      concepts: [{ concept: 'negation', score: 0.82, total: 30 }, { concept: 'conditional', score: 0.55, total: 40 }, { concept: 'biconditional', score: 0.41, total: 20 }],
    },
    courses: [
      { id: 'c1', name: 'Ciência da Computação', classes: 2, disciplines: 1, students: 14, activeShare: 0.64 },
      { id: 'c2', name: 'Sistemas de Informação', classes: 1, disciplines: 1, students: null, activeShare: null },
    ],
    classes: [
      { id: 'k1', name: 'Turma A', course: 'Ciência da Computação', students: 8, activeShare: 0.75, quizAccuracy: 0.66 },
      { id: 'k2', name: 'Turma B', course: 'Ciência da Computação', students: 6, activeShare: 0.5, quizAccuracy: 0.52 },
      { id: 'k3', name: 'Turma A', course: 'Sistemas de Informação', students: null, activeShare: null, quizAccuracy: null },
    ],
    disciplines: [{ id: 'd1', name: 'Lógica de Programação', course: 'Ciência da Computação', classes: 2, questions: 12, releasedExams: 1 }],
    team: { coordinators: 1, professors: 3, students: 18 },
  };
}

async function mockInstitution(page: Page, level: Level) {
  await page.route('**/api/institutions', route => route.fulfill({ json: [{ id: ID, name: 'Faculdade Teste', kind: 'faculdade', city: 'Belém', state: 'PA', logo: null, active: true, courses: 2, classes: 3 }] }));
  await page.route(`**/api/institutions/${ID}`, route => route.fulfill({ json: pageData(level) }));
}

for (const settings of [{ theme: 'dark', textSize: 'default' }, { theme: 'light', textSize: 'larger' }]) {
  test(`aluno: só a própria turma, acessível (tema ${settings.theme}, texto ${settings.textSize})`, async ({ page }) => {
    await page.addInitScript((prefs) => localStorage.setItem('logibot.preferences', JSON.stringify({ ...prefs, motion: 'reduce' })), settings);
    await mockApi(page, 'student');
    await mockInstitution(page, 'student');
    await page.goto('/institution');
    await expect(page.getByRole('heading', { name: 'Faculdade Teste', level: 1 })).toBeVisible();
    await expect(page.getByRole('tab')).toHaveText(['Minha turma', 'Colegas3']);
    await expect(page.getByText('Professor(a): Ana Souza')).toBeVisible();
    await expect(page.getByText('alunos', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Editar dados' })).toHaveCount(0);
    await audit(page, `aluno ${settings.theme}`);
    await page.getByRole('tab', { name: /Colegas/ }).click();
    await expect(page.getByRole('tabpanel')).toContainText('Carla Dias');
    await audit(page, `aluno colegas ${settings.theme}`);
  });
}

test('admin: turmas, tabela semanal e edição dos dados com acessibilidade', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('logibot.preferences', JSON.stringify({ motion: 'reduce' })));
  await mockApi(page, 'admin');
  await mockInstitution(page, 'admin');
  let saved: Record<string, unknown> | null = null;
  await page.route(`**/api/institutions/${ID}`, route => {
    if (route.request().method() === 'PUT') { saved = route.request().postDataJSON(); return route.fulfill({ json: { ok: true } }); }
    return route.fulfill({ json: pageData('admin') });
  });
  await page.goto('/institution');
  await expect(page.getByText('satisfação com o chat (30 dias)')).toBeVisible();
  await page.getByRole('button', { name: 'Ver em tabela' }).click();
  await expect(page.getByRole('table', { name: 'Alunos ativos por semana' })).toBeVisible();

  const overview = page.getByRole('tab', { name: 'Visão geral' });
  await overview.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: /Turmas/ })).toBeFocused();
  await expect(page.getByRole('table', { name: 'Turmas' }).getByRole('row', { name: /Sistemas/ })).toContainText('oculto');
  await audit(page, 'admin turmas');

  await page.getByRole('button', { name: 'Editar dados' }).click();
  const dialog = page.getByRole('dialog', { name: 'Dados da instituição' });
  await expect(dialog.getByRole('textbox', { name: /^Cidade/ })).toHaveValue('Belém');
  await dialog.getByRole('textbox', { name: /^Sobre a instituição/ }).fill('Nova descrição.');
  await audit(page, 'edição dos dados');
  await dialog.getByRole('button', { name: 'Salvar' }).click();
  await expect(dialog).toHaveCount(0);
  expect(saved).toMatchObject({ name: 'Faculdade Teste', about: 'Nova descrição.', kind: 'faculdade' });
});

test('gráfico semanal: dica ao passar o mouse ou tocar, e setas do teclado', async ({ page }, info) => {
  await page.addInitScript(() => localStorage.setItem('logibot.preferences', JSON.stringify({ motion: 'reduce' })));
  await mockApi(page, 'course-coordinator');
  await mockInstitution(page, 'coordinator');
  await page.goto('/institution');
  const chart = page.locator('.recharts-wrapper').first();
  await expect(chart).toBeVisible();
  const bars = chart.locator('.recharts-bar-rectangle');
  await expect(bars).toHaveCount(7);
  if (info.project.name === 'mobile') await bars.last().click(); else await bars.last().hover();
  await expect(page.getByText('Semana de 16/11 · semana atual')).toBeVisible();
  await expect(page.getByText('14 alunos ativos')).toBeVisible();
  await expect(page.getByText('78% dos alunos da instituição')).toBeVisible();
  // Keyboard: the chart takes focus and the arrows move between weeks with the same tip.
  await page.mouse.move(0, 0);
  await chart.locator('.recharts-surface').focus();
  await page.keyboard.press('ArrowRight');
  const tip = page.locator('[data-chart-tooltip]');
  await expect(tip).toContainText('alunos ativos');
  const first = await tip.textContent();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => tip.textContent()).not.toBe(first);
  await audit(page, 'gráfico semanal com dica');
});

test('admin: lista de instituições, busca e ida para a página escolhida', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('logibot.preferences', JSON.stringify({ motion: 'reduce' })));
  await mockApi(page, 'admin');
  const OTHER = '40000000-0000-4000-8000-000000000002';
  await page.route('**/api/institutions', route => route.fulfill({ json: [
    { id: ID, name: 'Faculdade Teste', kind: 'faculdade', city: 'Belém', state: 'PA', logo: null, active: true, courses: 2, classes: 3 },
    { id: OTHER, name: 'Escola Norte', kind: 'escola_tecnica', city: 'Marabá', state: 'PA', logo: null, active: false, courses: 1, classes: 1 },
  ] }));
  await page.route(`**/api/institutions/${ID}`, route => route.fulfill({ json: pageData('admin') }));
  await page.goto('/institution');
  await expect(page.getByRole('heading', { name: 'Instituições', level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: /Escola Norte/ })).toContainText('Desativada');
  await audit(page, 'lista de instituições');
  await page.getByRole('searchbox', { name: 'Buscar por nome ou cidade' }).fill('belém');
  await expect(page.getByRole('link', { name: /Faculdade Teste|Escola Norte/ })).toHaveCount(1);
  await page.getByRole('link', { name: /Faculdade Teste/ }).click();
  await expect(page.getByRole('heading', { name: 'Faculdade Teste', level: 1 })).toBeVisible();
  await page.getByRole('link', { name: 'Todas as instituições' }).click();
  await expect(page.getByRole('heading', { name: 'Instituições', level: 1 })).toBeVisible();
});

test('celular: as abas da instituição não acompanham a rolagem', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'Comportamento do celular.');
  await mockApi(page, 'course-coordinator');
  await mockInstitution(page, 'coordinator');
  await page.goto('/institution');
  const tabs = page.getByRole('tablist');
  const before = (await tabs.boundingBox())!.y;
  await page.locator('main').evaluate((main) => main.scrollBy(0, 400));
  await expect.poll(async () => (await tabs.boundingBox())!.y).toBeLessThan(before - 300);
});

for (const theme of ['dark', 'light']) {
  test(`localização: endereço em texto e mapa já carregado (tema ${theme})`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem('logibot.preferences', JSON.stringify({ theme: value, motion: 'reduce' })), theme);
    const external: string[] = [];
    await page.route('https://www.openstreetmap.org/**', route => { external.push(route.request().url()); return route.fulfill({ contentType: 'text/html', body: '<html><body>mapa</body></html>' }); });
    await mockApi(page, 'student');
    await mockInstitution(page, 'student');
    await page.goto('/institution');
    const card = page.getByRole('region', { name: 'Localização' });
    await expect(card).toContainText('Av. Exemplo, 100');
    await card.scrollIntoViewIfNeeded();
    await expect(card.locator('iframe')).toHaveAttribute('title', 'Mapa com a localização de Faculdade Teste');
    await expect.poll(() => external.length).toBeGreaterThan(0);
    await audit(page, `localização ${theme}`);
  });
}

test('owner: liga e desliga localização e foto de perfil da instituição', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('logibot.preferences', JSON.stringify({ theme: 'light', motion: 'reduce' })));
  await mockApi(page, 'admin');
  let components = { location: true, photo: true };
  const rules: unknown[] = [];
  await page.route('**/api/institutions', route => route.fulfill({ json: [{ id: ID, name: 'Faculdade Teste', kind: 'faculdade', city: 'Belém', state: 'PA', logo: null, active: true, courses: 2, classes: 3 }] }));
  await page.route(`**/api/institutions/${ID}`, route => route.fulfill({ json: { ...pageData('admin'), components, viewer: { level: 'admin', canEdit: true, canChangeStatus: true, canChangeComponents: true } } }));
  await page.route('**/api/features/rules', route => {
    const body = route.request().postDataJSON();
    rules.push(body);
    components = { ...components, [body.feature === 'institution_photo' ? 'photo' : 'location']: body.enabled };
    return route.fulfill({ json: { ...body, id: 'r1', updatedAt: new Date().toISOString() } });
  });
  await page.goto('/institution');
  const section = page.getByRole('region', { name: 'Componentes da página' });
  await expect(section.getByRole('switch', { name: 'Foto de perfil' })).toHaveAttribute('aria-checked', 'true');
  await audit(page, 'chaves do owner');
  await section.getByRole('switch', { name: 'Foto de perfil' }).click();
  await expect(section.getByRole('switch', { name: 'Foto de perfil' })).toHaveAttribute('aria-checked', 'false');
  expect(rules).toEqual([{ feature: 'institution_photo', scope: 'institution', scopeId: ID, enabled: false }]);
  await page.getByRole('button', { name: 'Editar dados' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('group', { name: 'Localização' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Adicionar link' }).click();
  await expect(dialog.getByRole('textbox', { name: /^Endereço do link 3/ })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Redes e outros sites' }).getByRole('link')).toHaveCount(2);
  await audit(page, 'edição com ponto no mapa');
});

test('instituição desativada: a sessão aberta termina e a entrada explica o motivo', async ({ page }) => {
  await mockApi(page, 'student');
  await page.route('**/api/institutions', route => route.fulfill({ status: 403, json: { code: 'auth.institutionInactive', message: 'O acesso da sua instituição está suspenso. Procure a coordenação.' } }));
  await page.goto('/institution');
  await expect(page).toHaveURL(/\/signin\?inactive=1/);
  await expect(page.getByRole('status').filter({ hasText: 'O acesso da sua instituição está suspenso' })).toBeVisible();
  await audit(page, 'entrada com instituição desativada');
});

test('coordenação: números dos seus cursos, sem satisfação com o chat e sem edição', async ({ page }) => {
  await mockApi(page, 'course-coordinator');
  await mockInstitution(page, 'coordinator');
  await page.goto('/institution');
  await expect(page.getByRole('tab', { name: 'Visão geral' })).toBeVisible();
  await expect(page.getByText('satisfação com o chat (30 dias)')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Editar dados' })).toHaveCount(0);
});

for (const theme of ['dark', 'light']) {
  test(`professor: suas turmas, alunos por disciplina e atividade semanal (tema ${theme})`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem('logibot.preferences', JSON.stringify({ theme: value, motion: 'reduce' })), theme);
    await mockApi(page, 'teacher');
    await mockInstitution(page, 'professor');
    await page.goto('/institution');
    await expect(page.getByRole('tab')).toHaveText(['Minhas turmas', 'Alunos2']);
    await expect(page.getByRole('heading', { name: 'Alunos ativos por semana · Lógica de Programação' })).toBeVisible();
    await page.getByLabel('Disciplina').selectOption({ label: 'Algoritmos · Ciência da Computação' });
    await expect(page.getByRole('heading', { name: 'Alunos ativos por semana · Algoritmos' })).toBeVisible();
    await expect(page.getByText('Visão geral')).toHaveCount(0);
    await audit(page, `professor ${theme}`);
    await page.getByRole('tab', { name: /Alunos/ }).click();
    await expect(page.getByRole('table', { name: 'Alunos de Lógica de Programação' })).toContainText('Carla Dias');
    await audit(page, `professor alunos ${theme}`);
  });
}

test('admin: escolhe a capa, ajusta o enquadramento e salva a imagem redesenhada', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('logibot.preferences', JSON.stringify({ motion: 'reduce' })));
  await mockApi(page, 'admin');
  await mockInstitution(page, 'admin');
  let sent: string | null = null;
  await page.route(`**/api/institutions/${ID}/cover`, route => { sent = route.request().postDataJSON().image; return route.fulfill({ json: { ok: true } }); });
  await page.goto('/institution');
  await page.getByRole('button', { name: 'Foto e capa' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Capa', { exact: true }).setInputFiles({ name: 'capa.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAICAIAAAB/FOjAAAAA5UlEQVR4nBXOIbWFQBRA0ZuACCS4ajQJiIAYNYIIJCDCTkAEEqBGkwQ96r9//F7rRIQ5LGELRxDu8IYvTCHDGvZwhis8IaKYi6XYiqNQ3MVbfMVUZLEWe3EWV/GUH2jmZmm25mg0d/M2XzM12azN3pzN1TztB5hZ2Dj8d/PyMZGs7JxcPL/l6OZu6bbu6HR393ZfN3XZrd3end3VPf0HhnlYhm04BsM9vMM3TEMO67AP53ANz/iBNKclbenI/4k7velLU8q0pj2d6UpP/kA1V0u1VUeluqu3+qqpymqt9uqsruqp/gCbcbsBqMKI7gAAAABJRU5ErkJggg==', 'base64') });
  const frame = dialog.getByRole('group', { name: 'Enquadramento da capa' });
  await expect(frame).toBeVisible();
  await audit(page, 'enquadramento da capa');
  await dialog.getByLabel('Zoom').fill('2');
  await frame.focus();
  await page.keyboard.press('ArrowRight');
  await dialog.getByRole('button', { name: 'Salvar' }).click();
  await expect(dialog).toHaveCount(0);
  expect(sent).toMatch(/^data:image\/(webp|png|jpeg);base64,/);
  const size = await page.evaluate((src) => new Promise<number[]>((resolve) => { const image = new Image(); image.onload = () => resolve([image.naturalWidth, image.naturalHeight]); image.src = src; }), sent!);
  expect(size).toEqual([1600, 400]);
});
