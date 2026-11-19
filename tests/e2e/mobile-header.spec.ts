import { test, expect } from '@playwright/test';
import { ids, mockApi } from './fixtures';

test.use({ locale: 'pt-BR', viewport: { width: 375, height: 812 } });

const pages: Record<string, Array<[string, string]>> = {
  student: [
    ['/chat', 'Chat'], ['/quiz', 'Quiz'], [`/quiz/${ids.quiz}`, 'Quiz'], ['/practice/truth-table', 'Tabela-verdade'],
    ['/practice/translation', 'Tradução'], ['/practice/parsons', 'Montar algoritmo'], ['/exams', 'Provas'],
    ['/exams/e1', 'Provas'], ['/profile', 'Meu Perfil'], ['/feedback', 'Feedback'],
  ],
  professor: [
    ['/dashboard', 'Dashboard'], ['/quiz/manage', 'Quizzes'], ['/questions', 'Banco de questões'], ['/questions/new', 'Banco de questões'],
    ['/exams/manage', 'Provas'], ['/exams/manage/new', 'Provas'], ['/exams/manage/e1/review', 'Provas'], ['/rag', 'Base RAG'],
    ['/entities', 'Listar Entidades'],
  ],
  admin: [
    ['/entities/manage', 'Gestão Acadêmica'], ['/entities/create/university', 'Criar'], ['/admin/feedbacks', 'Feedbacks'],
    ['/admin/chat-feedback', 'Avaliações do chat'], ['/admin/features', 'Liberação de funções'],
  ],
};

for (const role of Object.keys(pages)) {
  test(`cabeçalho do celular mostra o nome da página para ${role}`, async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile', 'O cabeçalho com título é o do celular.');
    await mockApi(page, role);
    for (const [path, title] of pages[role]) {
      await page.goto(path);
      await expect(page.locator('[data-mobile-header]'), path).toContainText(title, { ignoreCase: true });
    }
  });
}

test('só o item mais específico do menu fica ativo', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'Menu lateral do desktop.');
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockApi(page, 'admin');
  await page.goto('/entities/manage');
  const menu = page.locator('#header-menu-options').first();
  const current = menu.locator('a[aria-current="page"]');
  await expect(current).toHaveCount(1);
  await expect(current).toHaveText('Gestão Acadêmica');
  await page.goto('/entities');
  await expect(current).toHaveCount(1);
  await expect(current).toHaveText('Listar Entidades');
});

test('na faixa recolhida os ícones ficam centralizados', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'Menu lateral do desktop.');
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockApi(page, 'admin');
  await page.goto('/dashboard');
  const sidebar = page.locator('aside').first();
  await sidebar.getByRole('button', { name: 'Recolher menu' }).click();
  await expect.poll(async () => (await sidebar.boundingBox())!.width).toBeLessThanOrEqual(65);
  const rail = (await sidebar.boundingBox())!;
  for (const link of await sidebar.locator('#header-menu-options a').all()) {
    const icon = (await link.locator('svg').boundingBox())!;
    const box = (await link.boundingBox())!;
    expect(Math.abs(icon.x + icon.width / 2 - (rail.x + rail.width / 2)), 'ícone no centro da faixa').toBeLessThanOrEqual(1.5);
    expect(Math.abs(box.x + box.width / 2 - (rail.x + rail.width / 2)), 'realce no centro da faixa').toBeLessThanOrEqual(1.5);
  }
});
