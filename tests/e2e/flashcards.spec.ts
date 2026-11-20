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

const DECK = '50000000-0000-4000-8000-000000000001';
const session = {
  deck: { id: DECK, title: 'Conectivos lógicos', language: 'pt-BR' }, ahead: false, total: 2, due: 2,
  cards: [
    { id: '50000000-0000-4000-8000-000000000011', front: 'Quando p ∧ q é verdadeiro?', back: 'Só quando p e q são verdadeiros.', concept: 'conjunction', box: 0 },
    { id: '50000000-0000-4000-8000-000000000012', front: 'O que faz ¬p?', back: 'Inverte o valor lógico de p.', concept: 'negation', box: 1 },
  ],
};

for (const theme of ['dark', 'light']) {
  test(`aluno: estuda um baralho virando cartões, com teclado e acessibilidade (tema ${theme})`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem('logibot.preferences', JSON.stringify({ theme: value, motion: 'full' })), theme);
    await mockApi(page, 'student');
    const reviews: unknown[] = [];
    await page.route('**/api/flashcards/study', route => route.fulfill({ json: [{ id: DECK, title: 'Conectivos lógicos', description: 'Revisão dos conectivos', language: 'pt-BR', disciplineName: 'Lógica original', cards: 2, due: 2, known: 0, seen: 0 }] }));
    await page.route(`**/api/flashcards/study/${DECK}`, route => route.fulfill({ json: session }));
    await page.route('**/api/flashcards/cards/*/review', route => { reviews.push(route.request().postDataJSON()); return route.fulfill({ json: { box: 2, dueAt: '2026-11-21T00:00:00Z' } }); });

    await page.goto('/flashcards');
    const deck = page.getByRole('article', { name: 'Conectivos lógicos' });
    await expect(deck).toContainText('2 para revisar hoje');
    await audit(page, `baralhos ${theme}`);
    await deck.getByRole('link', { name: /Estudar/ }).click();

    await expect(page.getByText('Cartão 1 de 2')).toBeVisible();
    await page.getByRole('button', { name: 'Mostrar resposta' }).click();
    // The flip turns the card (3D) and the answer becomes the visible side.
    await expect(page.locator('.flashcard-inner')).toHaveAttribute('data-flipped', 'true');
    await expect(page.getByText('Só quando p e q são verdadeiros.', { exact: true })).toBeVisible();
    await audit(page, `cartão virado ${theme}`);
    // Focus moves to the answer buttons (first one: "Errei"), so keyboard users keep their place.
    await expect(page.getByRole('button', { name: /Errei/ })).toBeFocused();
    await page.keyboard.press('3');
    await expect(page.getByText('Cartão 2 de 2')).toBeVisible();
    await page.locator('body').press('Space');
    await page.keyboard.press('1');
    await expect(page.getByRole('region', { name: 'Rodada concluída' })).toContainText('Errei: 1');
    expect(reviews).toEqual([{ rating: 'good' }, { rating: 'again' }]);
    await audit(page, `resumo ${theme}`);
  });
}

test('aluno com movimento reduzido: o cartão vira sem animação', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('logibot.preferences', JSON.stringify({ motion: 'reduce' })));
  await mockApi(page, 'student');
  await page.route(`**/api/flashcards/study/${DECK}`, route => route.fulfill({ json: session }));
  await page.goto(`/flashcards/${DECK}`);
  await expect(page.getByText('Cartão 1 de 2')).toBeVisible();
  // The app shortens every transition to (almost) zero when motion is reduced.
  expect(await page.locator('.flashcard-inner').evaluate(node => parseFloat(getComputedStyle(node).transitionDuration))).toBeLessThan(0.01);
});

test('professor: cria um baralho, traz questões do banco e publica', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('logibot.preferences', JSON.stringify({ motion: 'reduce' })));
  await mockApi(page, 'teacher');
  let saved: Record<string, unknown> | null = null;
  await page.route('**/api/flashcards/decks', route => {
    if (route.request().method() === 'POST') { saved = route.request().postDataJSON(); return route.fulfill({ status: 201, json: { id: DECK, ...saved } }); }
    return route.fulfill({ json: saved ? [{ id: DECK, disciplineId: ids.discipline, title: 'Conectivos lógicos', description: null, language: 'pt-BR', published: true, updatedAt: '2026-11-19T12:00:00Z', disciplineName: 'Lógica original', cards: 2 }] : [] });
  });
  await page.route('**/api/flashcards/candidates**', route => route.fulfill({ json: [{ id: '60000000-0000-4000-8000-000000000001', front: 'O que é uma negação?', back: 'Inverte o valor lógico.', concept: 'negation' }] }));

  await page.goto('/flashcards/manage');
  await expect(page.getByText('Nenhum baralho ainda')).toBeVisible();
  await page.getByRole('link', { name: 'Novo baralho' }).click();
  await page.getByRole('textbox', { name: 'Título' }).fill('Conectivos lógicos');
  await page.getByLabel('Disciplina').selectOption(ids.discipline);
  await page.getByRole('textbox', { name: 'Frente (pergunta)' }).fill('Quando p ∧ q é verdadeiro?');
  await page.getByRole('textbox', { name: 'Verso (resposta)' }).fill('Só quando p e q são verdadeiros.');
  await page.getByRole('button', { name: 'Trazer do Banco de questões' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('checkbox', { name: /O que é uma negação/ }).check();
  await audit(page, 'trazer do banco');
  await dialog.getByRole('button', { name: 'Adicionar (1)' }).click();
  await expect(page.getByRole('group', { name: 'Cartão 2' })).toBeVisible();
  await page.getByRole('checkbox', { name: /Publicar para os alunos/ }).check();
  await audit(page, 'editor de baralho');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByRole('article', { name: 'Conectivos lógicos' })).toContainText('Publicado');
  expect(saved).toMatchObject({ title: 'Conectivos lógicos', published: true, cards: [{ front: 'Quando p ∧ q é verdadeiro?' }, { front: 'O que é uma negação?', sourceQuestionId: '60000000-0000-4000-8000-000000000001' }] });
});
