import { getLanguage, t, date } from "@/i18n";
export function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function formatRelativeTime(value: Date): string {
  const seconds = (value.getTime() - Date.now()) / 1000;
  if (!Number.isFinite(seconds)) return "—";
  if (Math.abs(seconds) < 60) return t("common.lessThanMinute");
  const units: [Intl.RelativeTimeFormatUnit, number][] = [["year", 365 * 86400], ["month", 30 * 86400], ["day", 86400], ["hour", 3600], ["minute", 60]];
  const [unit, divisor] = units.find(([, size]) => Math.abs(seconds) >= size)!;
  return new Intl.RelativeTimeFormat(getLanguage(), { numeric: "always" }).format(Math.trunc(seconds / divisor), unit);
}

export function formatDuration(end: Date, start: Date): string {
  const seconds = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
  if (!Number.isFinite(seconds)) return "—";
  if (seconds >= 86400) return t("common.days", { count: Math.floor(seconds / 86400) });
  if (seconds >= 3600) return t("common.hours", { count: Math.floor(seconds / 3600) });
  if (seconds >= 60) return t("common.minutes", { count: Math.floor(seconds / 60) });
  return t("common.seconds", { count: seconds });
}

export function formatDateTime(value: Date): string {
  return date(value, { dateStyle: "short", timeStyle: "medium" });
}
