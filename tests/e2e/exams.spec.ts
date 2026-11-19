import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ids, mockApi, selectLanguage } from './fixtures';

test.use({ locale: 'pt-BR' });

const QUESTIONS = [
  { id: 'eq-1', type: 'quiz', statement: 'Quanto vale p → q com p = V e q = F?', language: 'pt-BR', weight: 1, content: { options: ['V', 'F'] } },
  { id: 'eq-2', type: 'truth_table', statement: 'Complete a tabela-verdade.', language: 'pt-BR', weight: 1, content: { formula: 'p → q' } },
  { id: 'eq-3', type: 'translation', statement: 'Se chove, a rua fica molhada.', language: 'pt-BR', weight: 1, content: { legend: [{ letter: 'p', text: 'chove' }, { letter: 'q', text: 'a rua fica molhada' }] } },
  { id: 'eq-4', type: 'parsons', statement: 'Escreva n se for positivo.', language: 'pt-BR', weight: 1, content: { lines: [{ id: 'k7', text: 'fimse' }, { id: 'k2', text: 'se n > 0 então' }, { id: 'k9', text: 'escreva(n)' }] } },
  { id: 'eq-5', type: 'essay', statement: 'Explique o condicional.', language: 'pt-BR', weight: 2, content: {} },
];

/** Student side of the exam API, kept in memory. */
async function mockStudentExam(page: Page, options: { deadlineInMs?: number | null } = {}) {
  const calls: { drafts: any[]; submits: any[] } = { drafts: [], submits: [] };
  let state: 'not_started' | 'in_progress' | 'submitted' = 'not_started';
  const now = () => new Date().toISOString();
  const startedAt = now();
  const attempt = () => state === 'not_started'
    ? { examId: 'e1', title: 'Prova de Lógica', instructions: 'Leia com calma.', status: 'not_started', state: 'open', opensAt: null, closesAt: null, timeLimitMinutes: 50, questionCount: 5, serverNow: now() }
    : state === 'in_progress'
      ? { examId: 'e1', title: 'Prova de Lógica', instructions: 'Leia com calma.', status: 'in_progress', startedAt, serverNow: now(), closesAt: null, timeLimitMinutes: 50,
        deadlineAt: options.deadlineInMs === null ? null : new Date(Date.now() + (options.deadlineInMs ?? 50 * 60000)).toISOString(), questions: QUESTIONS, answers: calls.drafts.at(-1)?.answers ?? {}, lastSavedAt: null }
      : { examId: 'e1', title: 'Prova de Lógica', status: 'submitted', submittedAt: now(), submitReason: 'student' };
  await page.route('**/api/exams/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/^\/api/, '');
    if (path === '/exams/student') return route.fulfill({ json: [{ id: 'e1', title: 'Prova de Lógica', disciplineName: 'Lógica original', opensAt: null, closesAt: null, timeLimitMinutes: 50, questionCount: 5, status: state === 'not_started' ? 'available' : state === 'in_progress' ? 'in_progress' : 'submitted', startedAt: null, submittedAt: null, deadlineAt: null }] });
    if (path === '/exams/e1/attempt') return route.fulfill({ json: attempt() });
    if (path === '/exams/e1/start') { state = 'in_progress'; return route.fulfill({ json: attempt() }); }
    if (path === '/exams/e1/draft') { calls.drafts.push(request.postDataJSON()); return route.fulfill({ json: { savedAt: now(), deadlineAt: null, serverNow: now() } }); }
    if (path === '/exams/e1/submit') { calls.submits.push(request.postDataJSON()); state = 'submitted'; return route.fulfill({ json: attempt() }); }
    return route.fulfill({ status: 404, json: { message: 'not found' } });
  });
  return calls;
}

/** Staff side: a draft built from the bank, then published. */
async function mockStaffExams(page: Page) {
  const bank = [
    { id: 'b1', ownerId: 'test-user', disciplineId: ids.discipline, disciplineName: 'Lógica original', type: 'quiz', statement: 'Quanto vale p → q?', weight: 1, version: 1, language: 'pt-BR', subject: null, concepts: [], content: { type: 'quiz', options: ['V', 'F'], correct: 1 }, sourceQuizQuestionId: null, createdAt: '', updatedAt: '' },
    { id: 'b2', ownerId: 'test-user', disciplineId: ids.discipline, disciplineName: 'Lógica original', type: 'essay', statement: 'Explique o condicional.', weight: 2, version: 1, language: 'pt-BR', subject: null, concepts: [], content: { type: 'essay', criteria: '' }, sourceQuizQuestionId: null, createdAt: '', updatedAt: '' },
  ];
  let exam: any = null;
  const detail = () => ({ ...exam, disciplineName: 'Lógica original', audience: 30, submitted: exam.state === 'draft' ? 0 : 3, inProgress: exam.state === 'draft' ? 0 : 2, publishedAt: null, closedAt: null,
    totalWeight: exam.questionIds.reduce((sum: number, id: string) => sum + bank.find(item => item.id === id)!.weight, 0),
    questions: exam.questionIds.map((id: string) => { const item = bank.find(question => question.id === id)!; return { questionId: id, type: item.type, statement: item.statement, weight: item.weight, version: 1 }; }) });
  await page.route('**/api/questions**', route => route.fulfill({ json: bank }));
  await page.route('**/api/exams/manage**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/^\/api/, '');
    if (path === '/exams/manage' && request.method() === 'GET') return route.fulfill({ json: exam ? [{ ...detail(), questionCount: exam.questionIds.length }] : [] });
    if (path === '/exams/manage' && request.method() === 'POST') {
      const body = request.postDataJSON();
      if (!body.title) return route.fulfill({ status: 400, json: { code: 'exams.invalid', message: 'invalid', issues: [{ field: 'title', code: 'REQUIRED', params: {} }] } });
      exam = { id: 'e1', state: 'draft', ...body };
      return route.fulfill({ status: 201, json: detail() });
    }
    if (path === '/exams/manage/e1/publish') { exam.state = 'open'; return route.fulfill({ json: detail() }); }
    if (path === '/exams/manage/e1') return route.fulfill({ json: detail() });
    return route.fulfill({ status: 404, json: {} });
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
  test(`prova: telas do aluno acessíveis em ${language}`, async ({ page }) => {
    await mockApi(page, 'student');
    await mockStudentExam(page);
    await page.goto('/exams');
    await selectLanguage(page, language);
    await expect(page.getByRole('article')).toHaveCount(1);
    await audit(page, `${language}: lista`);
    await page.goto('/exams/e1');
    await expect(page.locator('main button').filter({ hasText: /Começar prova|Start exam|Empezar examen/ })).toBeVisible();
    await audit(page, `${language}: regras`);
    await page.locator('main button').filter({ hasText: /Começar prova|Start exam|Empezar examen/ }).click();
    await expect(page.getByRole('timer')).toBeVisible();
    await audit(page, `${language}: prova`);
    await page.locator('main button').filter({ hasText: /Enviar prova|Submit exam|Enviar examen/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await audit(page, `${language}: confirmação`);
    await page.getByRole('dialog').locator('button').last().click();
    await expect(page.locator('h2').filter({ hasText: /Prova enviada|Exam submitted|Examen enviado/ })).toBeVisible();
    await audit(page, `${language}: enviada`);
  });

  test(`prova: telas do professor acessíveis em ${language}`, async ({ page }) => {
    await mockApi(page, 'professor');
    await mockStaffExams(page);
    await page.goto('/exams/manage/new');
    await selectLanguage(page, language);
    await expect(page.locator('input[type=checkbox]').first()).toBeVisible();
    await audit(page, `${language}: editor`);
  });
}

test('prova: o aluno responde os cinco tipos e envia com confirmação', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'Fluxo com teclado físico no desktop.');
  await mockApi(page, 'student');
  const calls = await mockStudentExam(page);
  await page.goto('/exams');
  await page.getByRole('link', { name: 'Começar: Prova de Lógica' }).click();
  await expect(page.getByText('Você terá 50 minutos a partir do momento em que começar.')).toBeVisible();
  await page.getByRole('button', { name: 'Começar prova' }).click();
  await expect(page.getByRole('timer')).toContainText(/Tempo restante: (49|50):/);

  await page.getByRole('radio', { name: 'F' }).check();
  const first = page.getByRole('button', { name: 'Linha 1, coluna p → q: vazia' });
  await first.focus();
  for (const key of ['v', 'ArrowDown', 'f', 'ArrowDown', 'v', 'ArrowDown', 'v']) await page.keyboard.press(key);
  for (const name of ['Inserir p (chove)', 'Inserir → (condicional)', 'Inserir q (a rua fica molhada)']) await page.getByRole('button', { name }).click();
  for (const text of ['se n > 0 então', 'escreva(n)', 'fimse']) {
    await page.getByRole('button', { name: text, exact: true }).click();
    await page.getByRole('button', { name: 'Mover para a solução' }).click();
  }
  await page.getByRole('button', { name: 'escreva(n), recuo 0', exact: true }).click();
  await page.getByRole('button', { name: 'Aumentar recuo' }).click();
  await expect(page.getByLabel('Sua resposta')).toHaveAccessibleDescription(/Não se identifique na resposta/);

  await expect.poll(() => calls.drafts.length, { timeout: 6000 }).toBeGreaterThan(0);
  for (let index = 1; index <= 4; index++) await expect(page.getByRole('button', { name: `Questão ${index}, respondida` })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Questão 5, sem resposta' })).toBeVisible();

  await page.getByRole('button', { name: 'Enviar prova' }).click();
  const dialog = page.getByRole('dialog', { name: 'Enviar a prova?' });
  await expect(dialog).toContainText('Questões sem resposta: 1.');
  await dialog.getByRole('button', { name: 'Voltar à prova' }).click();
  await page.getByLabel('Sua resposta').fill('O condicional só é falso quando o antecedente é verdadeiro e o consequente é falso.');
  await page.getByRole('button', { name: 'Enviar prova' }).click();
  await expect(dialog).toContainText('Todas as questões têm resposta.');
  await dialog.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByRole('heading', { name: 'Prova enviada' })).toBeVisible();
  const answers = calls.submits[0].answers;
  expect(answers['eq-1']).toEqual({ choice: 1 });
  expect(answers['eq-2']).toEqual({ cells: { '0|p → q': true, '1|p → q': false, '2|p → q': true, '3|p → q': true } });
  expect(answers['eq-3']).toEqual({ text: 'p → q' });
  expect(answers['eq-4']).toEqual({ solution: [{ id: 'k2', indent: 0 }, { id: 'k9', indent: 1 }, { id: 'k7', indent: 0 }] });
  expect(answers['eq-5'].text).toContain('condicional');
});

test('prova: no celular, com texto ampliado, a prova cabe na tela', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.addInitScript(() => localStorage.setItem('logibot.preferences', JSON.stringify({ textSize: 'larger', theme: 'dark', motion: 'reduce' })));
  await mockApi(page, 'student');
  await mockStudentExam(page);
  await page.goto('/exams/e1');
  await page.getByRole('button', { name: 'Começar prova' }).click();
  await expect(page.getByRole('timer')).toBeVisible();
  for (const button of await page.getByRole('navigation', { name: 'Questões da prova' }).getByRole('button').all()) {
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  await page.getByRole('button', { name: 'Questão 4, sem resposta' }).click();
  await expect(page.getByRole('article', { name: /Questão 4 de 5/ })).toBeFocused();
  await audit(page, 'prova 320px');
});

test('prova: o professor monta, publica e acompanha', async ({ page }) => {
  await mockApi(page, 'professor');
  await mockStaffExams(page);
  await page.goto('/exams/manage');
  await page.getByRole('link', { name: 'Nova prova' }).click();
  await page.getByRole('button', { name: 'Salvar rascunho' }).click();
  await expect(page.getByLabel('Título')).toBeFocused();
  await page.getByLabel('Título').fill('Prova de Lógica');
  await page.getByRole('checkbox', { name: /Explique o condicional/ }).check();
  await page.getByRole('checkbox', { name: /Quanto vale p → q\?/ }).check();
  await page.getByRole('button', { name: 'Subir questão 2' }).click();
  await expect(page.getByText('Peso total 3')).toBeVisible();
  await page.getByRole('button', { name: 'Salvar rascunho' }).click();
  await expect(page).toHaveURL(/\/exams\/manage\/e1$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Prova de Lógica' })).toBeVisible();
  await page.getByRole('button', { name: 'Publicar para a turma' }).click();
  await expect(page.getByRole('dialog', { name: 'Publicar a prova?' })).toContainText('as questões não podem mais ser alteradas');
  await audit(page, 'publicar');
  await page.getByRole('dialog').getByRole('button', { name: 'Publicar para a turma' }).click();
  await expect(page.getByText('Entregas: 3 de 30 alunos · Em andamento: 2')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Encerrar agora' })).toBeVisible();
  await audit(page, 'detalhe publicada');
});

test('prova: itens de menu para aluno e para docente', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'Menu lateral fixo do desktop.');
  await mockApi(page, 'student');
  await mockStudentExam(page);
  await page.goto('/chat');
  const labels = await page.locator('aside').first().getByRole('link').allTextContents();
  expect(labels.slice(labels.indexOf('Montar algoritmo') + 1)[0]).toBe('Provas');
});
