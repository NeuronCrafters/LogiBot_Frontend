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

const scopes = { allowed: true, level: 'coordinator', institutions: [], courses: [{ id: ids.course, name: 'Curso original', institutionId: ids.university }],
  classes: [{ id: ids.class, name: 'Turma original', courseId: ids.course, courseName: 'Curso original', institutionId: ids.university }] };
const names = ['Ana Lima', 'Bruno Dias', 'Carla Souza', 'Diego Melo', 'Eva Rocha', 'Fábio Nunes'];
const board = {
  scope: 'course', id: ids.course, name: 'Curso original', since: '2026-10-20T12:00:00Z', minGroupSize: 5, groupLevel: 'class', hiddenGroups: 0,
  rules: { periodDays: 30, weights: { practice: 10, quiz: 5, exam: 10, flashcards: 2 }, studentNames: false },
  viewer: { level: 'coordinator', canConfigure: false },
  groups: [{ id: ids.class, name: 'Turma original', students: 6, averagePoints: 41.5, position: 1 }],
  students: names.map((name, index) => ({ position: index + 1, name, className: 'Turma original', points: 120 - index * 20, me: false,
    breakdown: { practice: 40 - index * 5, quiz: 30, exam: 40 - index * 10, flashcards: 10 - index } })),
};

for (const theme of ['dark', 'light']) {
  test(`coordenação: ranking do curso com regras, turmas e alunos (tema ${theme})`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem('logibot.preferences', JSON.stringify({ theme: value, motion: 'reduce' })), theme);
    await mockApi(page, 'course-coordinator');
    await page.route('**/api/ranking/scopes', route => route.fulfill({ json: scopes }));
    await page.route('**/api/ranking?**', route => route.fulfill({ json: board }));
    await page.goto('/ranking');
    await expect(page.getByRole('heading', { name: 'Como os pontos são calculados' })).toBeVisible();
    await expect(page.getByRole('table', { name: 'Alunos · Curso original' }).getByRole('row', { name: /Ana Lima/ })).toContainText('120');
    await expect(page.getByRole('table', { name: 'Turmas de Curso original' })).toContainText('41,5');
    await audit(page, `ranking ${theme}`);
  });
}

test('aluno: sem liberação do owner, o ranking não aparece no menu', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'Menu lateral fixo do desktop.');
  await mockApi(page, 'student');
  await page.route('**/api/ranking/scopes', route => route.fulfill({ json: { allowed: false, level: 'student', institutions: [], courses: [], classes: [] } }));
  await page.goto('/flashcards');
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Flash cards' })).toBeVisible();
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Ranking' })).toHaveCount(0);
});
