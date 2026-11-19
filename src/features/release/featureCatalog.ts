/** Features that the admin can hide and block. Keep in sync with the backend catalog. */
export const FEATURES = [
  "chat",
  "quiz",
  "practice_truth_table",
  "practice_translation",
  "practice_parsons",
  "practice_hints",
  "exams",
  "question_bank",
  "feedback",
  "rag",
  "notifications",
  "notifications_email",
  "dashboard",
  "dashboard_comparison",
  "concept_panel",
] as const;
export type Feature = (typeof FEATURES)[number];
export type Scope = "global" | "institution" | "course" | "class";

const PATHS: Array<[RegExp, Feature]> = [
  [/^\/chat(\/|$)/, "chat"],
  [/^\/quiz(\/|$)/, "quiz"],
  [/^\/practice\/truth-table(\/|$)/, "practice_truth_table"],
  [/^\/practice\/translation(\/|$)/, "practice_translation"],
  [/^\/practice\/parsons(\/|$)/, "practice_parsons"],
  [/^\/exams(\/|$)/, "exams"],
  [/^\/concepts(\/|$)/, "concept_panel"],
  [/^\/questions(\/|$)/, "question_bank"],
  [/^\/feedback(\/|$)/, "feedback"],
  [/^\/rag(\/|$)/, "rag"],
  [/^\/dashboard(\/|$)/, "dashboard"],
];

/** Feature a page belongs to, or null for pages that are always available. */
export function featureForPath(pathname: string): Feature | null {
  for (const [pattern, feature] of PATHS) if (pattern.test(pathname)) return feature;
  return null;
}

export interface FeatureRule { id: string; feature: Feature; scope: Scope; scopeId: string; enabled: boolean; updatedAt: string }

/** Most specific rule along the chain decides; without rules the feature is released. */
export function resolveFeature(rules: FeatureRule[], feature: Feature, chain: Array<[Scope, string]>): { enabled: boolean; from: [Scope, string] | null } {
  for (const [scope, scopeId] of chain) {
    const rule = rules.find((item) => item.feature === feature && item.scope === scope && item.scopeId === scopeId);
    if (rule) return { enabled: rule.enabled, from: [scope, scopeId] };
  }
  return { enabled: true, from: null };
}
