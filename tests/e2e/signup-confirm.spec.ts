import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ locale: 'pt-BR' });

test('cadastro exige repetir a senha e envia a confirmação', async ({ page }) => {
  let body: Record<string, unknown> | null = null;
  await page.route('**/api/auth/register', async route => {
    body = route.request().postDataJSON();
    await route.fulfill({ status: 400, json: { code: 'registration.classCodeInvalid', message: 'codigo de turma invalido!' } });
  });
  await page.goto('/signup');
  await page.locator('#signup-name-input').fill('Ana Souza');
  await page.locator('#signup-email-input').fill('ana@example.invalid');
  await expect(page.locator('p', { hasText: 'A senha deve ter no mínimo 12 caracteres.' })).toHaveCount(0);
  await page.locator('#signup-password-input').click();
  const hint = page.locator('[data-field-hint]');
  await expect(hint).toBeVisible();
  await expect(hint).toContainText('Tamanho da senha');
  await expect(page.locator('#signup-password-input')).toHaveAccessibleDescription('A senha deve ter no mínimo 12 caracteres.');
  await page.keyboard.press('Escape');
  await expect(hint).toHaveCount(0);
  await page.locator('#signup-password-input').fill('senha-forte-123');
  const confirm = page.getByLabel('Repetir senha', { exact: true });
  await confirm.fill('senha-forte-124');
  await expect(confirm).toHaveAttribute('aria-invalid', 'true');
  await expect(confirm).toHaveAccessibleDescription('Repita exatamente os mesmos caracteres da senha digitada acima. As senhas não coincidem.');
  for (const id of ['name', 'email', 'password', 'confirm-password', 'code']) await expect(page.locator(`#signup-${id}-input`)).toHaveAttribute('placeholder', /.+/);
  await page.locator('#signup-code-input').fill('TURMA-1');
  await page.locator('#signup-submit-button').click();
  await expect(confirm).toBeFocused();
  expect(body).toBeNull();

  await confirm.fill('senha-forte-123');
  await expect(confirm).not.toHaveAttribute('aria-invalid', 'true');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations.map(item => item.id)).toEqual([]);
  await page.locator('#signup-submit-button').click();
  await expect.poll(() => body).toMatchObject({ password: 'senha-forte-123', confirmPassword: 'senha-forte-123' });
});
