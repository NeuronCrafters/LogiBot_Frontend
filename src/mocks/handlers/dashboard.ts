import { http, HttpResponse } from "msw";
import {
  accessPattern,
  buildInsight,
  classUsageSummary,
  effortMatrix,
  learningJourney,
  proficiencyRadar,
  sessionDetails,
  topicPerformance,
} from "../fixtures/dashboard";

export const dashboardHandlers = [
  // ── Resumos por entidade (usados por Uso/Acertos/Categorias) ─────────────────
  http.get("*/logs/universities/:id/summary", () => HttpResponse.json(classUsageSummary)),
  http.get("*/logs/courses/:id/summary", () => HttpResponse.json(classUsageSummary)),
  http.get("*/logs/classes/:id/summary", () => HttpResponse.json(classUsageSummary)),
  http.get("*/logs/disciplines/:id/summary", () => HttpResponse.json(classUsageSummary)),
  http.post("*/logs/students/summary", () => HttpResponse.json(classUsageSummary)),

  // ── Gráficos avançados do dashboard ───────────────────────────────────────────
  http.post("*/dashboard/topic-performance", () => HttpResponse.json(topicPerformance)),
  http.post("*/dashboard/effort-matrix", () => HttpResponse.json(effortMatrix)),
  http.post("*/dashboard/proficiency-radar", () => HttpResponse.json(proficiencyRadar)),
  http.post("*/dashboard/learning-journey", () => HttpResponse.json(learningJourney)),
  http.post("*/dashboard/access-pattern", () => HttpResponse.json(accessPattern)),
  http.post("*/dashboard/session-details", () => HttpResponse.json(sessionDetails)),

  // ── Insights de IA ────────────────────────────────────────────────────────────
  http.post("*/dashboard/insights/chart", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { chart?: string };
    return HttpResponse.json({ ...buildInsight(), chart: body.chart });
  }),
  http.post("*/dashboard/insights/overview", () => HttpResponse.json(buildInsight())),
];
