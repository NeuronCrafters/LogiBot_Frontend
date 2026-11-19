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

const other = '00000000-0000-4000-8000-0000000000aa';
const at = (index: number) => new Date(Date.UTC(2026, 10, 17, 12) - index * 3600000).toISOString();
// 14 from a student of the original class, 6 from a professor of the same institution, 10 from another institution.
const feedbacks = Array.from({ length: 30 }, (_item, index) => {
  const base = { id: `fb-${index}`, type: index % 3 === 0 ? 'BUG' : 'SUGESTAO', message: `Mensagem ${index + 1}`, createdAt: at(index) };
  if (index < 14) return { ...base, authorName: `Aluno ${index + 1}`, authorEmail: `aluno${index}@example.invalid`, schoolId: ids.university, schoolName: 'Universidade original', courseId: ids.course, courseName: 'Curso original', classId: ids.class, className: 'Turma original' };
  if (index < 20) return { ...base, authorName: `Professora ${index + 1}`, authorEmail: `prof${index}@example.invalid`, schoolId: ids.university, schoolName: 'Universidade original', courseId: null, courseName: null, classId: null, className: null };
  return { ...base, authorName: `Pessoa ${index + 1}`, authorEmail: `pessoa${index}@example.invalid`, schoolId: other, schoolName: 'Outra instituição', courseId: null, courseName: null, classId: null, className: null };
});
feedbacks[0].message = 'Mensagem 1\n'.repeat(12) + 'Final da mensagem completa.';

test('o admin pagina, filtra por entidades e abre os detalhes do feedback', async ({ page }) => {
  await mockApi(page, 'admin');
  await page.route('**/api/feedback', route => route.fulfill({ json: feedbacks }));
  await page.goto('/admin/feedbacks');
  await expect(page.getByRole('heading', { name: 'Feedbacks dos Alunos' })).toBeVisible();

  const cards = page.getByRole('button', { name: /^Ver detalhes do feedback de / });
  await expect(cards).toHaveCount(12);
  await expect(page.getByText('Mostrando 1–12 de 30')).toBeVisible();
  await audit(page, 'feedbacks (lista)');

  const pagination = page.getByRole('navigation', { name: 'Paginação dos feedbacks' });
  await pagination.getByRole('button', { name: 'Próxima' }).click();
  await expect(page.getByText('Mostrando 13–24 de 30')).toBeVisible();
  await expect(page.getByRole('article').first()).toContainText('Mensagem 13');
  await page.getByLabel('Por página').selectOption('24');
  await expect(page.getByText('Mostrando 1–24 de 30')).toBeVisible();

  // Institution → course → class; professors only match the institution.
  await page.getByLabel('Instituição', { exact: true }).selectOption({ label: 'Universidade original' });
  await expect(page.getByText('Mostrando 1–20 de 20')).toBeVisible();
  await page.getByLabel('Curso', { exact: true }).selectOption({ label: 'Curso original' });
  await expect(page.getByText('Mostrando 1–14 de 14')).toBeVisible();
  await page.getByLabel('Turma', { exact: true }).selectOption({ label: 'Turma original' });
  await expect(page.getByText('Mostrando 1–14 de 14')).toBeVisible();
  await expect(pagination).toHaveCount(0);

  // Combined with the type: 5 bugs among the 14 messages of the class (indexes 0, 3, 6, 9, 12).
  await page.getByRole('button', { name: /^Bug/ }).click();
  await expect(page.getByRole('button', { name: /^Bug/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Mostrando 1–5 de 5')).toBeVisible();
  await page.getByLabel('Buscar por mensagem ou aluno...').fill('nada disso');
  await page.getByRole('button', { name: 'Limpar filtros' }).click();
  await expect(page.getByText('Mostrando 1–24 de 30')).toBeVisible();

  // Clicking anywhere on the card opens the details, not just the button.
  await page.getByRole('article').first().click();
  const dialog = page.getByRole('dialog', { name: 'Detalhes do feedback' });
  await expect(dialog).toContainText('Final da mensagem completa.');
  await expect(dialog).toContainText('aluno0@example.invalid');
  await expect(dialog).toContainText('Universidade original');
  await expect(dialog).toContainText('Curso original');
  await expect(dialog).toContainText('Turma original');
  await audit(page, 'detalhes do feedback');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(cards.first()).toBeFocused();
});
