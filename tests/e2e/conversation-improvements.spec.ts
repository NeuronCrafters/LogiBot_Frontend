import { test, expect, type Page } from "@playwright/test";
import { ids, mockApi, quiz } from "./fixtures";

test.use({ locale: "pt-BR" });

async function sidebar(page: Page) {
  const opener = page.getByRole("button", { name: "Abrir menu" });
  if (await opener.isVisible()) await opener.click();
  return page.locator("aside:visible").last();
}

test("quiz hints expand and collapse gradually in both directions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => localStorage.setItem("logibot.preferences", JSON.stringify({ mascot: "static", motion: "full" })));
  await mockApi(page);
  await page.goto(`/quiz/${ids.quiz}`);
  const companion = page.getByRole("region", { name: "Assistente LogiBot" });
  const toggle = companion.getByRole("button", { name: "Ver sugestão do LogiBot" }).last();
  const measure = () => toggle.evaluate(async (button: HTMLButtonElement) => {
    const section = button.closest("section")!;
    const heights: number[] = [section.getBoundingClientRect().height];
    button.click();
    const started = performance.now();
    await new Promise<void>(resolve => {
      const sample = () => {
        heights.push(section.getBoundingClientRect().height);
        if (performance.now() - started < 450) requestAnimationFrame(sample);
        else resolve();
      };
      requestAnimationFrame(sample);
    });
    return heights;
  });
  const opening = await measure();
  expect(opening[opening.length - 1]).toBeGreaterThan(opening[0] + 30);
  expect(opening.some(height => height > opening[0] + 5 && height < opening[opening.length - 1] - 5)).toBe(true);
  const closing = await companion.getByRole("button", { name: "Fechar sugestão", exact: true }).first().evaluate(async (button: HTMLButtonElement) => {
    const section = button.closest("section")!;
    const heights = [section.getBoundingClientRect().height];
    button.click();
    const start = performance.now();
    await new Promise<void>(resolve => {
      const sample = () => { heights.push(section.getBoundingClientRect().height); if (performance.now() - start < 450) requestAnimationFrame(sample); else resolve(); };
      requestAnimationFrame(sample);
    });
    return heights;
  });
  expect(closing[closing.length - 1]).toBeCloseTo(opening[0], 0);
  expect(closing.some(height => height > closing[closing.length - 1] + 5 && height < closing[0] - 5)).toBe(true);
  await expect(companion.locator(".learning-companion-hint")).toHaveAttribute("inert", "");
});

test("history and navigation keep Quiz selected on entry, refresh and navigation", async ({ page }) => {
  await mockApi(page);
  await page.goto(`/quiz/${ids.quiz}`);
  let menu = await sidebar(page);
  await expect(menu.getByRole("button", { name: "Quiz", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(menu.getByRole("link", { name: "Quiz", exact: true })).toHaveAttribute("aria-current", "page");
  await page.reload();
  menu = await sidebar(page);
  await expect(menu.getByRole("button", { name: "Quiz", exact: true })).toHaveAttribute("aria-pressed", "true");
  await menu.getByRole("link", { name: "Chat", exact: true }).click();
  await expect(page).toHaveURL(/\/chat$/);
  menu = await sidebar(page);
  await expect(menu.getByRole("button", { name: "Chat", exact: true })).toHaveAttribute("aria-pressed", "true");
  await menu.getByRole("link", { name: "Quiz", exact: true }).click();
  await expect(page).toHaveURL(/\/quiz$/);
  await page.getByRole("main").getByRole("button", { name: /Quiz original em português/ }).click();
  await expect(page).toHaveURL(new RegExp(`/quiz/${ids.quiz}$`));
  menu = await sidebar(page);
  await expect(menu.getByRole("button", { name: "Quiz", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("chat offers follow-ups, edits and resends a question, and retains edits after reload", async ({ page }) => {
  await mockApi(page);
  let history: any[] = [];
  const sent: any[] = [];
  let rejectEdit = true;
  let releaseEdit!: () => void;
  const editMayFinish = new Promise<void>(resolve => { releaseEdit = resolve; });
  let releaseSuggestions!: () => void;
  const suggestionsMayFinish = new Promise<void>(resolve => { releaseSuggestions = resolve; });
  await page.route("**/api/chat/sessions/*/*/messages", route => route.fulfill({ json: history }));
  await page.route("**/api/chat/sessions/*/follow-ups", async route => {
    await suggestionsMayFinish;
    return route.fulfill({ json: { suggestions: ["Como funcionam os tipos de dados?", "Pode propor um exercício com variáveis?", "Qual a diferença entre variável e constante?"] } });
  });
  await page.route("**/api/chat/messages/stream", async route => {
    const body = route.request().postDataJSON(); sent.push(body);
    if (body.editMessageId && rejectEdit) {
      rejectEdit = false;
      return route.fulfill({ contentType: "text/event-stream", body: 'event: error\ndata: {"message":"Não foi possível editar agora."}\n\n' });
    }
    if (body.editMessageId) await editMayFinish;
    if (body.editMessageId) history = history.slice(0, history.findIndex(message => message.id === body.editMessageId));
    const userId = body.editMessageId || `10000000-0000-4000-8000-${String(sent.length).padStart(12, "0")}`;
    const answerId = `20000000-0000-4000-8000-${String(sent.length).padStart(12, "0")}`;
    const answer = `Resposta para: ${body.message}`;
    history.push({ id: userId, role: "user", content: body.message }, { id: answerId, role: "assistant", content: answer, metadata: { outputLanguage: "pt-BR" } });
    await route.fulfill({ contentType: "text/event-stream", body: `event: session\ndata: ${JSON.stringify({ sessionId: "conversation", userMessageId: userId })}\n\nevent: token\ndata: ${JSON.stringify({ text: answer })}\n\nevent: done\ndata: ${JSON.stringify({ assistantMessageId: answerId })}\n\n` });
  });
  await page.goto("/chat");
  const main = page.getByRole("main");
  await main.getByRole("textbox").fill("Como usar variáveis?");
  await main.getByRole("button", { name: "Enviar mensagem" }).click();
  const followUps = main.getByRole("group", { name: "Continue explorando" });
  await expect(followUps.getByRole("button")).toHaveCount(3);
  // Suggestions are usable while their background refinement is still blocked.
  releaseSuggestions();
  await followUps.getByRole("button", { name: "Pode propor um exercício com variáveis?", exact: true }).click();
  await expect(main.getByRole("button", { name: "Editar mensagem" })).toHaveCount(2);
  await main.getByRole("button", { name: "Editar mensagem" }).first().click();
  const editor = main.getByRole("textbox", { name: "Editar mensagem" });
  await editor.fill("Como funcionam funções?");
  await main.getByRole("button", { name: "Salvar e reenviar" }).click();
  await expect(main.getByRole("alert")).toContainText("Não foi possível reenviar");
  await expect(main.getByText("Resposta para: Pode propor um exercício com variáveis?", { exact: true })).toBeVisible();
  await main.getByRole("button", { name: "Salvar e reenviar" }).click();
  await expect(editor).toHaveCount(0);
  await expect(main.getByRole("status").filter({ hasText: /Aguardando|Gerando/ })).toBeVisible();
  releaseEdit();
  await expect(main.getByText("Resposta para: Como funcionam funções?", { exact: true })).toBeVisible();
  expect(sent[sent.length - 1]).toMatchObject({ message: "Como funcionam funções?", sessionId: "conversation", editMessageId: "10000000-0000-4000-8000-000000000001" });
  await expect(main.getByText("Resposta para: Pode propor um exercício com variáveis?", { exact: true })).toHaveCount(0);
  await page.reload();
  await expect(main.getByText("Como funcionam funções?", { exact: true })).toBeVisible();
  await main.getByRole("button", { name: "Editar mensagem" }).click();
  await editor.fill("Rascunho descartado");
  await main.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(main.getByText("Como funcionam funções?", { exact: true })).toBeVisible();
  expect(sent).toHaveLength(4);
});

test("chat invites practice in an available matching quiz and opens that quiz", async ({ page }, testInfo) => {
  await mockApi(page);
  await page.route("**/api/chat/sessions/*/*/messages", route => route.fulfill({ json: [
    { id: "10000000-0000-4000-8000-000000000001", role: "user", content: "Ainda tenho dúvida sobre variáveis." },
    { id: "20000000-0000-4000-8000-000000000001", role: "assistant", content: "Uma variável guarda um valor." },
  ] }));
  await page.goto("/chat?session=practice");
  const invitation = page.getByRole("region", { name: "Que tal colocar em prática?" });
  await expect(invitation).toBeVisible();
  await expect(invitation).toContainText("Cada tentativa ajuda a aprender");
  const practice = invitation.getByRole("link", { name: "Praticar no quiz" });
  await expect(practice).toHaveAttribute("href", `/quiz/${ids.quiz}`);
  await page.screenshot({ path: testInfo.outputPath("quiz-practice-invitation.png"), fullPage: false });
  await practice.click();
  await expect(page).toHaveURL(new RegExp(`/quiz/${ids.quiz}$`));
  await expect(page.getByText("Qual é o valor original?")).toBeVisible();
});

test("chat respects dismissing practice and does not recommend an unrelated quiz", async ({ page }) => {
  await mockApi(page);
  let question = "Como usar variáveis?";
  await page.route("**/api/chat/sessions/*/*/messages", route => route.fulfill({ json: [
    { id: "10000000-0000-4000-8000-000000000001", role: "user", content: question },
    { id: "20000000-0000-4000-8000-000000000001", role: "assistant", content: "Vamos ver um exemplo." },
  ] }));
  await page.goto("/chat?session=practice-dismiss");
  await page.getByRole("button", { name: "Agora não" }).click();
  await expect(page.getByRole("link", { name: "Praticar no quiz" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByText("Como usar variáveis?", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Praticar no quiz" })).toHaveCount(0);
  question = "Como criar uma função?";
  await page.goto("/chat?session=unrelated");
  await expect(page.getByText(question, { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Praticar no quiz" })).toHaveCount(0);
});

test("a vectors question recommends a quiz registered with a free-form subject", async ({ page }) => {
  await mockApi(page);
  await page.route("**/api/quiz/student/hub", route => route.fulfill({ json: [
    { ...quiz, topic: "linguagem Python", title: "Quiz de linguagem Python", id: "python" },
    { ...quiz, topic: "Vetores, Matrizes e Arrays", title: "Vetores, Matrizes e Arrays – Quiz de Conceitos", attempted: true, bestScore: 0, bestTotalQuestions: 5 },
  ] }));
  await page.route("**/api/chat/sessions/*/*/messages", route => route.fulfill({ json: [
    { id: "10000000-0000-4000-8000-000000000001", role: "user", content: "Como usar vetores?" },
    { id: "20000000-0000-4000-8000-000000000001", role: "assistant", content: "Um vetor organiza elementos em posições que você acessa por um índice." },
  ] }));
  await page.goto("/chat?session=vectors");
  const invitation = page.getByRole("region", { name: "Que tal colocar em prática?" });
  await expect(invitation).toContainText("Vetores, Matrizes e Arrays – Quiz de Conceitos");
  await expect(invitation.getByRole("link", { name: "Praticar no quiz" })).toHaveAttribute("href", `/quiz/${ids.quiz}`);
});

test("home navigation is centered and the language selector keeps a fixed width", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const width of [320, 393, 1024, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const select = page.locator("header select");
    await expect(select).toHaveCSS("width", `${width >= 1280 ? 176 : width >= 1024 ? 144 : width >= 360 ? 128 : 96}px`);
    let expectedWidth: number | undefined;
    for (const language of ["pt-BR", "en-US", "es-ES", "system"]) {
      await select.selectOption(language);
      const bounds = await select.boundingBox();
      if (expectedWidth === undefined) expectedWidth = bounds!.width;
      expect(bounds!.width).toBe(expectedWidth);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const nav = page.locator("header nav:visible");
      if (width >= 1024) {
        const box = (await nav.boundingBox())!;
        expect(Math.abs(box.x + box.width / 2 - width / 2)).toBeLessThan(2);
        const actions = (await select.locator("xpath=../..").boundingBox())!;
        expect(box.x + box.width).toBeLessThanOrEqual(actions.x + 1);
      }
    }
  }
  await page.screenshot({ path: testInfo.outputPath("home-header.png"), fullPage: false });
});

test("home uses the new head, login adapts to the screen, and legacy preference migrates", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#animated-logo [data-robot-avatar]")).toHaveAttribute("data-variant", "head");
  await expect(page.locator("#animated-logo [data-robot-avatar]")).toHaveAttribute("data-renderer", "static");
  await page.goto("/signin");
  const loginRobot = page.locator("[data-robot-avatar]:visible");
  await expect(loginRobot).toHaveAttribute("data-variant", page.viewportSize()!.width >= 1024 ? "full" : "head");
  await page.evaluate(() => localStorage.setItem("logibot.preferences", JSON.stringify({ mascot: "hidden" })));
  await page.goto("/");
  await expect(page.locator("#animated-logo [data-robot-avatar]")).toHaveAttribute("data-renderer", "legacy");
});
