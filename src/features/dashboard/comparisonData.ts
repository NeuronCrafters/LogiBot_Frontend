import type { ChatSatisfactionData, EffortMatrixData, EngagementData, ExamComparisonData, ProficiencyRadarData, TopicPerformanceData } from "@/features/dashboard/types";

export interface TopicDifferenceRow { topic: string; a: number | null; b: number | null; diff: number | null }

/** Success rate of A minus B for every subject; subjects missing on one side have no difference. */
export function topicDifferences(a: TopicPerformanceData[], b: TopicPerformanceData[]): TopicDifferenceRow[] {
  const topics: string[] = [];
  for (const row of [...a, ...b]) if (topics.indexOf(row.topic) === -1) topics.push(row.topic);
  const value = (rows: TopicPerformanceData[], topic: string) => {
    const found = rows.find((row) => row.topic === topic);
    return found && Number.isFinite(found.successPercentage) ? found.successPercentage : null;
  };
  return topics
    .map((topic) => {
      const left = value(a, topic);
      const right = value(b, topic);
      return { topic, a: left, b: right, diff: left !== null && right !== null ? left - right : null };
    })
    .sort((x, y) => Math.abs(y.diff ?? -1) - Math.abs(x.diff ?? -1));
}

export interface RadarOverlayRow { subject: string; a: number | null; b: number | null }

/** Both selections on the same axes; a subject without answers on one side stays empty there. */
export function radarOverlay(a: ProficiencyRadarData, b: ProficiencyRadarData): RadarOverlayRow[] {
  const labels: string[] = [];
  for (const label of [...a.labels, ...b.labels]) if (labels.indexOf(label) === -1) labels.push(label);
  const value = (data: ProficiencyRadarData, label: string) => {
    const index = data.labels.indexOf(label);
    const score = index >= 0 ? data.data[index] : null;
    return typeof score === "number" && Number.isFinite(score) ? score : null;
  };
  return labels.map((subject) => ({ subject, a: value(a, subject), b: value(b, subject) }));
}

export const DISTRIBUTION_BANDS = [[0, 20], [20, 40], [40, 60], [60, 80], [80, 100]] as const;
export interface DistributionRow { band: string; from: number; to: number; aCount: number; bCount: number; aShare: number | null; bShare: number | null }

const assessed = (data: EffortMatrixData) =>
  data.points.filter((point) => !point.isAverage && point.performance !== null).map((point) => Math.min(100, Math.max(0, point.originalPerformance ?? point.performance!)));

/** Share of assessed students in each performance band, so groups of different sizes compare fairly. */
export function performanceDistribution(a: EffortMatrixData, b: EffortMatrixData): { rows: DistributionRow[]; aTotal: number; bTotal: number; aMedian: number | null; bMedian: number | null } {
  const left = assessed(a);
  const right = assessed(b);
  const band = (values: number[], from: number, to: number, last: boolean) => values.filter((value) => value >= from && (last ? value <= to : value < to)).length;
  const rows = DISTRIBUTION_BANDS.map(([from, to], index) => {
    const last = index === DISTRIBUTION_BANDS.length - 1;
    const aCount = band(left, from, to, last);
    const bCount = band(right, from, to, last);
    return { band: `${from}–${to}`, from, to, aCount, bCount, aShare: left.length ? aCount / left.length : null, bShare: right.length ? bCount / right.length : null };
  });
  return { rows, aTotal: left.length, bTotal: right.length, aMedian: median(left), bMedian: median(right) };
}

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = values.slice().sort((x, y) => x - y);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export interface WeekRow { week: string; a: number | null; b: number | null; aActive: number | null; bActive: number | null }

/** Weeks of both selections on one axis; a week without sessions on one side is 0% there. */
export function weeklyOverlay(a: EngagementData, b: EngagementData): WeekRow[] {
  const weeks = Array.from(new Set([...a.weeks, ...b.weeks].map((row) => row.week))).sort();
  const pick = (data: EngagementData, week: string) => data.weeks.find((row) => row.week === week);
  return weeks.map((week) => {
    const left = pick(a, week);
    const right = pick(b, week);
    return {
      week,
      a: a.students ? (left?.activeShare ?? 0) * 100 : null,
      b: b.students ? (right?.activeShare ?? 0) * 100 : null,
      aActive: a.students ? left?.activeStudents ?? 0 : null,
      bActive: b.students ? right?.activeStudents ?? 0 : null,
    };
  });
}

export type DifferenceKind = "topic" | "examGrade" | "examSubmission" | "engagement" | "chat";
export interface Difference {
  kind: DifferenceKind;
  /** Subject key for "topic"; empty otherwise. */
  key: string;
  a: number;
  b: number;
  /** A minus B in percentage points (grades 0–10 count ×10), so every kind can be ranked together. */
  points: number;
}

/** The largest gaps between A and B across subjects, exams, engagement and chat satisfaction. */
export function biggestDifferences(input: {
  topics?: TopicDifferenceRow[];
  exams?: [ExamComparisonData | undefined, ExamComparisonData | undefined];
  engagement?: [EngagementData | undefined, EngagementData | undefined];
  chat?: [ChatSatisfactionData | undefined, ChatSatisfactionData | undefined];
}, limit = 4): Difference[] {
  const found: Difference[] = [];
  for (const row of input.topics ?? []) {
    if (row.a !== null && row.b !== null) found.push({ kind: "topic", key: row.topic, a: row.a, b: row.b, points: row.a - row.b });
  }
  const [examA, examB] = input.exams ?? [];
  if (examA?.averageGrade != null && examB?.averageGrade != null)
    found.push({ kind: "examGrade", key: "", a: examA.averageGrade, b: examB.averageGrade, points: (examA.averageGrade - examB.averageGrade) * 10 });
  if (examA?.submissionRate != null && examB?.submissionRate != null)
    found.push({ kind: "examSubmission", key: "", a: examA.submissionRate * 100, b: examB.submissionRate * 100, points: (examA.submissionRate - examB.submissionRate) * 100 });
  const [engagementA, engagementB] = input.engagement ?? [];
  if (engagementA?.averageActiveShare != null && engagementB?.averageActiveShare != null)
    found.push({ kind: "engagement", key: "", a: engagementA.averageActiveShare * 100, b: engagementB.averageActiveShare * 100, points: (engagementA.averageActiveShare - engagementB.averageActiveShare) * 100 });
  const [chatA, chatB] = input.chat ?? [];
  if (chatA?.available && chatB?.available && chatA.score !== null && chatB.score !== null)
    found.push({ kind: "chat", key: "", a: chatA.score * 100, b: chatB.score * 100, points: (chatA.score - chatB.score) * 100 });
  return found
    .filter((item) => Math.abs(item.points) >= 0.5)
    .sort((x, y) => Math.abs(y.points) - Math.abs(x.points))
    .slice(0, limit);
}

/* An unexpected body (proxy, older server) must show "no data", never break the page. */
const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
export const asExams = (value: unknown): ExamComparisonData | undefined => (isObject(value) && Array.isArray(value.exams) ? (value as unknown as ExamComparisonData) : undefined);
export const asEngagement = (value: unknown): EngagementData | undefined => (isObject(value) && Array.isArray(value.weeks) ? (value as unknown as EngagementData) : undefined);
export const asChat = (value: unknown): ChatSatisfactionData | undefined => (isObject(value) && typeof value.available === "boolean" ? (value as unknown as ChatSatisfactionData) : undefined);
