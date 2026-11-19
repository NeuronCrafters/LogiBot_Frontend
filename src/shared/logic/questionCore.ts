/*
 * LogiBots question core: validation and normalization of question-bank items.
 *
 * Shared by the API (authoritative) and the web app (form feedback) and must stay
 * BYTE-IDENTICAL in:
 *   LogiBot_Backend/src/services/logic/questionCore.ts
 *   LogiBot_Frontend/src/shared/logic/questionCore.ts
 * Both suites check its SHA-256 against exercises.fixtures.json (`questionCoreSha256`).
 *
 * Rules: ES2016-compatible APIs only; imports only from the other shared cores.
 * Issues are field + code + params, never user-facing text.
 */
import { MAX_EQUIVALENCE_PROPOSITIONS, checkFormula, checkTruthTableFormula, conceptsOf, isTruthTableColumns, type TruthTableColumns } from "./logicCore";
import { MAX_PARSONS_INDENT, checkParsonsDefinition, type ParsonsSolution } from "./parsonsCore";

export const QUESTION_TYPES = ["quiz", "truth_table", "parsons", "translation", "essay"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];
export const QUESTION_LANGUAGES = ["pt-BR", "en-US", "es-ES"] as const;
export type QuestionLanguage = (typeof QUESTION_LANGUAGES)[number];

export const QUESTION_LIMITS = {
  statement: 2000,
  option: 300,
  minOptions: 2,
  maxOptions: 4,
  criteria: 2000,
  legendText: 200,
  minLegend: 1,
  maxLegend: 6,
  parsonsLine: 200,
  minParsonsLines: 2,
  maxParsonsLines: 30,
  maxAlternatives: 5,
  subject: 60,
  concept: 40,
  maxConcepts: 10,
  minWeight: 0.5,
  maxWeight: 10,
};

/* ── Editor input (what the form sends) ─────────────────────────────────── */

export type QuestionContentInput =
  | { options: string[]; correct: number | null }
  | { formula: string }
  | { solution: string; distractors: string; alternatives: string }
  | { legend: Array<{ letter: string; text: string }>; target: string }
  | { criteria: string };

export interface QuestionInput {
  type: unknown;
  statement: unknown;
  weight: unknown;
  subject: unknown;
  concepts: unknown;
  language: unknown;
  content: unknown;
}

/* ── Stored content (what graders and exams use) ────────────────────────── */

export interface ParsonsStoredLine { id: string; text: string; distractor?: boolean }

export type QuestionContent =
  | { type: "quiz"; options: string[]; correct: number }
  /** `columns` missing in older questions means "all". */
  | { type: "truth_table"; formula: string; columns?: TruthTableColumns }
  | { type: "parsons"; lines: ParsonsStoredLine[]; solutions: ParsonsSolution[] }
  | { type: "translation"; legend: Array<{ letter: string; text: string }>; target: string }
  | { type: "essay"; criteria: string };

export interface NormalizedQuestion {
  type: QuestionType;
  statement: string;
  weight: number;
  subject: string | null;
  /** Automatic logic concepts first, then the professor's own tags; no duplicates. */
  concepts: string[];
  language: QuestionLanguage;
  content: QuestionContent;
}

export type QuestionIssueCode =
  | "TYPE_INVALID"
  | "REQUIRED"
  | "TOO_LONG"
  | "WEIGHT_RANGE"
  | "LANGUAGE_INVALID"
  | "CONCEPTS_INVALID"
  | "COLUMNS_INVALID"
  | "OPTIONS_COUNT"
  | "OPTION_DUPLICATE"
  | "CORRECT_REQUIRED"
  | "FORMULA_INVALID"
  | "LEGEND_COUNT"
  | "LEGEND_LETTER_INVALID"
  | "LEGEND_LETTER_DUPLICATE"
  | "PARSONS_TOO_FEW_LINES"
  | "PARSONS_TOO_MANY_LINES"
  | "PARSONS_INDENT_SPACES"
  | "PARSONS_INDENT_MAX"
  | "PARSONS_DUPLICATE_LINE"
  | "PARSONS_DISTRACTOR_IN_SOLUTION"
  | "PARSONS_TOO_MANY_ALTERNATIVES"
  | "PARSONS_ALTERNATIVE_MISMATCH";

export interface QuestionIssue {
  /** Form field path, e.g. "statement", "content.options.1", "content.target". */
  field: string;
  code: QuestionIssueCode;
  params: Record<string, string | number>;
}

export type QuestionCheck = { ok: true; question: NormalizedQuestion } | { ok: false; issues: QuestionIssue[] };

/** Produces line ids. The API passes random ids: ordered ids would reveal the solution. */
export type LineIdFactory = (kind: "line" | "distractor", index: number) => string;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

/* ── Parsons source text ────────────────────────────────────────────────── */

export interface ParsedParsonsLine { text: string; indent: number; line: number }

/** One code line per text line; 2 spaces or 1 tab = 1 indentation level. Blank lines are ignored. */
export function parseParsonsSource(source: string, field: string): { lines: ParsedParsonsLine[]; issues: QuestionIssue[] } {
  const lines: ParsedParsonsLine[] = [];
  const issues: QuestionIssue[] = [];
  (source || "").replace(/\r\n?/g, "\n").split("\n").forEach((raw, index) => {
    if (!raw.trim()) return;
    const match = /^[ \t]*/.exec(raw);
    const leading = match ? match[0] : "";
    const tabs = leading.split("\t").length - 1;
    const spaces = leading.length - tabs;
    const line = index + 1;
    if (spaces % 2 !== 0) issues.push({ field, code: "PARSONS_INDENT_SPACES", params: { line } });
    const indent = tabs + Math.floor(spaces / 2);
    if (indent > MAX_PARSONS_INDENT) issues.push({ field, code: "PARSONS_INDENT_MAX", params: { line, max: MAX_PARSONS_INDENT } });
    const content = raw.trim();
    if (content.length > QUESTION_LIMITS.parsonsLine) issues.push({ field, code: "TOO_LONG", params: { line, max: QUESTION_LIMITS.parsonsLine } });
    lines.push({ text: content, indent: Math.min(indent, MAX_PARSONS_INDENT), line });
  });
  return { lines, issues };
}

/** Rebuilds the editor text from stored content (for editing an existing question). */
export function parsonsEditorSource(content: { lines: ParsonsStoredLine[]; solutions: ParsonsSolution[] }): { solution: string; distractors: string; alternatives: string } {
  const byId: Record<string, string> = {};
  content.lines.forEach((line) => { byId[line.id] = line.text; });
  const render = (solution: ParsonsSolution) => solution.map((step) => "  ".repeat(step[1]) + byId[step[0]]).join("\n");
  return {
    solution: content.solutions.length > 0 ? render(content.solutions[0]) : "",
    distractors: content.lines.filter((line) => line.distractor).map((line) => line.text).join("\n"),
    alternatives: content.solutions.slice(1).map(render).join("\n---\n"),
  };
}

function checkParsons(input: Record<string, unknown>, makeId: LineIdFactory, issues: QuestionIssue[]): QuestionContent | null {
  const before = issues.length;
  const main = parseParsonsSource(text(input.solution) ? String(input.solution) : "", "content.solution");
  const distractorLines = parseParsonsSource(typeof input.distractors === "string" ? input.distractors : "", "content.distractors");
  issues.push(...main.issues, ...distractorLines.issues.filter((issue) => issue.code === "TOO_LONG"));

  if (main.lines.length < QUESTION_LIMITS.minParsonsLines) {
    issues.push({ field: "content.solution", code: "PARSONS_TOO_FEW_LINES", params: { min: QUESTION_LIMITS.minParsonsLines } });
  }
  if (main.lines.length + distractorLines.lines.length > QUESTION_LIMITS.maxParsonsLines) {
    issues.push({ field: "content.solution", code: "PARSONS_TOO_MANY_LINES", params: { max: QUESTION_LIMITS.maxParsonsLines } });
  }
  const texts = main.lines.map((line) => line.text);
  texts.forEach((value, index) => {
    if (texts.indexOf(value) !== index) issues.push({ field: "content.solution", code: "PARSONS_DUPLICATE_LINE", params: { line: main.lines[index].line, text: value } });
  });
  const distractorTexts: string[] = [];
  distractorLines.lines.forEach((line) => {
    if (texts.indexOf(line.text) !== -1) issues.push({ field: "content.distractors", code: "PARSONS_DISTRACTOR_IN_SOLUTION", params: { line: line.line, text: line.text } });
    else if (distractorTexts.indexOf(line.text) !== -1) issues.push({ field: "content.distractors", code: "PARSONS_DUPLICATE_LINE", params: { line: line.line, text: line.text } });
    else distractorTexts.push(line.text);
  });

  // Alternative orders are separated by a line with three or more dashes.
  const blocks: string[] = [];
  let current: string[] = [];
  (typeof input.alternatives === "string" ? input.alternatives : "").replace(/\r\n?/g, "\n").split("\n").forEach((line) => {
    if (/^[ \t]*-{3,}[ \t]*$/.test(line)) { blocks.push(current.join("\n")); current = []; }
    else current.push(line);
  });
  blocks.push(current.join("\n"));
  const alternatives: ParsedParsonsLine[][] = [];
  blocks.forEach((block, index) => {
    if (!block.trim()) return;
    const parsed = parseParsonsSource(block, "content.alternatives");
    issues.push(...parsed.issues);
    const sorted = parsed.lines.map((line) => line.text).sort().join("\n");
    if (sorted !== texts.slice().sort().join("\n")) {
      issues.push({ field: "content.alternatives", code: "PARSONS_ALTERNATIVE_MISMATCH", params: { index: index + 1 } });
      return;
    }
    alternatives.push(parsed.lines);
  });
  if (alternatives.length > QUESTION_LIMITS.maxAlternatives) {
    issues.push({ field: "content.alternatives", code: "PARSONS_TOO_MANY_ALTERNATIVES", params: { max: QUESTION_LIMITS.maxAlternatives } });
  }
  if (issues.length > before) return null;

  const lines: ParsonsStoredLine[] = main.lines.map((line, index) => ({ id: makeId("line", index), text: line.text }));
  distractorTexts.forEach((value, index) => lines.push({ id: makeId("distractor", index), text: value, distractor: true }));
  const idOf = (value: string) => lines.filter((line) => line.text === value && !line.distractor)[0].id;
  const toSolution = (block: ParsedParsonsLine[]): ParsonsSolution => block.map((line) => [idOf(line.text), line.indent] as [string, number]);
  const solutions: ParsonsSolution[] = [toSolution(main.lines)];
  alternatives.forEach((block) => {
    const candidate = toSolution(block);
    const key = JSON.stringify(candidate);
    if (solutions.every((solution) => JSON.stringify(solution) !== key)) solutions.push(candidate);
  });
  const definitionIssue = checkParsonsDefinition({ lines, solutions });
  if (definitionIssue) {
    issues.push({ field: "content.solution", code: "PARSONS_DUPLICATE_LINE", params: { line: 0, text: "" } });
    return null;
  }
  return { type: "parsons", lines, solutions };
}

/* ── Main check ─────────────────────────────────────────────────────────── */

export function normalizeConcept(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function checkQuestion(input: QuestionInput, makeId: LineIdFactory): QuestionCheck {
  const issues: QuestionIssue[] = [];
  const type = input.type;
  if (typeof type !== "string" || (QUESTION_TYPES as readonly string[]).indexOf(type) === -1) {
    return { ok: false, issues: [{ field: "type", code: "TYPE_INVALID", params: {} }] };
  }

  const statement = text(input.statement);
  if (!statement) issues.push({ field: "statement", code: "REQUIRED", params: {} });
  else if (statement.length > QUESTION_LIMITS.statement) issues.push({ field: "statement", code: "TOO_LONG", params: { max: QUESTION_LIMITS.statement } });

  const weight = typeof input.weight === "number" ? input.weight : Number(input.weight);
  if (!isFinite(weight) || weight < QUESTION_LIMITS.minWeight || weight > QUESTION_LIMITS.maxWeight || (weight * 2) % 1 !== 0) {
    issues.push({ field: "weight", code: "WEIGHT_RANGE", params: { min: QUESTION_LIMITS.minWeight, max: QUESTION_LIMITS.maxWeight } });
  }

  const language = input.language;
  if (typeof language !== "string" || (QUESTION_LANGUAGES as readonly string[]).indexOf(language) === -1) {
    issues.push({ field: "language", code: "LANGUAGE_INVALID", params: {} });
  }

  const subject = text(input.subject);
  if (subject.length > QUESTION_LIMITS.subject) issues.push({ field: "subject", code: "TOO_LONG", params: { max: QUESTION_LIMITS.subject } });

  const manualConcepts: string[] = [];
  const rawConcepts = input.concepts === undefined || input.concepts === null ? [] : input.concepts;
  if (!Array.isArray(rawConcepts) || rawConcepts.length > QUESTION_LIMITS.maxConcepts || rawConcepts.some((item) => typeof item !== "string" || normalizeConcept(item).length > QUESTION_LIMITS.concept)) {
    issues.push({ field: "concepts", code: "CONCEPTS_INVALID", params: { max: QUESTION_LIMITS.maxConcepts, length: QUESTION_LIMITS.concept } });
  } else {
    rawConcepts.forEach((item) => {
      const value = normalizeConcept(item as string);
      if (value && manualConcepts.indexOf(value) === -1) manualConcepts.push(value);
    });
  }

  const content = isRecord(input.content) ? input.content : {};
  let normalized: QuestionContent | null = null;
  let automatic: string[] = [];

  if (type === "quiz") {
    const raw = Array.isArray(content.options) ? content.options : [];
    const options = raw.map((option) => text(option));
    if (options.length < QUESTION_LIMITS.minOptions || options.length > QUESTION_LIMITS.maxOptions) {
      issues.push({ field: "content.options", code: "OPTIONS_COUNT", params: { min: QUESTION_LIMITS.minOptions, max: QUESTION_LIMITS.maxOptions } });
    }
    options.forEach((option, index) => {
      const field = "content.options." + index;
      if (!option) issues.push({ field, code: "REQUIRED", params: { index: index + 1 } });
      else if (option.length > QUESTION_LIMITS.option) issues.push({ field, code: "TOO_LONG", params: { max: QUESTION_LIMITS.option } });
      else if (options.map((item) => item.toLowerCase()).indexOf(option.toLowerCase()) !== index) issues.push({ field, code: "OPTION_DUPLICATE", params: { index: index + 1 } });
    });
    const correct = content.correct;
    if (typeof correct !== "number" || correct % 1 !== 0 || correct < 0 || correct >= options.length) {
      issues.push({ field: "content.correct", code: "CORRECT_REQUIRED", params: {} });
    }
    normalized = { type: "quiz", options, correct: typeof correct === "number" ? correct : -1 };
  } else if (type === "truth_table") {
    const rawColumns = content.columns === undefined || content.columns === null || content.columns === "" ? "all" : content.columns;
    if (!isTruthTableColumns(rawColumns)) issues.push({ field: "content.columns", code: "COLUMNS_INVALID", params: {} });
    const columns: TruthTableColumns = isTruthTableColumns(rawColumns) ? rawColumns : "all";
    const check = checkTruthTableFormula(text(content.formula), columns);
    if (check.ok === false) issues.push({ field: "content.formula", code: "FORMULA_INVALID", params: { logicCode: check.error.code, ...check.error.params } });
    else {
      normalized = { type: "truth_table", formula: check.normalized, columns };
      automatic = conceptsOf(check.formula);
    }
  } else if (type === "translation") {
    const rawLegend = Array.isArray(content.legend) ? content.legend : [];
    if (rawLegend.length < QUESTION_LIMITS.minLegend || rawLegend.length > Math.min(QUESTION_LIMITS.maxLegend, MAX_EQUIVALENCE_PROPOSITIONS)) {
      issues.push({ field: "content.legend", code: "LEGEND_COUNT", params: { min: QUESTION_LIMITS.minLegend, max: QUESTION_LIMITS.maxLegend } });
    }
    const legend = rawLegend.map((entry) => ({ letter: isRecord(entry) ? text(entry.letter) : "", text: isRecord(entry) ? text(entry.text) : "" }));
    const letters: string[] = [];
    legend.forEach((entry, index) => {
      const field = "content.legend." + index;
      if (!/^[a-z]$/.test(entry.letter)) issues.push({ field: field + ".letter", code: "LEGEND_LETTER_INVALID", params: { index: index + 1 } });
      else if (letters.indexOf(entry.letter) !== -1) issues.push({ field: field + ".letter", code: "LEGEND_LETTER_DUPLICATE", params: { letter: entry.letter } });
      else letters.push(entry.letter);
      if (!entry.text) issues.push({ field: field + ".text", code: "REQUIRED", params: { index: index + 1 } });
      else if (entry.text.length > QUESTION_LIMITS.legendText) issues.push({ field: field + ".text", code: "TOO_LONG", params: { max: QUESTION_LIMITS.legendText } });
    });
    const check = checkFormula(text(content.target), { allowedPropositions: letters });
    if (check.ok === false) issues.push({ field: "content.target", code: "FORMULA_INVALID", params: { logicCode: check.error.code, ...check.error.params } });
    else {
      normalized = { type: "translation", legend, target: check.normalized };
      automatic = conceptsOf(check.formula);
    }
  } else if (type === "parsons") {
    normalized = checkParsons(content, makeId, issues);
  } else {
    const criteria = text(content.criteria);
    if (criteria.length > QUESTION_LIMITS.criteria) issues.push({ field: "content.criteria", code: "TOO_LONG", params: { max: QUESTION_LIMITS.criteria } });
    normalized = { type: "essay", criteria };
  }

  if (issues.length > 0 || !normalized) return { ok: false, issues };
  const concepts = automatic.slice();
  manualConcepts.forEach((concept) => { if (concepts.indexOf(concept) === -1) concepts.push(concept); });
  return {
    ok: true,
    question: {
      type: type as QuestionType,
      statement,
      weight,
      subject: subject || null,
      concepts,
      language: language as QuestionLanguage,
      content: normalized,
    },
  };
}
