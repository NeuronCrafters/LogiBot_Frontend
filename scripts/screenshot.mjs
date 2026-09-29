// Sobe o Vite em modo mock e percorre as rotas de aluno/admin tirando
// screenshots desktop. Ver /Users/coelhomarcus/.claude/plans/robust-shimmying-karp.md
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = 5183;
const BASE = `http://localhost:${PORT}`;
const OUT_DIR = path.join(ROOT, "screenshots");

const STUDENT_EMAIL = "aluno@logibot.dev";
const STAFF_EMAIL = "admin@logibot.dev";
const PASSWORD = "logibot123";

const UNIVERSITY_NAME = "Universidade Federal de Tecnologia";
const COURSE_NAME = "Engenharia de Software";
const CLASS_A_NAME = "Turma A - Lógica de Programação 2026.1";

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function waitForServer(url, timeoutMs = 45_000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (async function poll() {
      try {
        const res = await fetch(url);
        if (res.ok || res.status < 500) return resolve();
      } catch {
        // ainda não está no ar
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Servidor não respondeu em ${timeoutMs}ms`));
        return;
      }
      setTimeout(poll, 400);
    })();
  });
}

async function settle(page, extraMs = 400) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(extraMs);
}

async function shot(page, dir, name) {
  const outDir = path.join(OUT_DIR, dir);
  ensureDir(outDir);
  await page.screenshot({ path: path.join(outDir, `${name}.png`) });
  console.log(`  📸 ${dir}/${name}.png`);
}

async function pick(page, buttonName, optionName) {
  await page.getByRole("button", { name: buttonName, exact: true }).click();
  await page.getByRole("option", { name: optionName }).first().click();
}

async function login(page, email) {
  await page.goto(`${BASE}/signin`);
  await page.locator("#signin-email-input").fill(email);
  await page.locator("#signin-password-input").fill(PASSWORD);
  await page.locator("#signin-submit-button").click();
  await page.waitForURL(/\/(chat|dashboard|home)/, { timeout: 15_000 });
  await settle(page);
}

// ── Fluxo público ───────────────────────────────────────────────────────────────

async function capturePublic(page) {
  console.log("→ Público");
  await page.goto(`${BASE}/`);
  await settle(page);
  await shot(page, "publico", "01-landing");

  await page.goto(`${BASE}/signin`);
  await settle(page, 200);
  await shot(page, "publico", "02-signin");

  await page.goto(`${BASE}/signup`);
  await settle(page, 200);
  await shot(page, "publico", "03-signup");
}

// ── Fluxo aluno ──────────────────────────────────────────────────────────────────

async function captureAluno(page) {
  console.log("→ Aluno");
  await login(page, STUDENT_EMAIL);
  await shot(page, "aluno", "01-chat-novo");

  await page.goto(`${BASE}/chat?session=session-logica-loops`);
  await settle(page);
  await shot(page, "aluno", "02-chat-conversa");

  await page.goto(`${BASE}/quiz`);
  await settle(page);
  await shot(page, "aluno", "03-quiz-hub");

  await page.goto(`${BASE}/quiz/quiz-condicionais`);
  await settle(page);
  await shot(page, "aluno", "04-quiz-pergunta");

  const content = page.locator("section").nth(1);
  const answers = [
    { option: "if", isLast: false },
    { option: "Testar uma condição adicional caso a anterior seja falsa", isLast: false },
    { option: "and", isLast: false },
    { option: "O caminho executado quando nenhuma condição anterior é verdadeira", isLast: true },
  ];
  for (const { option, isLast } of answers) {
    await content.getByRole("button", { name: option }).click();
    await content
      .getByRole("button", { name: isLast ? "Finalizar" : "Próxima" })
      .click();
  }
  await page.getByText("Aproveitamento").waitFor({ timeout: 10_000 });
  await settle(page);
  await shot(page, "aluno", "05-quiz-resultado");

  await page.goto(`${BASE}/profile`);
  await settle(page);
  await shot(page, "aluno", "06-perfil");
}

// ── Fluxo admin/professor ────────────────────────────────────────────────────────

async function captureAdmin(page) {
  console.log("→ Admin/Professor");
  await login(page, STAFF_EMAIL);

  // Dashboard: selecionar Turma (universidade já vem pré-selecionada pelo usuário) → Curso → Turma A
  await pick(page, "Selecione uma Entidade", "Turma");
  await pick(page, "Selecione o Curso", COURSE_NAME);
  await pick(page, "Selecione a turma", CLASS_A_NAME);
  await page.getByText("Tempo de Uso Diário").waitFor({ timeout: 10_000 });
  await settle(page, 800);
  await shot(page, "admin", "01-dashboard");

  try {
    await page.getByRole("button", { name: "Gerar análise geral" }).click();
    await settle(page, 800);
    await shot(page, "admin", "02-dashboard-insight");
  } catch {
    console.log("  (insight de IA indisponível, seguindo)");
  }

  // Gestão de quizzes
  await page.goto(`${BASE}/quiz/manage`);
  await settle(page);
  await shot(page, "admin", "03-quiz-manage");

  const variaveisCard = page
    .locator("div")
    .filter({ hasText: "Quiz de Variáveis e Tipos" })
    .filter({ has: page.getByRole("button", { name: "Perguntas" }) })
    .last();
  await variaveisCard.getByRole("button", { name: "Perguntas" }).click();
  await settle(page, 300);
  await variaveisCard.getByRole("button", { name: "Resultados" }).click();
  await page.getByText("Resultados do Quiz").waitFor({ timeout: 10_000 });
  await settle(page, 300);
  await shot(page, "admin", "04-quiz-manage-resultados");
  await page.keyboard.press("Escape").catch(() => {});

  // RAG
  await page.goto(`${BASE}/rag`);
  await settle(page, 800);
  await page.getByRole("button", { name: "Documentos", exact: true }).click();
  await settle(page, 300);
  await shot(page, "admin", "05-rag-documentos");

  await page.getByRole("button", { name: "Chat de Teste", exact: true }).click();
  await settle(page, 300);
  const ragInput = page.getByPlaceholder("Digite sua pergunta... (Enter para enviar)");

  await ragInput.fill("Qual a diferença entre for e while?");
  await page.keyboard.press("Enter");
  await page.getByText("Estruturas de repetição").waitFor({ timeout: 10_000 });
  await settle(page, 300);

  await ragInput.fill("E como funciona uma lista em Python?");
  await page.keyboard.press("Enter");
  await page.getByText("Listas em Python são coleções").waitFor({ timeout: 10_000 });
  await settle(page, 300);
  await shot(page, "admin", "06-rag-chat");

  // Entidades — listagem
  await page.goto(`${BASE}/entities`);
  await settle(page);
  await pick(page, "Selecione", "Alunos por Turma");
  await pick(page, "Selecione a universidade", UNIVERSITY_NAME);
  await pick(page, "Selecione o curso", COURSE_NAME);
  await pick(page, "Selecione a disciplina", "Lógica de Programação");
  await pick(page, "Selecione a turma", CLASS_A_NAME);
  await page.getByRole("button", { name: "Pesquisar" }).click();
  await settle(page, 500);
  await shot(page, "admin", "07-entidades-lista");

  // Entidades — gestão
  await page.goto(`${BASE}/entities/manage`);
  await settle(page);
  await pick(page, "Selecione", UNIVERSITY_NAME);
  await pick(page, "Selecione", COURSE_NAME);
  await settle(page, 500);
  await shot(page, "admin", "08-entidades-gestao");

  // Entidades — criar turma
  await page.goto(`${BASE}/entities/create/class`);
  await settle(page);
  await page.getByPlaceholder("Ex: Turma A — 2024").fill("Turma C - Lógica de Programação 2026.2");
  await pick(page, "Selecione a universidade", UNIVERSITY_NAME);
  await pick(page, "Selecione o curso", COURSE_NAME);
  await settle(page, 300);
  await shot(page, "admin", "09-entidades-criar");

  await page.goto(`${BASE}/profile`);
  await settle(page);
  await shot(page, "admin", "10-perfil");
}

// ── Main ─────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Iniciando servidor Vite em modo mock...");
  const server = spawn(
    "npx",
    ["vite", "--port", String(PORT), "--strictPort"],
    {
      cwd: ROOT,
      env: { ...process.env, VITE_MOCK_MODE: "true" },
      stdio: "pipe",
    },
  );
  server.stdout.on("data", () => {});
  server.stderr.on("data", (d) => process.stderr.write(d));

  try {
    await waitForServer(BASE);
    console.log("Servidor no ar. Abrindo Chromium...");

    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    await capturePublic(page);
    await captureAluno(page);
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear()).catch(() => {});
    await captureAdmin(page);

    await browser.close();
    console.log(`\nConcluído. Screenshots em ${OUT_DIR}`);
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
