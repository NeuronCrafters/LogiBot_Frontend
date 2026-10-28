// Starts Vite in mock mode and walks through the student/admin routes taking
// desktop screenshots (English UI, for the article).
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

const STUDENT_EMAIL = "student@logibot.dev";
const STAFF_EMAIL = "admin@logibot.dev";
const PASSWORD = "logibot123";

const UNIVERSITY_NAME = "Federal University of Technology";
const COURSE_NAME = "Software Engineering";
const CLASS_A_NAME = "Class A - Programming Logic 2026.1";

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
        // not up yet
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Server did not respond in ${timeoutMs}ms`));
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

// ── Public flow ───────────────────────────────────────────────────────────────

async function capturePublic(page) {
  console.log("→ Public");
  await page.goto(`${BASE}/`);
  await settle(page);
  await shot(page, "public", "01-landing");

  await page.goto(`${BASE}/signin`);
  await settle(page, 200);
  await shot(page, "public", "02-signin");

  await page.goto(`${BASE}/signup`);
  await settle(page, 200);
  await shot(page, "public", "03-signup");
}

// ── Student flow ──────────────────────────────────────────────────────────────────

async function captureStudent(page) {
  console.log("→ Student");
  await login(page, STUDENT_EMAIL);
  await shot(page, "student", "01-chat-new");

  await page.goto(`${BASE}/chat?session=session-logica-loops`);
  await settle(page);
  await shot(page, "student", "02-chat-conversation");

  await page.goto(`${BASE}/quiz`);
  await settle(page);
  await shot(page, "student", "03-quiz-hub");

  await page.goto(`${BASE}/quiz/quiz-condicionais`);
  await settle(page);
  await shot(page, "student", "04-quiz-question");

  const content = page.locator("section").nth(1);
  const answers = [
    { option: "if", isLast: false },
    { option: "Test an additional condition if the previous one is false", isLast: false },
    { option: "and", isLast: false },
    { option: "The path executed when no previous condition is true", isLast: true },
  ];
  for (const { option, isLast } of answers) {
    await content.getByRole("button", { name: option }).click();
    await content
      .getByRole("button", { name: isLast ? "Finish" : "Next" })
      .click();
  }
  await page.getByText("Score").first().waitFor({ timeout: 10_000 });
  await settle(page);
  await shot(page, "student", "05-quiz-result");

  await page.goto(`${BASE}/profile`);
  await settle(page);
  await shot(page, "student", "06-profile");
}

// ── Admin/professor flow ────────────────────────────────────────────────────────

async function captureAdmin(page) {
  console.log("→ Admin/Professor");
  await login(page, STAFF_EMAIL);

  // Dashboard: pick Class (university comes pre-selected from the user) → Program → Class A
  await pick(page, "Select an Entity", "Class");
  await pick(page, "Select the Program", COURSE_NAME);
  await pick(page, "Select the class", CLASS_A_NAME);
  await page.getByText("Daily Usage Time").waitFor({ timeout: 10_000 });
  await settle(page, 800);
  await shot(page, "admin", "01-dashboard");

  try {
    await page.getByRole("button", { name: "Generate overall analysis" }).click();
    await settle(page, 800);
    await shot(page, "admin", "02-dashboard-insight");
  } catch {
    console.log("  (AI insight unavailable, continuing)");
  }

  // Quiz management
  await page.goto(`${BASE}/quiz/manage`);
  await settle(page);
  await shot(page, "admin", "03-quiz-manage");

  const variaveisCard = page
    .locator("div")
    .filter({ hasText: "Variables and Types Quiz" })
    .filter({ has: page.getByRole("button", { name: "Questions" }) })
    .last();
  await variaveisCard.getByRole("button", { name: "Questions" }).click();
  await settle(page, 300);
  await variaveisCard.getByRole("button", { name: "Results" }).click();
  await page.getByText("Quiz Results").waitFor({ timeout: 10_000 });
  await settle(page, 300);
  await shot(page, "admin", "04-quiz-manage-results");
  await page.keyboard.press("Escape").catch(() => {});

  // RAG
  await page.goto(`${BASE}/rag`);
  await settle(page, 800);
  await page.getByRole("button", { name: "Documents", exact: true }).click();
  await settle(page, 300);
  await shot(page, "admin", "05-rag-documents");

  await page.getByRole("button", { name: "Test Chat", exact: true }).click();
  await settle(page, 300);
  const ragInput = page.getByPlaceholder("Type your question... (Enter to send)");

  await ragInput.fill("What is the difference between for and while?");
  await page.keyboard.press("Enter");
  await page.getByText("Loop structures").first().waitFor({ timeout: 10_000 });
  await settle(page, 300);

  await ragInput.fill("And how does a list work in Python?");
  await page.keyboard.press("Enter");
  await page.getByText("Lists in Python are ordered, mutable collections").first().waitFor({ timeout: 10_000 });
  await settle(page, 300);
  await shot(page, "admin", "06-rag-chat");

  // Entities — listing
  await page.goto(`${BASE}/entities`);
  await settle(page);
  await pick(page, "Select", "Students by Class");
  await pick(page, "Select the university", UNIVERSITY_NAME);
  await pick(page, "Select the program", COURSE_NAME);
  await pick(page, "Select the subject", "Programming Logic");
  await pick(page, "Select the class", CLASS_A_NAME);
  await page.getByRole("button", { name: "Search" }).click();
  await settle(page, 500);
  await shot(page, "admin", "07-entities-list");

  // Entities — management
  await page.goto(`${BASE}/entities/manage`);
  await settle(page);
  await pick(page, "Select", UNIVERSITY_NAME);
  await pick(page, "Select", COURSE_NAME);
  await settle(page, 500);
  await shot(page, "admin", "08-entities-management");

  // Entities — create class
  await page.goto(`${BASE}/entities/create/class`);
  await settle(page);
  await page.getByPlaceholder("e.g. Class A — 2024").fill("Class C - Programming Logic 2026.2");
  await pick(page, "Select the university", UNIVERSITY_NAME);
  await pick(page, "Select the program", COURSE_NAME);
  await settle(page, 300);
  await shot(page, "admin", "09-entities-create");

  await page.goto(`${BASE}/profile`);
  await settle(page);
  await shot(page, "admin", "10-profile");
}

// ── Main ─────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Starting Vite dev server in mock mode...");
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
    console.log("Server is up. Launching Chromium...");

    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    await capturePublic(page);
    await captureStudent(page);
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear()).catch(() => {});
    await captureAdmin(page);

    await browser.close();
    console.log(`\nDone. Screenshots in ${OUT_DIR}`);
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
