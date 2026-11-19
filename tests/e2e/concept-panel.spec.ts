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

const rate = (total: number, score: number | null) => ({ total, score });
const concept = (name: string, score: number) => ({ concept: name, ...rate(24, score), students: 6, practice: rate(18, score), exam: rate(6, 0.5), trend: [{ week: '2026-11-02', ...rate(10, 0.5) }, { week: '2026-11-09', ...rate(14, score) }] });

test('o professor vê os conceitos da turma, compara turmas e exporta', async ({ page }) => {
  await mockApi(page, 'teacher');
  await page.route('**/api/concepts/scopes', route => route.fulfill({ json: { me: false, all: false, institutions: [], courses: [], classes: [
    { id: 'c1', name: 'Turma A', courseId: 'k', courseName: 'Computação', institutionId: 'i', teaches: true },
    { id: 'c2', name: 'Turma B', courseId: 'k', courseName: 'Computação', institutionId: 'i', teaches: true },
  ] } }));
  await page.route('**/api/concepts/proficiency**', route => {
    const id = new URL(route.request().url()).searchParams.get('id');
    const first = id === 'c1';
    return route.fulfill({ json: {
      scope: 'class', id, days: 90, minGroupSize: 5, aggregated: false, hidden: 0,
      concepts: [concept('negation', first ? 0.9 : 0.6), concept('conditional', first ? 0.45 : 0.7), concept('selection', 0.8)],
      students: [{ id: 's1', name: 'Ana Souza', concepts: { negation: rate(4, 1), conditional: rate(4, 0.25) } }, { id: 's2', name: 'Bruno Lima', concepts: { negation: rate(4, 0.75) } }],
    } });
  });
  await page.goto('/concepts');
  await expect(page.getByRole('heading', { name: 'Painel por conceito', level: 1 })).toBeVisible();
  await expect(page.getByText('Condicional: 45% de acerto')).toBeAttached();
  await expect(page.getByRole('table', { name: 'Por aluno' }).getByRole('row', { name: /Ana Souza/ })).toContainText('25%');
  await page.getByText('Ver evolução por semana').first().click();
  await expect(page.getByRole('table', { name: 'Evolução semanal de Negação' })).toBeVisible();
  await audit(page, 'painel por conceito (professor)');

  // Colours follow the palette of the accessibility preferences, and each level has its own icon.
  await expect(page.getByText('75% ou mais: bom')).toBeVisible();
  const fill = () => page.locator('[class*="bg-chart-positive"]').first().evaluate((element) => getComputedStyle(element).backgroundColor);
  const before = await fill();
  for (const palette of ['redGreen', 'blueYellow', 'monochrome']) {
    await page.evaluate((name) => { document.documentElement.dataset.palette = name; }, palette);
    expect(await fill(), palette).not.toBe(before);
  }
  await page.evaluate(() => { document.documentElement.dataset.palette = 'default'; });

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar CSV' }).click();
  expect((await download).suggestedFilename()).toBe('painel-conceitos-class-90.csv');

  await page.getByLabel('Comparar com').selectOption({ label: 'Turma B · Computação' });
  await expect(page.getByText('Condicional na seleção B: 70% de acerto')).toBeAttached();
  await expect(page.getByRole('table', { name: 'Por aluno' })).toHaveCount(0);
  await audit(page, 'painel por conceito (comparação)');
});

test('o aluno vê só o próprio desempenho', async ({ page }) => {
  await mockApi(page, 'student');
  await page.route('**/api/concepts/scopes', route => route.fulfill({ json: { me: true, all: false, institutions: [], courses: [], classes: [] } }));
  let requested = '';
  await page.route('**/api/concepts/proficiency**', route => {
    requested = route.request().url();
    return route.fulfill({ json: { scope: 'me', id: '', days: 90, minGroupSize: 5, aggregated: false, hidden: 0, concepts: [concept('conjunction', 0.75)] } });
  });
  await page.goto('/concepts');
  await expect(page.getByText('Conjunção: 75% de acerto')).toBeAttached();
  expect(new URL(requested).searchParams.get('scope')).toBe('me');
  await expect(page.getByLabel('Comparar com')).toBeDisabled();
  await audit(page, 'painel por conceito (aluno)');
});
