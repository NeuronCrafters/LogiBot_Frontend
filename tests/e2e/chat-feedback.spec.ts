import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockApi } from './fixtures';

test.use({ locale: 'pt-BR' });
const ANSWER = '20000000-0000-4000-8000-000000000001';

async function audit(page: Page, label: string) {
  await page.evaluate(() => Promise.allSettled(document.getAnimations()
    .filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity)
    .map(animation => animation.finished)));
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })), label).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), `${label}: largura`).toBeTruthy();
}

test('o aluno avalia a resposta do chat com sim, mais ou menos ou não', async ({ page }) => {
  await mockApi(page, 'student');
  const saved: any[] = [];
  await page.route('**/api/chat/sessions/*/*/messages', route => route.fulfill({ json: [
    { id: '10000000-0000-4000-8000-000000000001', role: 'user', content: 'O que é p → q?' },
    { id: ANSWER, role: 'assistant', content: 'É o condicional: só é falso quando p é verdadeiro e q é falso.' },
  ] }));
  await page.route('**/api/chat-feedback/**', async route => {
    const request = route.request();
    if (request.method() === 'GET') return route.fulfill({ json: [] });
    const body = request.postDataJSON();
    saved.push(body);
    return route.fulfill({ json: { messageId: ANSWER, rating: body.rating, reason: body.reason ?? null, comment: body.comment ?? null } });
  });
  await page.goto('/chat?session=feedback');
  const group = page.getByRole('group', { name: 'Esta resposta ajudou?' });
  await expect(group).toBeVisible();
  for (const button of await group.getByRole('button').all()) expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(32);
  await group.getByRole('button', { name: 'Mais ou menos' }).click();
  await expect(group.getByRole('button', { name: 'Mais ou menos' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('radio', { name: 'Difícil de entender' }).check();
  await page.getByLabel(/^Comentário/).fill('Poderia ter um exemplo.');
  await audit(page, 'chat com avaliação aberta');
  await page.getByRole('button', { name: 'Enviar avaliação' }).click();
  await expect.poll(() => saved.at(-1)).toEqual({ rating: 'partial', reason: 'unclear', comment: 'Poderia ter um exemplo.' });
  await expect(page.getByRole('radio', { name: 'Difícil de entender' })).toHaveCount(0);
  await expect(group).toContainText('Avaliação registrada');
  for (const button of await group.getByRole('button').all()) await expect(button).toBeDisabled();
  expect(saved).toHaveLength(1);
});

test('o admin vê a satisfação agregada sem identificar pessoas', async ({ page }) => {
  await mockApi(page, 'admin');
  await page.route('**/api/chat-feedback/summary**', route => route.fulfill({ json: {
    days: 30, minGroupSize: 5, total: 12, up: 7, partial: 3, down: 2, score: 8.5 / 12, reasons: { unclear: 3, none: 2 },
    byRole: { groups: [{ key: 'student', up: 6, partial: 3, down: 1, total: 10, score: 0.75 }], hidden: 2 },
    byCourse: { groups: [{ key: 'Ciência da Computação', up: 6, partial: 3, down: 1, total: 10, score: 0.75 }], hidden: 2 },
    byTopic: { groups: [], hidden: 12 },
    byLanguage: { groups: [{ key: 'pt-BR', up: 7, partial: 3, down: 2, total: 12, score: 8.5 / 12 }], hidden: 0 },
    recentNotUseful: [{ rating: 'partial', question: 'O que é p → q?', answer: 'É o **condicional**: só é falso quando p é V e q é F.', reason: 'unclear', comment: 'Faltou exemplo', topic: 'condicionais', language: 'pt-BR', ratedAt: '2026-11-17T10:00:00Z' }],
  } }));
  // Paginated list: 8 answers, 6 per page by default.
  const all = Array.from({ length: 8 }, (_item, index) => index === 0
    ? { rating: 'partial', question: 'O que é p → q?', answer: 'É o **condicional**: só é falso quando p é V e q é F.', reason: 'unclear', comment: 'Faltou exemplo', topic: 'condicionais', language: 'pt-BR', ratedAt: '2026-11-17T10:00:00Z' }
    : { rating: index % 2 ? 'down' : 'partial', question: `Pergunta ${index + 1}`, answer: 'Resposta', reason: null, comment: null, topic: null, language: 'pt-BR', ratedAt: '2026-11-16T10:00:00Z' });
  const pages: string[] = [];
  await page.route('**/api/chat-feedback/not-useful**', route => {
    const url = new URL(route.request().url());
    pages.push(url.search);
    const size = Number(url.searchParams.get('pageSize'));
    const rating = url.searchParams.get('rating');
    const list = rating ? all.filter(item => item.rating === rating) : all;
    const totalPages = Math.max(1, Math.ceil(list.length / size));
    const current = Math.min(Number(url.searchParams.get('page')), totalPages);
    return route.fulfill({ json: { items: list.slice((current - 1) * size, current * size), total: list.length, page: current, pageSize: size, totalPages } });
  });
  await page.goto('/admin/chat-feedback');
  await expect(page.getByRole('heading', { name: 'Avaliações das respostas do chat' })).toBeVisible();
  await expect(page.getByText('71%').first()).toBeVisible();
  await expect(page.getByRole('table', { name: 'Por perfil' }).getByRole('row', { name: /Alunos/ })).toContainText('75%');
  await expect(page.getByText('2 avaliações em grupos pequenos não foram exibidas.').first()).toBeVisible();
  const item = page.getByRole('article', { name: 'Avaliação 1' });
  await expect(item).toContainText('Faltou exemplo');
  await expect(item).toContainText('Motivo: Difícil de entender');
  await audit(page, 'avaliações do chat (admin)');
  await item.getByRole('button', { name: 'Ver a resposta do assistente' }).click();
  const dialog = page.getByRole('dialog', { name: 'Pergunta e resposta avaliadas' });
  await expect(dialog.locator('strong, b').first()).toBeVisible();
  await expect(dialog.getByRole('figure', { name: 'Comentário de quem avaliou' })).toContainText('Faltou exemplo');
  await audit(page, 'modal da resposta avaliada');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);

  await expect(page.getByText('Mostrando 1–6 de 8')).toBeVisible();
  await expect(page.getByRole('article', { name: /^Avaliação \d+$/ })).toHaveCount(6);
  const pagination = page.getByRole('navigation', { name: 'Paginação das respostas avaliadas' });
  await pagination.getByRole('button', { name: 'Próxima' }).click();
  await expect(page.getByText('Mostrando 7–8 de 8')).toBeVisible();
  await expect(page.getByRole('article', { name: 'Avaliação 7' })).toContainText('Pergunta 7');
  await expect(pagination.getByRole('button', { name: 'Próxima' })).toBeDisabled();
  await audit(page, 'segunda página das avaliações');
  await page.getByLabel('Por página').selectOption('12');
  await expect(page.getByText('Mostrando 1–8 de 8')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Paginação das respostas avaliadas' })).toHaveCount(0);
  await page.getByLabel('Avaliação', { exact: true }).selectOption({ label: 'Não' });
  await expect(page.getByText('Mostrando 1–4 de 4')).toBeVisible();
  expect(pages.at(-1)).toContain('rating=down');

  let requested = '';
  await page.route('**/api/chat-feedback/summary**', route => { requested = route.request().url(); return route.fallback(); });
  await page.getByLabel('Instituição', { exact: true }).selectOption({ label: 'Universidade original' });
  await page.getByLabel('Curso', { exact: true }).selectOption({ label: 'Curso original' });
  await expect.poll(() => requested).toContain('courseId=');
  expect(requested).toContain('institutionId=');
});
