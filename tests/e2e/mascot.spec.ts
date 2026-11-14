import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { ids, mockApi } from "./fixtures";

test.use({ locale: "pt-BR", launchOptions: { args: ["--enable-unsafe-swiftshader"] } });

test("login renders a real 3D robot and keeps animating after its greeting", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    const original = window.requestAnimationFrame.bind(window);
    (window as any).robotRafCount = 0;
    window.requestAnimationFrame = callback => { (window as any).robotRafCount++; return original(callback); };
  });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/signin");
  const robot = page.locator('[data-robot-avatar][data-renderer="3d"]:visible');
  await expect(robot).toHaveCount(1, { timeout: 20000 });
  await expect(robot.locator("canvas")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("login-robot-3d.png"), fullPage: true });
  await page.waitForTimeout(5000);
  await robot.screenshot({ path: testInfo.outputPath("robot-detail.png") });
  const frames = await page.evaluate(() => (window as any).robotRafCount);
  await page.waitForTimeout(350);
  expect(await page.evaluate(() => (window as any).robotRafCount)).toBeGreaterThan(frames);
  expect(errors).toEqual([]);
});

test("chat switches repeatedly between legacy/static and continuous animation", async ({ page }) => {
  test.setTimeout(60000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await mockApi(page);
  await page.goto("/chat");
  const robot = page.getByRole("main").locator("[data-robot-avatar]");
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const selectMascot = async (name: string) => {
    const menu = page.getByRole("button", { name: /Abrir menu/ });
    if (await menu.isVisible()) await menu.click();
    await page.getByRole("button", { name: "Aparência e acessibilidade" }).click();
    await page.getByRole("group", { name: "Mascote LogiBot" }).getByText(name, { exact: true }).click();
    await page.keyboard.press("Escape");
    const closeMenu = page.getByRole("button", { name: "Fechar menu" });
    if (await closeMenu.isVisible()) await closeMenu.click();
  };
  await expect(robot).toHaveAttribute("data-renderer", "3d", { timeout: 20000 });
  await page.waitForTimeout(5500);
  const first = await robot.screenshot();
  await page.waitForTimeout(500);
  expect((await robot.screenshot()).equals(first)).toBe(false);
  for (const option of ["Logo antiga", "Estático", "Logo antiga"]) {
    await selectMascot(option);
    await expect(robot).toBeVisible();
    await expect(robot).toHaveAttribute("data-renderer", option === "Logo antiga" ? "legacy" : "static");
    await expect(robot.locator("canvas")).toHaveCount(0);
    // Wait for the old Three.js context to be released before reactivating.
    await page.waitForTimeout(1500);
    await selectMascot("Animado");
    await expect(robot).toHaveAttribute("data-renderer", "3d", { timeout: 20000 });
    await expect(robot.locator("canvas")).toBeVisible();
    await page.waitForTimeout(1500);
    await expect(robot).toHaveAttribute("data-renderer", "3d");
  }
  expect(errors).toEqual([]);
});

test("reduced motion preserves a visible logo without loading the 3D scene", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const scenes: string[] = [];
  page.on("request", request => { if (request.url().includes("RobotScene-")) scenes.push(request.url()); });
  await page.goto("/signin");
  await expect(page.locator("[data-robot-avatar]:visible")).toHaveAttribute("data-renderer", "static");
  await expect(page.locator("canvas")).toHaveCount(0);
  expect(scenes).toEqual([]);
});

test("no WebGL retains a working login and static brand", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind: string, ...args: any[]) {
      if (kind.includes("webgl")) return null;
      return (original as any).call(this, kind, ...args);
    } as any;
  });
  await page.goto("/signin");
  await expect(page.getByRole("button", { name: "Entrar", exact: true })).toBeVisible();
  await expect(page.locator("[data-robot-avatar]:visible")).toHaveAttribute("data-renderer", "static");
  await expect(page.locator("canvas")).toHaveCount(0);
});

for (const width of [320, 393, 1280]) {
  test(`companion stays in layout, supports keyboard and enlarged text at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 852 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await mockApi(page);
    await page.goto(`/quiz/${ids.quiz}`);
    const companion = page.getByRole("region", { name: "Assistente LogiBot" });
    await expect(companion).toBeVisible();
    const question = page.getByText("Qual é o valor original?");
    const before = await companion.boundingBox(), after = await question.boundingBox();
    expect(before!.y + before!.height).toBeLessThanOrEqual(after!.y);
    const trigger = companion.getByRole("button", { name: "Ver sugestão do LogiBot" }).first();
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(companion.getByText(/Leia o enunciado com calma/)).toBeVisible();
    const axe = await new AxeBuilder({ page }).include("[data-learning-companion]").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(axe.violations).toEqual([]);
    await page.evaluate(() => { document.documentElement.style.fontSize = "32px"; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const button of await companion.getByRole("button").all()) {
      const bounds = await button.boundingBox();
      expect(bounds!.width).toBeGreaterThanOrEqual(44);
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
    }
    await page.screenshot({ path: testInfo.outputPath(`quiz-companion-${width}-text-200.png`), fullPage: true });
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  });
}

test("legacy logo persists and the accessibility menu restores the static mascot", async ({ page }) => {
  await mockApi(page);
  await page.goto(`/quiz/${ids.quiz}`);
  await page.getByRole("button", { name: "Usar logo antiga" }).click();
  await expect(page.locator("[data-learning-companion] [data-robot-avatar]")).toHaveAttribute("data-renderer", "legacy");
  await page.reload();
  await expect(page.locator("[data-learning-companion] [data-robot-avatar]")).toHaveAttribute("data-renderer", "legacy");
  const menu = page.getByRole("button", { name: /Abrir menu/ });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("button", { name: "Aparência e acessibilidade" }).click();
  await page.getByRole("group", { name: "Mascote LogiBot" }).getByText("Estático", { exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-learning-companion]")).toBeVisible();
});

test("waiting for an answer offers help without posting activity or stealing focus", async ({ page }) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "reduce" });
  const requests = await mockApi(page);
  await page.goto(`/quiz/${ids.quiz}`);
  const trigger = page.getByRole("button", { name: "Ver sugestão do LogiBot" }).first();
  await trigger.focus();
  await page.clock.fastForward(91000);
  await expect(page.getByText("Sem pressa. Quer uma sugestão?")).toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(requests.filter(request => request.path === "/auth/activity")).toEqual([]);
});

test("chat replaces the central logo with just the robot", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockApi(page);
  await page.goto("/chat");
  const main = page.getByRole("main");
  const robot = main.locator("[data-robot-avatar]");
  const title = main.getByRole("heading", { name: "O que vamos programar hoje?" });
  await expect(robot).toBeVisible();
  await expect(main.locator("[data-learning-companion]")).toHaveCount(0);
  await expect(main.getByRole("button", { name: /Pausar animações|Ver sugestão/ })).toHaveCount(0);
  const bounds = await robot.boundingBox(), heading = await title.boundingBox();
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(heading!.y);
  expect(Math.abs((bounds!.x + bounds!.width / 2) - (heading!.x + heading!.width / 2))).toBeLessThanOrEqual(2);
  await expect(main.getByRole("textbox")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("chat-central-robot.png"), fullPage: true });
});
