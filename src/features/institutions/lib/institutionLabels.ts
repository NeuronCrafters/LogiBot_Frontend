import { t, type MessageKey } from "@/i18n";
import { baseURL } from "@/shared/api/httpClient";
import { conceptLabel } from "@/features/exercises/lib/logicLabels";
import type { FieldIssue, InstitutionKind } from "@/features/institutions/api/institutionsApi";

export const kindLabel = (kind: InstitutionKind) => t(`institutions.kind.${kind}` as MessageKey);

/** Only the first letter in upper case ("Entrada e saída"). */
export function conceptName(concept: string) {
  const label = conceptLabel(concept);
  return label.charAt(0).toLocaleUpperCase(document.documentElement.lang || undefined) + label.slice(1);
}

export const percent = (value: number) => new Intl.NumberFormat(document.documentElement.lang || undefined, { style: "percent", maximumFractionDigits: 0 }).format(value);

/** Message of a field problem returned by the API (shared by the institution and profile forms). */
export function fieldIssueMessage(issue: FieldIssue) {
  return t(`institutions.issue.${issue.code}` as MessageKey, issue.params ?? {});
}

/** Rate levels with the chart palette (follows the accessibility colours) and their own icon. */
export type Level = "good" | "attention" | "low";
export const levelOf = (value: number): Level => (value >= 0.75 ? "good" : value >= 0.5 ? "attention" : "low");
export const LEVEL_FILL: Record<Level, string> = { good: "bg-chart-positive", attention: "bg-chart-warning", low: "bg-chart-negative" };
export const LEVEL_INK: Record<Level, string> = { good: "text-chart-positive-ink", attention: "text-chart-warning-ink", low: "text-chart-negative-ink" };

/** Letters shown when an institution has no logo. */
export const institutionInitials = (name: string) =>
  name.replace(/\(.*?\)/g, "").split(/\s+/).filter((word) => word.length > 2 || /^[A-Z]/.test(word)).map((word) => word[0]).slice(0, 2).join("").toUpperCase() || "?";

/** OpenStreetMap: page of the point (new tab) and the embedded map around it. */
export const mapLink = (latitude: number, longitude: number) =>
  `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`;
export function mapEmbed(latitude: number, longitude: number) {
  const pad = 0.006;
  const bbox = [longitude - pad, latitude - pad / 2, longitude + pad, latitude + pad / 2].map((value) => value.toFixed(6)).join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;
}

/** Whether the institution has anything to show in the location card. */
export const hasLocation = (data: { address: string | null; district?: string | null; postalCode: string | null; city: string | null; state: string | null; country: string | null; latitude: number | null; longitude: number | null }) =>
  !!(data.address || data.district || data.postalCode || data.city || data.state || data.country || (data.latitude !== null && data.longitude !== null));

/** Stored institution images come as an API path (the image volume); older ones as data URLs. */
export const imageUrl = (value: string | null | undefined) => (!value ? null : value.startsWith("/") ? `${baseURL.replace(/\/$/, "")}${value}` : value);
