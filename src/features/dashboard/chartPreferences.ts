import { useResolvedPreferences, type TextSizePreference } from "@/shared/preferences";

const BASE_FONT_SIZE = 16;
const TEXT_SCALE: Record<TextSizePreference, number> = { default: 1, large: 1.125, larger: 1.25 };

/** Colors of the chart semantic tokens. They follow the theme and the chosen palette through CSS variables. */
export const CHART_COLORS = {
  positive: "rgb(var(--chart-positive))",
  negative: "rgb(var(--chart-negative))",
  warning: "rgb(var(--chart-warning))",
  info: "rgb(var(--chart-info))",
  primary: "rgb(var(--chart-primary))",
  accent: "rgb(var(--chart-accent))",
} as const;

/**
 * Root font size in pixels. Includes the text size preference and the browser's own font size setting,
 * so chart text follows every way the person enlarges text.
 */
export function rootFontSize(textSize: TextSizePreference, root: Element | null = typeof document === "undefined" ? null : document.documentElement) {
  if (root && typeof getComputedStyle === "function") {
    const value = getComputedStyle(root).fontSize;
    const size = value.endsWith("px") ? parseFloat(value) : NaN;
    if (Number.isFinite(size) && size > 0) return size;
  }
  return BASE_FONT_SIZE * TEXT_SCALE[textSize];
}

export function scaleFont(size: number, scale: number) {
  return Math.round(size * scale * 100) / 100;
}

/**
 * Reactive chart preferences. Components that use it re-render when a preference changes,
 * so charts that are already open follow motion and text size without a reload.
 */
export function useChartPreferences() {
  const resolved = useResolvedPreferences();
  const scale = rootFontSize(resolved.textSize) / BASE_FONT_SIZE;
  return {
    animate: !resolved.reduceMotion,
    scale,
    font: (size: number) => scaleFont(size, scale),
    space: (size: number) => Math.round(size * scale),
    palette: resolved.palette,
  };
}
