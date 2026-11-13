import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mockApi, ids } from "./fixtures";

async function sessionApi(page: Page, absoluteSeconds = 7200) {
  await page.clock.install();
  await page.addInitScript(() => {
    localStorage.setItem("logibot.language", JSON.stringify({ mode: "fixed", language: "pt-BR" }));
  });
  const base = await page.evaluate(() => Date.now());
  let idle = base + 1800000, absolute = base + absoluteSeconds * 1000, active = 0, checks = 0;
  const user = { _id: "test-user", id: "test-user", name: "João da Silva", email: "joao@example.invalid", role: ["student"], schoolId: [ids.university], courseId: [ids.course], classId: [ids.class], preferredLanguage: "pt-BR" };
  const status = (now: number) => ({ id: "00000000-0000-4000-8000-999999999999", serverNow: new Date(now).toISOString(), idleExpiresAt: new Date(idle).toISOString(), expiresAt: new Date(absolute).toISOString(), heartbeatSeconds: 30, warningSeconds: 120 });
  await mockApi(page, "student");
  await page.route("**/api/auth/**", async route => {
    const path = new URL(route.request().url()).pathname;
    const now = await page.evaluate(() => Date.now());
    if (path.endsWith("/session")) { idle = now + 1800000; absolute = now + 7200000; }
    if (path.endsWith("/activity")) {
      active++;
      if (now < Math.min(idle, absolute)) idle = Math.min(now + 1800000, absolute);
    }
    if (path.endsWith("/session-status")) checks++;
    if (now >= Math.min(idle, absolute) && !path.endsWith("/logout")) {
      await route.fulfill({ status: 401, json: { code: "auth.sessionExpired", message: "Sessão expirada" } }); return;
    }
    await route.fulfill({ json: path.endsWith("/me") ? { ...user, session: status(now) } : path.endsWith("/session") ? { success: true, user, session: status(now) } : status(now) });
  });
  return { activity: () => active, checks: () => checks };
}

test("background status requests do not keep a user active", async ({ page }) => {
  const state = await sessionApi(page);
  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: "Informações pessoais" })).toBeVisible();
  await page.clock.fastForward(60000);
  await expect.poll(state.checks).toBeGreaterThan(0);
  expect(state.activity()).toBe(0);
});

test("keyboard interaction sends a bounded activity checkpoint", async ({ page }) => {
  const state = await sessionApi(page);
  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: "Informações pessoais" })).toBeVisible();
  await page.keyboard.press("Tab");
  await page.clock.fastForward(30000);
  await expect.poll(state.activity).toBeGreaterThan(0);
});

test("inactivity warning works with keyboard, text enlargement and mobile width", async ({ page }, testInfo) => {
  const state = await sessionApi(page);
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: "Informações pessoais" })).toBeVisible();
  await page.evaluate(() => { document.documentElement.style.fontSize = "32px"; });
  await page.clock.fastForward(28 * 60000 + 1000);
  const warning = page.getByRole("alertdialog", { name: "Sua sessão vai expirar" });
  await expect(warning).toBeVisible();
  const stay = warning.getByRole("button", { name: "Continuar conectado" });
  await expect(warning).toBeFocused();
  const modalBounds = await warning.boundingBox();
  expect(modalBounds!.y).toBeGreaterThanOrEqual(0);
  expect(modalBounds!.y + modalBounds!.height).toBeLessThanOrEqual(720);
  const bounds = await stay.boundingBox();
  expect(bounds!.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const axe = await new AxeBuilder({ page }).include('[role="alertdialog"]').withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(axe.violations).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("session-warning-320-text-200.png") });
  await page.keyboard.press("Tab");
  await expect(stay).toBeFocused();
  await page.keyboard.press("Enter");
  await expect.poll(state.activity).toBe(1);
  await expect(warning).toHaveCount(0);
});

test("expiration requires login and restores the same account's unsubmitted quiz draft", async ({ page }) => {
  await sessionApi(page);
  await page.goto(`/quiz/${ids.quiz}`);
  await page.getByRole("button", { name: /Valor original A/ }).click();
  await expect(page.getByText(/1\/1 respondidas/)).toBeVisible();
  await page.clock.fastForward(31 * 60000);
  await expect(page).toHaveURL(/\/signin\?expired=1/);
  await expect(page.getByRole("status").filter({ hasText: "Sua sessão expirou" })).toBeVisible();
  await page.getByLabel(/E-mail/i).fill("joao@example.invalid");
  await page.getByLabel(/^Senha/i).fill("fixture-password-123");
  await page.getByRole("button", { name: /^Entrar$/ }).click();
  await expect(page).toHaveURL(/\/(home|chat)/);
  await page.goto(`/quiz/${ids.quiz}`);
  await expect(page.getByText(/1\/1 respondidas/)).toBeVisible();
});

test("absolute timeout warns even with an otherwise active idle window", async ({ page }) => {
  await sessionApi(page, 300);
  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: "Informações pessoais" })).toBeVisible();
  await page.clock.fastForward(181000);
  const warning = page.getByRole("alertdialog");
  await expect(warning.getByText(/limite de segurança/)).toBeVisible();
  await expect(warning.getByRole("button", { name: "Continuar conectado" })).toHaveCount(0);
  await page.clock.fastForward(121000);
  await expect(page).toHaveURL(/\/signin\?expired=1/);
});

test("a 401 clears the authenticated UI without waiting for its local timer", async ({ page }) => {
  await sessionApi(page);
  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: "Informações pessoais" })).toBeVisible();
  await page.route("**/api/auth/session-status", route => route.fulfill({ status: 401, json: { code: "auth.sessionExpired" } }));
  await page.clock.fastForward(31000);
  await expect(page).toHaveURL(/\/signin\?expired=1/);
});
