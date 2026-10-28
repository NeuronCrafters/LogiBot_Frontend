import type {
  AccessPatternData,
  DashboardInsightResponse,
  EffortMatrixData,
  LearningJourneyData,
  ProficiencyRadarData,
  SessionDetailsData,
  TopicPerformanceData,
} from "@/features/dashboard/types";
import type { DailyUsage, Session, UserAnalysisLog } from "@/features/dashboard/logTypes";

function isoDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function isoDateTime(daysAgo: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

// ── Uso diário (últimos 14 dias) ────────────────────────────────────────────────

const DAILY_MINUTES = [35, 48, 20, 62, 15, 0, 40, 55, 30, 70, 25, 58, 42, 66];

const dailyUsage: DailyUsage[] = DAILY_MINUTES.map((minutes, index) => {
  const daysAgo = DAILY_MINUTES.length - 1 - index;
  const date = isoDate(daysAgo);
  const sessions: Session[] =
    minutes === 0
      ? []
      : [
          {
            date,
            sessionStart: new Date(isoDateTime(daysAgo, 19, 0)),
            sessionEnd: new Date(isoDateTime(daysAgo, 19, minutes)),
            sessionDuration: minutes * 60,
            durationInMinutes: minutes,
            usage: minutes,
            formatted: `${minutes} min`,
            userId: "class-a",
            userName: "Class A",
            courseName: "Software Engineering",
            className: "Class A - Programming Logic 2026.1",
          },
        ];
  return { date, usage: minutes, formatted: `${minutes} min`, sessions };
});

const totalUsageSeconds = DAILY_MINUTES.reduce((sum, m) => sum + m, 0) * 60;

export const classUsageSummary: UserAnalysisLog = {
  totalCorrectAnswers: 138,
  totalWrongAnswers: 42,
  usageTimeInSeconds: totalUsageSeconds,
  usageTime: {
    totalSeconds: totalUsageSeconds,
    formatted: `${Math.floor(totalUsageSeconds / 3600)}h${Math.floor((totalUsageSeconds % 3600) / 60)}m`,
    humanized: `${Math.round(totalUsageSeconds / 60)} minutos`,
    hours: Math.floor(totalUsageSeconds / 3600),
    minutes: Math.round(totalUsageSeconds / 60),
    seconds: totalUsageSeconds,
  },
  subjectCounts: {
    variaveis: 45,
    tipos: 20,
    funcoes: 30,
    loops: 60,
    verificacoes: 25,
  },
  sessions: dailyUsage.flatMap((d) => d.sessions),
  dailyUsage,
};

// ── Desempenho por tópico ───────────────────────────────────────────────────────

export const topicPerformance: TopicPerformanceData[] = [
  { topic: "Variables", successPercentage: 82, errorPercentage: 18 },
  { topic: "Lists", successPercentage: 74, errorPercentage: 26 },
  { topic: "Conditionals", successPercentage: 88, errorPercentage: 12 },
  { topic: "Functions", successPercentage: 61, errorPercentage: 39 },
  { topic: "Logical Operators", successPercentage: 55, errorPercentage: 45 },
];

// ── Matriz de esforço x desempenho ──────────────────────────────────────────────

export const effortMatrix: EffortMatrixData = {
  points: [
    { name: "Ana Beatriz Souza", performance: 85, effort: 70 },
    { name: "Bruno Carvalho Lima", performance: 92, effort: 60 },
    { name: "Camila Ferreira Dias", performance: 68, effort: 80 },
    { name: "Diego Martins Rocha", performance: 45, effort: 40 },
    { name: "Elisa Nogueira Pinto", performance: 77, effort: 55 },
    { name: "Felipe Andrade Costa", performance: 30, effort: 20 },
  ],
  averages: { avgPerformance: 66, avgEffort: 54 },
};

// ── Radar de proficiência por tópico ────────────────────────────────────────────

export const proficiencyRadar: ProficiencyRadarData = {
  labels: ["Variables", "Lists", "Conditionals", "Functions", "Logical Operators"],
  data: [78, 65, 84, 58, 52],
};

// ── Jornada de aprendizado (evolução ao longo das semanas) ──────────────────────

export const learningJourney: LearningJourneyData = {
  labels: ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6", "Wk 7", "Wk 8"],
  data: [38, 44, 50, 55, 61, 68, 73, 79],
};

// ── Padrão de acesso (dia da semana x hora x contagem) ──────────────────────────

export const accessPattern: AccessPatternData = [
  [1, 19, 4], [1, 20, 6], [2, 19, 3], [2, 21, 5],
  [3, 18, 2], [3, 20, 7], [4, 19, 6], [4, 22, 3],
  [0, 15, 2], [5, 16, 4], [6, 14, 3], [6, 20, 5],
];

export const sessionDetails: SessionDetailsData[] = dailyUsage
  .flatMap((d) => d.sessions)
  .map((s) => ({
    startTime: s.sessionStart.toISOString(),
    endTime: s.sessionEnd.toISOString(),
  }));

// ── Insight de IA (resumo textual) ──────────────────────────────────────────────

export function buildInsight(): DashboardInsightResponse {
  return {
    insight: `## Overview\n\nClass A has kept a consistent study rhythm over the past weeks, with **566 minutes** of accumulated usage and steady progress in the learning journey — average proficiency rose from 38% in week 1 to **79% in week 8**.\n\n## Highlights\n\n- Solid mastery of **Conditionals** (88% accuracy) and **Variables** (82%), the two topics most practiced by the class.\n- Bruno Carvalho Lima and Elisa Nogueira Pinto stand out with high performance combined with a good level of effort, indicating efficient learning.\n- Usage peaks concentrate on Tuesday and Thursday evenings, suggesting that synchronous reinforcement sessions on those days would have higher attendance.\n\n## Points of attention\n\n- **Logical Operators** is the class's weakest topic, with a 45% error rate — well above the average of the other topics.\n- Diego Martins Rocha and Felipe Andrade Costa show below-average performance combined with low engagement (recorded effort below 40%).\n- Functions also deserve attention: a 39% error rate indicates that the concept of parameters and return values is not yet consolidated for part of the class.\n\n## Recommendations\n\n1. Reinforce Logical Operators with hands-on exercises combining \`and\`/\`or\`/\`not\` before the next assessment.\n2. Prioritize one-on-one contact with Diego and Felipe to understand the engagement barriers.\n3. Take advantage of peak hours (Tuesday and Thursday evenings) for tutoring sessions or live Q&A office hours.`,
    generatedAt: new Date().toISOString(),
    cached: false,
  };
}
