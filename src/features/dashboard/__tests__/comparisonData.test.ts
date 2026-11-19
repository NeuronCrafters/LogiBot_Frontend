import { describe, expect, it } from "vitest";
import { median, performanceDistribution, radarOverlay, topicDifferences } from "@/features/dashboard/comparisonData";

describe("comparison data", () => {
  it("subtracts B from A per subject and keeps subjects of one side without a difference", () => {
    const rows = topicDifferences(
      [{ topic: "condicionais", successPercentage: 80, errorPercentage: 20 }, { topic: "laços", successPercentage: 50, errorPercentage: 50 }],
      [{ topic: "condicionais", successPercentage: 60, errorPercentage: 40 }, { topic: "vetores", successPercentage: 70, errorPercentage: 30 }],
    );
    expect(rows[0]).toEqual({ topic: "condicionais", a: 80, b: 60, diff: 20 });
    expect(rows.find((row) => row.topic === "vetores")).toEqual({ topic: "vetores", a: null, b: 70, diff: null });
    expect(rows.find((row) => row.topic === "laços")!.diff).toBeNull();
  });

  it("puts both selections on the same radar axes", () => {
    expect(radarOverlay({ labels: ["a", "b"], data: [70, null] }, { labels: ["b", "c"], data: [40, 90] })).toEqual([
      { subject: "a", a: 70, b: null }, { subject: "b", a: null, b: 40 }, { subject: "c", a: null, b: 90 },
    ]);
  });

  it("shares students per band, ignoring averages and students without answers", () => {
    const point = (performance: number | null, extra = {}) => ({ name: "x", performance, effort: 1, ...extra });
    const result = performanceDistribution(
      { points: [point(10), point(55), point(100), point(null), point(30, { isAverage: true })], averages: { avgPerformance: 0, avgEffort: 0 } },
      { points: [point(85), point(95)], averages: { avgPerformance: 0, avgEffort: 0 } },
    );
    expect(result.aTotal).toBe(3);
    expect(result.rows.map((row) => row.aCount)).toEqual([1, 0, 1, 0, 1]);
    expect(result.rows[4]).toMatchObject({ bCount: 2, bShare: 1 });
    expect(result.aMedian).toBe(55);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([])).toBeNull();
  });
});

describe("comparação: semanas, maiores diferenças e formato das respostas", () => {
  const engagement = (students: number, weeks: Array<[string, number, number]>) => ({
    students, averageActiveShare: null,
    weeks: weeks.map(([week, active, share]) => ({ week, activeStudents: active, sessions: active, minutes: active * 10, activeShare: share })),
  });

  it("alinha as semanas das duas seleções e usa 0% onde um lado não teve sessão", async () => {
    const { weeklyOverlay } = await import("@/features/dashboard/comparisonData");
    const rows = weeklyOverlay(engagement(10, [["2026-11-02", 5, 0.5]]), engagement(4, [["2026-11-09", 2, 0.5]]));
    expect(rows).toEqual([
      { week: "2026-11-02", a: 50, b: 0, aActive: 5, bActive: 0 },
      { week: "2026-11-09", a: 0, b: 50, aActive: 0, bActive: 2 },
    ]);
    expect(weeklyOverlay(engagement(0, []), engagement(3, [["2026-11-02", 1, 1 / 3]]))[0].a).toBeNull();
  });

  it("ordena as maiores diferenças de todos os tipos em pontos percentuais", async () => {
    const { biggestDifferences } = await import("@/features/dashboard/comparisonData");
    const exam = (grade: number, rate: number) => ({ exams: [], expected: 10, submitted: 5, averageGrade: grade, submissionRate: rate });
    const chat = (score: number) => ({ available: true as const, days: 30, disciplineIgnored: false, total: 10, up: 5, partial: 3, down: 2, score, byTopic: [] });
    const result = biggestDifferences({
      topics: [{ topic: "funcoes", a: 80, b: 50, diff: 30 }, { topic: "listas", a: 60, b: null, diff: null }, { topic: "variaveis", a: 70, b: 70.2, diff: -0.2 }],
      exams: [exam(6, 0.9), exam(8, 0.5)],
      engagement: [{ students: 5, weeks: [], averageActiveShare: 0.4 }, { students: 5, weeks: [], averageActiveShare: 0.35 }],
      chat: [chat(0.7), { available: false, reason: "small", total: 2, minGroupSize: 5 }],
    });
    // Submission +40 p.p., subject +30, grade −2 points (= −20 p.p.), engagement +5; tiny gaps and hidden chat are left out.
    expect(result.map((item) => [item.kind, Math.round(item.points)])).toEqual([["examSubmission", 40], ["topic", 30], ["examGrade", -20], ["engagement", 5]]);
  });

  it("trata corpo inesperado como ausência de dados", async () => {
    const { asChat, asEngagement, asExams } = await import("@/features/dashboard/comparisonData");
    expect(asExams([])).toBeUndefined();
    expect(asEngagement({})).toBeUndefined();
    expect(asChat(null)).toBeUndefined();
    expect(asChat({ available: false, reason: "student" })).toEqual({ available: false, reason: "student" });
  });
});
