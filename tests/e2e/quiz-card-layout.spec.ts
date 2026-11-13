import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockApi, quiz } from './fixtures';

test.use({ locale: 'pt-BR' });
const cards = [
 { ...quiz, title: 'Quiz de linguagem Python', language: null, questionCount: 5 },
 { ...quiz, id: 'long-quiz', title: 'Vetores, Matrizes e Arrays — Quiz de Conceitos', language: null, questionCount: 5 },
 { ...quiz, id: 'draft-quiz', title: 'Sequências de Repetição e Condicionais para Iniciantes', disciplineName: 'Programação de Computadores — Turma G1', topic: 'Fundamentos de Programação e Estruturas de Controle', status: 'draft', language: 'pt-BR', questionCount: 5 },
];

for (const settings of [
 { width: 320, textSize: 'default' }, { width: 393, textSize: 'default' },
 { width: 768, textSize: 'default' }, { width: 1280, textSize: 'default' },
 { width: 320, textSize: 'larger' },
 { width: 320, textSize: 'default', fontSize: 32 },
 { width: 393, textSize: 'default', spacing: true },
 { width: 393, textSize: 'default', theme: 'dark' },
]) {
 test(`quiz cards at ${settings.width}px: ${settings.textSize}, ${settings.fontSize ?? 16}px, ${settings.spacing ? 'spaced' : 'normal'}, ${settings.theme ?? 'light'}`, async ({ page }, info) => {
  await page.setViewportSize({ width: settings.width, height: 852 });
  await page.addInitScript(({ textSize, theme, fontSize }) => {
   localStorage.setItem('logibot.preferences', JSON.stringify({ theme: theme ?? 'light', motion: 'reduce', textSize }));
   if (fontSize) document.addEventListener('DOMContentLoaded', () => { document.documentElement.style.fontSize = `${fontSize}px`; });
  }, settings);
  await mockApi(page, 'professor');
  await page.route('**/api/quiz/professor', route => route.fulfill({ json: cards }));
  await page.goto('/quiz/manage');
  if (settings.spacing) await page.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }' });
  for (const item of cards) {
   const card = page.getByRole('article', { name: item.title, exact: true });
   const heading = card.getByRole('heading', { name: item.title, exact: true });
   await expect(heading).toBeVisible();
   const badge = card.getByText(item.status === 'draft' ? 'Rascunho' : 'Publicado', { exact: true });
   const language = card.getByText(/^Idioma do conteúdo:/);
   const discipline = card.getByText(item.disciplineName, { exact: true });
   const count = card.getByText('5 questões', { exact: true });
   const [h, b, l, d, c, bounds] = await Promise.all([heading, badge, language, discipline, count, card].map(node => node.boundingBox()));
   expect(l!.y).toBeGreaterThanOrEqual(Math.max(h!.y + h!.height, b!.y + b!.height));
   expect(d!.y).toBeGreaterThanOrEqual(l!.y + l!.height);
   expect(c!.y).toBeGreaterThanOrEqual(d!.y + d!.height);
   if (settings.textSize === 'default' && !settings.fontSize) expect(Math.abs(h!.y - b!.y)).toBeLessThanOrEqual(1);
   const sizes = await heading.evaluate(node => ({ title: parseFloat(getComputedStyle(node).fontSize), root: parseFloat(getComputedStyle(document.documentElement).fontSize) }));
   expect(sizes.title).toBeGreaterThanOrEqual(sizes.root);
   expect(await language.evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeCloseTo(sizes.root * .875, 1);
   for (const button of await card.getByRole('button').all()) {
    const box = (await button.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x + box.width).toBeLessThanOrEqual(bounds!.x + bounds!.width + 1);
    expect(await button.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
   }
   for (const box of [h, b, l, d, c]) {
    expect(box!.x).toBeGreaterThanOrEqual(bounds!.x);
    expect(box!.x + box!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width + 1);
   }
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  if (settings.width === 393 && settings.textSize === 'default') {
   await page.screenshot({ path: info.outputPath('quiz-cards-mobile.png') });
   const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
   expect(audit.violations.map(item => item.id)).toEqual([]);
  }
  const first = page.getByRole('article', { name: cards[0].title, exact: true });
  await first.getByRole('button', { name: 'Perguntas', exact: true }).click();
  await expect(first.getByText('Qual é o valor original?', { exact: true })).toBeVisible();
  await first.getByRole('button', { name: 'Perguntas', exact: true }).click();
  const edit = first.getByRole('button', { name: 'Editar', exact: true });
  await edit.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('textbox').first()).toHaveValue(cards[0].title);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(edit).toBeFocused();
 });
}
