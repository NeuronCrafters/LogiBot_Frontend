import { t, type MessageKey } from "@/i18n";
import type { CellMark, ConceptSlug, LogicIssue } from "@/shared/logic/logicCore";

/** Translates a logic-core error. Positions are zero-based in the core and one-based for people. */
export function logicIssueMessage(issue: LogicIssue): string {
  const params: Record<string, string | number> = { ...issue.params };
  if (typeof params.position === "number") params.position = params.position + 1;
  return t(`exercises.logicError.${issue.code}` as MessageKey, params);
}

/** Catalog concepts are translated; concepts typed by professors are shown as written. */
export function conceptLabel(concept: ConceptSlug | string): string {
  const key = `exercises.concept.${concept}`;
  const label = t(key as MessageKey);
  return label === key ? concept : label;
}

export function conceptList(concepts: Array<ConceptSlug | string>): string {
  return concepts.map(conceptLabel).join(", ");
}

/** Short truth-value label for the current language (V/F, T/F). */
export function truthValueLabel(value: boolean | undefined): string {
  if (value === undefined) return "";
  return t(value ? "exercises.truthTable.valueTrue" : "exercises.truthTable.valueFalse");
}

/** Spoken label: full words, so screen readers do not read a lone letter. */
export function truthValueSpoken(value: boolean | undefined): string {
  if (value === undefined) return t("exercises.truthTable.valueEmpty");
  return t(value ? "exercises.truthTable.valueTrueLong" : "exercises.truthTable.valueFalseLong");
}

export function markLabel(mark: CellMark | undefined): string | null {
  if (mark === "correct") return t("exercises.truthTable.markCorrect");
  if (mark === "wrong") return t("exercises.truthTable.markWrong");
  return null;
}

/** Keys that set a value directly, in any supported language. */
export function valueFromKey(key: string): boolean | null | undefined {
  const lower = key.toLowerCase();
  if (lower === "v" || lower === "t" || key === "1") return true;
  if (lower === "f" || key === "0") return false;
  if (key === "Backspace" || key === "Delete") return null;
  return undefined;
}
