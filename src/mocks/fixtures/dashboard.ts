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
            userName: "Turma A",
            courseName: "Engenharia de Software",
            className: "Turma A - Lógica de Programação 2026.1",
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
  { topic: "Variáveis", successPercentage: 82, errorPercentage: 18 },
  { topic: "Listas", successPercentage: 74, errorPercentage: 26 },
  { topic: "Condicionais", successPercentage: 88, errorPercentage: 12 },
  { topic: "Funções", successPercentage: 61, errorPercentage: 39 },
  { topic: "Operadores Lógicos", successPercentage: 55, errorPercentage: 45 },
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
  labels: ["Variáveis", "Listas", "Condicionais", "Funções", "Operadores Lógicos"],
  data: [78, 65, 84, 58, 52],
};

// ── Jornada de aprendizado (evolução ao longo das semanas) ──────────────────────

export const learningJourney: LearningJourneyData = {
  labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Sem 6", "Sem 7", "Sem 8"],
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
    insight: `## Panorama geral

A Turma A vem mantendo um ritmo consistente de estudo ao longo das últimas semanas, com **566 minutos** de uso acumulado e evolução constante na jornada de aprendizado — a proficiência média subiu de 38% na semana 1 para **79% na semana 8**.

## Pontos de destaque

- Domínio sólido em **Condicionais** (88% de acerto) e **Variáveis** (82%), os dois tópicos mais praticados pela turma.
- Bruno Carvalho Lima e Elisa Nogueira Pinto se destacam com alto desempenho aliado a bom nível de esforço, indicando aprendizado eficiente.
- Os picos de uso concentram-se às terças e quintas à noite, sugerindo que reforços síncronos nesses dias teriam maior adesão.

## Pontos de atenção

- **Operadores Lógicos** é o tópico mais frágil da turma, com 45% de taxa de erro — bem acima da média dos demais assuntos.
- Diego Martins Rocha e Felipe Andrade Costa apresentam desempenho abaixo da média combinado com baixo engajamento (esforço registrado abaixo de 40%).
- Funções também merece atenção: 39% de erro indica que o conceito de parâmetros e retorno ainda não está consolidado para parte da turma.

## Recomendações

1. Reforçar Operadores Lógicos com exercícios práticos de combinação \`and\`/\`or\`/\`not\` antes da próxima avaliação.
2. Priorizar contato individual com Diego e Felipe para entender as barreiras de engajamento.
3. Aproveitar os horários de pico (terças e quintas à noite) para monitorias ou plantões de dúvidas ao vivo.`,
    generatedAt: new Date().toISOString(),
    cached: false,
  };
}
