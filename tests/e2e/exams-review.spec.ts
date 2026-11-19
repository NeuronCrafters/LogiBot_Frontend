import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockApi, selectLanguage } from './fixtures';

test.use({ locale: 'pt-BR' });

/** Professor side after the exam closed: anonymous grading, release and results, in memory. */
async function mockGrading(page: Page) {
  const state = { released: false };
  const items: Record<string, { id: string; code: string; text: string; score: number | null; comment: string }[]> = {
    eq1: [{ id: '10000000-0000-4000-8000-0000000000b1', code: 'QK7M2', text: 'Só é falso quando o antecedente é verdadeiro e o consequente falso.', score: null, comment: '' },
      { id: '10000000-0000-4000-8000-0000000000b2', code: 'ZP4TX', text: '', score: null, comment: '' }],
  };
  const review = () => {
    const all = Object.values(items).flat();
    return { examId: 'e1', title: 'Prova de Lógica', released: state.released, reviewed: all.filter(item => item.score !== null).length, total: all.length,
      questions: [{ examQuestionId: 'eq1', position: 2, statement: 'Explique o condicional.', language: 'pt-BR', criteria: 'Citar quando é falso.', weight: 2, items: items.eq1 }] };
  };
  const detail = () => ({ id: 'e1', title: 'Prova de Lógica', instructions: null, disciplineId: 'd', disciplineName: 'Lógica original', classId: null, shuffle: false,
    state: state.released ? 'released' : 'closed', opensAt: null, closesAt: null, timeLimitMinutes: 50, publishedAt: null, closedAt: null, audience: 3,
    submitted: 2, inProgress: 0, totalWeight: 3, questions: [{ questionId: 'b1', type: 'quiz', statement: 'Quanto vale p → q?', weight: 1, version: 1 }, { questionId: 'b2', type: 'essay', statement: 'Explique o condicional.', weight: 2, version: 1 }] });
  await page.route('**/api/exams/manage**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/^\/api/, '');
    if (path === '/exams/manage/e1/blind-review') return route.fulfill({ json: review() });
    const save = /^\/exams\/manage\/blind-review\/(.+)$/.exec(path);
    if (save) {
      const item = Object.values(items).flat().find(entry => entry.id === save[1])!;
      const body = request.postDataJSON();
      Object.assign(item, { score: body.score, comment: body.comment.trim() });
      return route.fulfill({ json: item });
    }
    if (path === '/exams/manage/e1/release') {
      if (review().reviewed < review().total) return route.fulfill({ status: 409, json: { code: 'exams.reviewsPending', message: 'Ainda há respostas dissertativas sem correção' } });
      state.released = true;
      return route.fulfill({ json: { examId: 'e1', released: true, submissions: 2 } });
    }
    if (path === '/exams/manage/e1/results') return route.fulfill({ json: { examId: 'e1', title: 'Prova de Lógica', releasedAt: '2026-11-17T12:00:00Z', rows: [
      { studentId: 's1', name: 'Ana Souza', status: 'submitted', objectiveCorrect: 1, objectiveTotal: 1, essayPoints: 1, essayTotal: 1, grade: 10, durationMs: 1800000, submittedAt: '', submitReason: 'student' },
      { studentId: 's2', name: 'Bruno Lima', status: 'submitted', objectiveCorrect: 0, objectiveTotal: 1, essayPoints: 0, essayTotal: 1, grade: 0, durationMs: 600000, submittedAt: '', submitReason: 'time_limit' },
      { studentId: 's3', name: 'Carla Dias', status: 'missed', objectiveCorrect: 0, objectiveTotal: 1, essayPoints: 0, essayTotal: 1, grade: null, durationMs: null, submittedAt: null, submitReason: null },
    ] } });
    if (path === '/exams/manage/e1') return route.fulfill({ json: detail() });
    return route.fulfill({ json: [] });
  });
}

async function audit(page: Page, label: string) {
  await page.evaluate(() => Promise.allSettled(document.getAnimations()
    .filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity)
    .map(animation => animation.finished)));
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })), label).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2 && document.documentElement.scrollHeight <= innerHeight + 1), `${label}: sem rolagem da janela`).toBeTruthy();
}

for (const language of ['pt-BR', 'en-US', 'es-ES']) {
  test(`correção cega e resultados acessíveis em ${language}`, async ({ page }) => {
    await mockApi(page, 'professor');
    await mockGrading(page);
    await page.goto('/exams/manage/e1/review');
    await selectLanguage(page, language);
    await expect(page.getByRole('progressbar')).toBeVisible();
    await audit(page, `${language}: correção`);
    await page.goto('/exams/manage/e1/results');
    await expect(page.getByRole('table')).toBeVisible();
    await audit(page, `${language}: resultados`);
  });
}

test('correção cega pelo teclado, liberação e resultados', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'Teclado físico no desktop.');
  await mockApi(page, 'professor');
  await mockGrading(page);
  await page.goto('/exams/manage/e1');
  await page.getByRole('button', { name: 'Liberar resultados' }).click();
  await page.getByRole('dialog', { name: 'Liberar os resultados?' }).getByRole('button', { name: 'Liberar resultados' }).click();
  await expect(page.getByText('Ainda há respostas dissertativas sem correção')).toBeVisible();

  await page.getByRole('link', { name: 'Correção cega' }).click();
  await expect(page.getByRole('progressbar', { name: '0 de 2 respostas corrigidas' })).toBeVisible();
  const first = page.getByRole('article', { name: 'Resposta #QK7M2' });
  await expect(first).not.toContainText('Ana');
  await first.getByRole('radio', { name: 'Correta (1)' }).focus();
  await page.keyboard.press('Space');
  await first.getByLabel('Comentário para o aluno (opcional)').fill('Muito bem.');
  await first.getByRole('button', { name: 'Salvar correção' }).click();
  await expect(first.getByText('Correção salva.')).toBeVisible();
  await page.getByRole('button', { name: 'Ir para a próxima pendente' }).click();
  const blank = page.getByRole('article', { name: 'Resposta #ZP4TX' });
  await expect(blank).toBeFocused();
  await expect(blank).toContainText('(resposta em branco)');
  await blank.getByRole('radio', { name: 'Errada (0)' }).check();
  await blank.getByRole('button', { name: 'Salvar correção' }).click();
  await expect(page.getByText('Todas as respostas foram corrigidas. Você já pode liberar os resultados.')).toBeVisible();

  await page.getByRole('link', { name: 'Prova de Lógica' }).click();
  await page.getByRole('button', { name: 'Liberar resultados' }).click();
  await page.getByRole('dialog', { name: 'Liberar os resultados?' }).getByRole('button', { name: 'Liberar resultados' }).click();
  await page.getByRole('link', { name: 'Ver resultados' }).click();
  const table = page.getByRole('table', { name: 'Resultados por aluno' });
  await expect(table.getByRole('row', { name: /Carla Dias/ })).toContainText('Não entregue');
  await expect(page.getByText('Média das entregas: 5,0')).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar CSV' }).click();
  expect((await download).suggestedFilename()).toBe('Prova de Lógica.csv');

  await page.goto('/exams/manage/e1/review');
  await expect(page.getByText('Os resultados foram liberados: a correção está travada.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Salvar correção' })).toHaveCount(0);
});

test('correção cega no celular com texto ampliado', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.addInitScript(() => localStorage.setItem('logibot.preferences', JSON.stringify({ textSize: 'larger', theme: 'dark', motion: 'reduce' })));
  await mockApi(page, 'professor');
  await mockGrading(page);
  await page.goto('/exams/manage/e1/review');
  for (const radio of await page.getByRole('radio').all()) expect((await radio.locator('xpath=..').boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await audit(page, 'correção 320px');
});

test('o aluno vê a nota, o resultado de cada questão e os comentários', async ({ page }) => {
  await mockApi(page, 'student');
  await page.route('**/api/exams/**', route => route.fulfill({ json: new URL(route.request().url()).pathname.endsWith('/student')
    ? [{ id: 'e1', title: 'Prova de Lógica', disciplineName: 'Lógica original', opensAt: null, closesAt: null, timeLimitMinutes: 50, questionCount: 2, status: 'released', startedAt: null, submittedAt: null, deadlineAt: null, grade: 7.5 }]
    : { examId: 'e1', title: 'Prova de Lógica', status: 'released', grade: 7.5, submittedAt: '2026-11-17T10:00:00Z', submitReason: 'student', totalWeight: 3, questions: [
      { position: 1, type: 'quiz', statement: 'Quanto vale p → q?', language: 'pt-BR', weight: 1, outcome: 'correct', points: 1, comment: '' },
      { position: 2, type: 'essay', statement: 'Explique o condicional.', language: 'pt-BR', weight: 2, outcome: 'partial', points: 1, comment: 'Faltou um exemplo.' },
    ] } }));
  await page.goto('/exams');
  await expect(page.getByRole('article', { name: 'Prova de Lógica' })).toContainText('Nota 7,5');
  await page.getByRole('link', { name: 'Ver: Prova de Lógica' }).click();
  await expect(page.getByText('Sua nota: 7,5 de 10')).toBeVisible();
  await expect(page.getByRole('article', { name: 'Questão 2' })).toContainText('Faltou um exemplo.');
  await audit(page, 'resultado do aluno');
});
