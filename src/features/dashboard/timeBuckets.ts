/** Grouping that keeps time charts readable at any width, instead of scrolling them sideways. */
export type Granularity = "day" | "week" | "month";

export const DAILY_LIMIT_DAYS = 45;
export const WEEKLY_LIMIT_DAYS = 210;
const DAY = 86400000;

const parseDay = (value: string) => new Date(`${value.slice(0, 10)}T00:00:00Z`);
const isoDay = (date: Date) => date.toISOString().slice(0, 10);

/** Days covered: the chosen period, or the first to the last day with data. */
export function spanInDays(dates: string[], period?: { startDate?: string; endDate?: string }): number {
  const sorted = dates.map((date) => date.slice(0, 10)).sort();
  const start = period?.startDate ?? sorted[0];
  const end = period?.endDate ?? sorted[sorted.length - 1];
  if (!start || !end) return 0;
  return Math.round((parseDay(end).getTime() - parseDay(start).getTime()) / DAY) + 1;
}

export function granularityFor(days: number): Granularity {
  if (days <= DAILY_LIMIT_DAYS) return "day";
  if (days <= WEEKLY_LIMIT_DAYS) return "week";
  return "month";
}

/** First day of the bucket (weeks start on Monday). */
export function bucketStart(value: string, granularity: Granularity): string {
  const date = parseDay(value);
  if (granularity === "week") date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  if (granularity === "month") date.setUTCDate(1);
  return isoDay(date);
}

export interface UsageRow { date: string; usage?: number; sessions?: unknown[] }
export interface UsageBucket { date: string; usage: number; sessions: unknown[]; days: number }

/** Sums minutes (and joins sessions) per day, week or month. */
export function groupUsage(rows: UsageRow[], granularity: Granularity): UsageBucket[] {
  const buckets: Record<string, UsageBucket> = {};
  for (const row of rows) {
    const key = bucketStart(row.date, granularity);
    if (!buckets[key]) buckets[key] = { date: key, usage: 0, sessions: [], days: 0 };
    buckets[key].usage += typeof row.usage === "number" ? row.usage : 0;
    buckets[key].sessions = buckets[key].sessions.concat(row.sessions ?? []);
    buckets[key].days += 1;
  }
  return Object.keys(buckets).sort().map((key) => buckets[key]);
}

export const JOURNEY_RECENT = 10;
export const JOURNEY_GROUP_ABOVE = 30;
export const JOURNEY_GROUP_SIZE = 5;

export interface JourneyPoint { name: string; shortName: string; performance: number; deltaFromPrevious: number | null }

/**
 * The last ten quizzes by default; everything on request, averaged in groups of five
 * when there are too many points to read.
 */
export function journeyWindow(points: JourneyPoint[], showAll: boolean): { points: JourneyPoint[]; grouped: boolean } {
  if (!showAll) return { points: withDeltas(points.slice(-JOURNEY_RECENT)), grouped: false };
  if (points.length <= JOURNEY_GROUP_ABOVE) return { points, grouped: false };
  const groups: JourneyPoint[] = [];
  for (let index = 0; index < points.length; index += JOURNEY_GROUP_SIZE) {
    const slice = points.slice(index, index + JOURNEY_GROUP_SIZE);
    const average = slice.reduce((sum, point) => sum + point.performance, 0) / slice.length;
    const first = slice[0].shortName;
    const last = slice[slice.length - 1].shortName;
    groups.push({ name: slice.length > 1 ? `${slice[0].name} – ${slice[slice.length - 1].name}` : slice[0].name, shortName: slice.length > 1 ? `${first}–${last.replace(/^Q/, "")}` : first, performance: Number(average.toFixed(1)), deltaFromPrevious: null });
  }
  return { points: withDeltas(groups), grouped: true };
}

function withDeltas(points: JourneyPoint[]): JourneyPoint[] {
  return points.map((point, index) => ({ ...point, deltaFromPrevious: index === 0 ? null : Number((point.performance - points[index - 1].performance).toFixed(1)) }));
}

export type PeriodPreset = "all" | "7" | "30" | "90" | "180" | "custom";

/** Dates sent to the API (yyyy-mm-dd, both ends included) for a preset, counted back from today. */
export function periodRange(preset: PeriodPreset, custom: { startDate?: string; endDate?: string }, today = new Date()): { startDate?: string; endDate?: string } {
  if (preset === "all") return {};
  if (preset === "custom") return { startDate: custom.startDate || undefined, endDate: custom.endDate || undefined };
  const end = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const start = new Date(end.getTime() - (Number(preset) - 1) * DAY);
  return { startDate: isoDay(start), endDate: isoDay(end) };
}
