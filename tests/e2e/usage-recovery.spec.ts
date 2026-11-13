import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockApi } from './fixtures';

test.use({ locale: 'pt-BR' });
test('recovered totals remain explicitly estimated in the usage chart and effort table', async ({ page }) => {
  await mockApi(page, 'admin');
  await page.route('**/api/logs/students/summary', route => route.fulfill({ json: {
    totalCorrectAnswers: 181, totalWrongAnswers: 159, usageTimeInSeconds: 87385,
    estimatedUsageTimeInSeconds: 87385, estimatedSessionCount: 22, undeterminedSessionCount: 1,
    dailyUsage: [{ date: '2026-08-28', usage: 87385 / 60 }], subjectCounts: { variaveis: 4 },
  } }));
  await page.route('**/api/dashboard/effort-matrix', route => route.fulfill({ json: {
    points: [{ name: 'Participante', effort: 60, performance: 80, effortEstimated: true }],
    averages: { avgPerformance: 80, avgEffort: 60 },
  } }));
  await page.goto('/dashboard');
  await page.getByRole('combobox', { name: 'Selecione uma Entidade', exact: true }).click();
  await page.getByRole('option', { name: 'Universidade', exact: true }).click();
  await page.getByRole('combobox', { name: 'Selecione a universidade', exact: true }).click();
  await page.getByRole('option', { name: 'Universidade original', exact: true }).click();
  const usage = page.locator('#usage-chart');
  await expect(usage).toContainText('1:00:16:25');
  await expect(usage).toContainText('Isso não mede o tempo ativo.');
  await expect(usage).toContainText('Há sessões sem duração recuperável.');
  await page.locator('#effort-matrix-chart').getByRole('button', { name: 'Ver dados em tabela' }).click();
  await expect(page.locator('#effort-matrix-chart').getByRole('table')).toContainText('Tempo estimado');
  const audit = await new AxeBuilder({ page }).include('#usage-chart').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(audit.violations.map(item => item.id)).toEqual([]);
});

test('the session table distinguishes an estimate from unavailable duration', async ({ page }) => {
  await mockApi(page, 'admin');
  await page.route('**/api/dashboard/session-details', route => route.fulfill({ json: [
    { startTime: '2026-08-28T10:00:00Z', endTime: '2026-08-28T11:00:00Z', durationSource: 'estimated' },
    { startTime: '2026-08-28T12:00:00Z', endTime: '2026-08-28T12:00:00Z', durationSource: 'unavailable' },
  ] }));
  await page.goto('/dashboard');
  const choose = async (placeholder: string, name: string) => {
    await page.getByRole('combobox', { name: placeholder, exact: true }).click();
    await page.getByRole('option', { name, exact: true }).click();
  };
  await choose('Selecione uma Entidade', 'Aluno');
  await choose('Selecione o Curso', 'Curso original');
  await choose('Selecione a Turma', 'Turma original');
  await choose('Selecione o aluno', 'João da Silva');
  const card = page.locator('#access-pattern-chart');
  await card.getByRole('button', { name: 'Ver dados em tabela' }).click();
  await expect(card.getByRole('table')).toContainText('Origem do tempo');
  await expect(card.getByRole('table')).toContainText('Tempo estimado');
  await expect(card.getByRole('table')).toContainText('Sem duração recuperável');
});
