import { test, expect } from "@playwright/test";
import { ids, mockApi } from "./fixtures";

test.use({ locale: "pt-BR" });

test("practice navigation fades out and in while keeping the sidebar mounted", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("logibot.preferences", JSON.stringify({ mascot: "static", motion: "full" })));
  await mockApi(page);
  await page.route("**/api/chat/sessions/*/*/messages", route => route.fulfill({ json: [
    { id: "10000000-0000-4000-8000-000000000001", role: "user", content: "Como usar variáveis?" },
    { id: "20000000-0000-4000-8000-000000000001", role: "assistant", content: "Uma variável guarda um valor." },
  ] }));
  await page.goto("/chat?session=motion");
  const practice = page.getByRole("link", { name: "Praticar no quiz" });
  await expect(practice).toBeVisible();
  await expect.poll(() => page.getByRole("main").evaluate(node => getComputedStyle(node).opacity)).toBe("1");
  const samples = await practice.evaluate(async (link: HTMLAnchorElement) => {
    const sidebar = document.querySelector("aside");
    const values: { phase: string | undefined; opacity: number; sidebarMounted: boolean }[] = [];
    link.click();
    const start = performance.now();
    await new Promise<void>(resolve => {
      const sample = () => {
        const root = document.querySelector<HTMLElement>(".navigation-transition")!;
        const main = document.querySelector("main");
        values.push({ phase: root.dataset.routePhase, opacity: main ? Number(getComputedStyle(main).opacity) : 1, sidebarMounted: !!sidebar?.isConnected });
        if (performance.now() - start < 650) requestAnimationFrame(sample); else resolve();
      };
      requestAnimationFrame(sample);
    });
    return values;
  });
  expect(samples.some(value => value.phase === "exit" && value.opacity > 0 && value.opacity < 0.95)).toBe(true);
  expect(samples.some(value => value.phase === "enter" && value.opacity > 0 && value.opacity < 0.95)).toBe(true);
  expect(samples.every(value => value.sidebarMounted)).toBe(true);
  await expect(page).toHaveURL(new RegExp(`/quiz/${ids.quiz}$`));
  await expect(page.getByText("Qual é o valor original?")).toBeVisible();
  await page.goBack();
  await expect(page.getByText("Uma variável guarda um valor.")).toBeVisible();
});

test("reduced motion has no route animation or scroll animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockApi(page);
  await page.goto("/chat");
  const opener = page.getByRole("button", { name: "Abrir menu" });
  if (await opener.isVisible()) await opener.click();
  await page.getByRole("link", { name: "Quiz", exact: true }).click();
  await expect(page).toHaveURL(/\/quiz$/);
  await expect(page.locator(".navigation-transition")).toHaveAttribute("data-route-phase", "idle");
  expect(await page.getByRole("main").evaluate(node => node.getAnimations().length)).toBe(0);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
});

for (const theme of ["light", "dark"]) {
  test(`home has uniform backgrounds, balanced sections and smooth anchors without floating scroll controls in ${theme}`, async ({ page }, testInfo) => {
    await page.addInitScript(theme => localStorage.setItem("logibot.preferences", JSON.stringify({ theme, mascot: "static", motion: "full" })), theme);
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveTitle("LogiBot");
    const header = page.locator("header");
    const height = (await header.boundingBox())!.height;
    for (const id of ["features", "profiles", "start"]) {
      const section = page.locator(`#${id}`);
      const layout = await section.evaluate(node => ({
        background: getComputedStyle(node).backgroundColor,
        minHeight: getComputedStyle(node).minHeight,
        paddingTop: parseFloat(getComputedStyle(node).paddingTop),
        paddingBottom: parseFloat(getComputedStyle(node).paddingBottom),
      }));
      expect(layout.background).toBe("rgba(0, 0, 0, 0)");
      expect(layout.minHeight).toBe("0px");
      expect(layout.paddingTop).toBeLessThanOrEqual(64);
      expect(layout.paddingBottom).toBeLessThanOrEqual(64);
    }
    await expect(page.getByRole("button", { name: "Ir para o final da página" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Voltar ao topo" })).toHaveCount(0);
    const anchor = header.getByRole("link", { name: "Recursos", exact: true }).filter({ visible: true });
    const positions = await anchor.evaluate(async (link: HTMLAnchorElement) => {
      const values: number[] = [scrollY];
      link.click();
      const start = performance.now();
      await new Promise<void>(resolve => {
        const sample = () => { values.push(scrollY); if (performance.now() - start < 300) requestAnimationFrame(sample); else resolve(); };
        requestAnimationFrame(sample);
      });
      return values;
    });
    expect(positions.some(value => value > 0 && value < positions[positions.length - 1])).toBe(true);
    await expect.poll(async () => Math.abs(await page.locator("#features").evaluate(node => node.getBoundingClientRect().top) - height)).toBeLessThan(3);
    await page.screenshot({ path: testInfo.outputPath(`home-${theme}-features.png`), fullPage: false });
    await header.getByRole("link", { name: "Perfis", exact: true }).filter({ visible: true }).click();
    await expect.poll(async () => Math.abs(await page.locator("#profiles").evaluate(node => node.getBoundingClientRect().top) - height)).toBeLessThan(3);
    await page.screenshot({ path: testInfo.outputPath(`home-${theme}-profiles.png`), fullPage: false });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`home-${theme}.png`), fullPage: true });
  });
}
