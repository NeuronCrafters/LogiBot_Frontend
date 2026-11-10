import { test, expect } from "@playwright/test";
import { mockApi, ids, selectLanguage } from "./fixtures";

test("university scope loads summaries without an administrator school and preserves real topics", async ({ page }) => {
  const requests = await mockApi(page, "admin", { school: "", schoolId: [] });
  await page.route("**/api/dashboard/proficiency-radar", (route) => route.fulfill({ json: { labels: ["Estruturas de Repetição", "Vetores, Matrizes e Arrays", "linguagem Python", "Assunto cadastrado sem respostas"], data: [72, 60, 60, null] } }));
  await page.goto("/dashboard");
  await selectLanguage(page, "pt-BR");
  await page.getByRole("combobox", { name: "Selecione uma Entidade", exact: true }).click();
  await page.getByRole("option", { name: "Universidade", exact: true }).click();
  await page.getByRole("combobox", { name: "Selecione a universidade", exact: true }).click();
  await page.getByRole("option", { name: "Universidade original", exact: true }).click();
  await expect(page.locator("#usage-chart")).toContainText("0:01:00:00");
  await expect(page.locator("#correct-wrong-chart")).toContainText("8");
  await expect(page.locator("#category-chart")).toContainText("4");
  await expect(page.locator("#proficiency-radar-chart")).toContainText("Estruturas de Repetição");
  await expect(page.locator("#proficiency-radar-chart .recharts-polar-angle-axis-tick")).toHaveCount(4);
  await expect(page.locator("#proficiency-radar-chart .recharts-radar-dots circle")).toHaveCount(3);
  await expect(page.locator("#proficiency-radar-chart")).toContainText("64,0%");
  const summaries = requests.filter((request) => request.path === "/logs/students/summary");
  expect(summaries.length).toBeGreaterThan(0);
  for (const request of summaries) expect(request.body).toEqual({ universityId: ids.university });
  await expect(page.locator('input[type="date"]')).toHaveCount(0);
  expect(requests.filter((request) => request.path === "/dashboard/learning-journey").every((request) => !request.body.startDate && !request.body.endDate)).toBe(true);
});

test("zero is an assessed score, while students without answers have no performance quadrant", async ({ page }) => {
  await mockApi(page, "admin");
  await page.route("**/api/dashboard/proficiency-radar", (route) => route.fulfill({ json: { labels: ["linguagem Python"], data: [0] } }));
  await page.route("**/api/dashboard/topic-performance", (route) => route.fulfill({ json: [{ topic: "linguagem Python", successPercentage: 0, errorPercentage: 100 }] }));
  await page.route("**/api/dashboard/effort-matrix", (route) => route.fulfill({ json: { points: [{ name: "Sem quiz", performance: null, effort: 0.3 }], unassessedCount: 1, averages: { avgPerformance: 0, avgEffort: 0 } } }));
  await page.goto("/dashboard");
  await selectLanguage(page, "pt-BR");
  await page.getByRole("combobox", { name: "Selecione uma Entidade", exact: true }).click();
  await page.getByRole("option", { name: "Universidade", exact: true }).click();
  await page.getByRole("combobox", { name: "Selecione a universidade", exact: true }).click();
  await page.getByRole("option", { name: "Universidade original", exact: true }).click();
  await expect(page.locator("#general-score-card")).toContainText("0,00");
  await expect(page.locator("#general-score-card")).not.toContainText("Cada assunto tem o mesmo peso");
  await page.locator("#general-score-card").getByRole("button", { name: "Informações sobre o gráfico", exact: true }).click();
  await expect(page.locator("#general-score-card")).toContainText("Cada assunto tem o mesmo peso");
  await expect(page.locator("#proficiency-radar-chart")).toContainText("linguagem Python");
  await expect(page.locator("#proficiency-radar-chart")).not.toContainText("Nenhum dado de proficiência");
  await expect(page.locator("#effort-matrix-chart")).toContainText("1 aluno(s) sem respostas de quiz");
  await expect(page.locator("#effort-matrix-chart .recharts-scatter-symbol")).toHaveCount(0);
});
