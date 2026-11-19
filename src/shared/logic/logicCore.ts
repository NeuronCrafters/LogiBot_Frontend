/*
 * LogiBots logic core: propositional logic parser, evaluator and pure graders.
 *
 * This file is shared by the API and the web app and must stay BYTE-IDENTICAL in:
 *   LogiBot_Backend/src/services/logic/logicCore.ts
 *   LogiBot_Frontend/src/shared/logic/logicCore.ts
 * Both test suites run the same logicCore.fixtures.json, whose `coreSha256` must
 * match this file. After any change: copy the file to the other repository,
 * update `coreSha256` (and LOGIC_ENGINE_VERSION when behaviour changes) in both
 * fixture copies, and run both suites.
 *
 * Rules: no imports, no runtime dependencies, ES2016-compatible APIs only.
 * Errors are codes with parameters, never user-facing text, so each caller
 * translates them with its own i18n catalog.
 *
 * Grammar (precedence from highest to lowest): ¬ > ∧ > ∨ > → > ↔
 * ∧, ∨ and ↔ associate to the left; → associates to the right.
 * Accepted notations: ¬ ~ !   ∧ & ^   ∨ |   → ->   ↔ <->
 * Propositions are single lowercase letters (p, q, r...).
 */

export const LOGIC_ENGINE_VERSION = "1.1.0";
export const MAX_FORMULA_LENGTH = 200;
export const MAX_TABLE_PROPOSITIONS = 10;
/**
 * Most cells a student may be asked to fill. Larger tables are asked with the final column only
 * (up to 2^10 = 1024 cells), so simple and very complex formulas both fit.
 */
export const MAX_TABLE_CELLS = 2048;
/** "all": one column per subformula (every intermediate step); "final": only the whole formula. */
export type TruthTableColumns = "all" | "final";
export const TRUTH_TABLE_COLUMNS: readonly TruthTableColumns[] = ["all", "final"];
export const isTruthTableColumns = (value: unknown): value is TruthTableColumns => value === "all" || value === "final";
export const MAX_EQUIVALENCE_PROPOSITIONS = 8;

export type BinaryOperator = "∧" | "∨" | "→" | "↔";
export type Operator = "¬" | BinaryOperator;

export type FormulaNode =
  | { op: "var"; name: string }
  | { op: "¬"; operand: FormulaNode }
  | { op: BinaryOperator; left: FormulaNode; right: FormulaNode };

export type ConceptSlug = "negation" | "conjunction" | "disjunction" | "conditional" | "biconditional";

export const OPERATOR_CONCEPT: Readonly<Record<Operator, ConceptSlug>> = {
  "¬": "negation",
  "∧": "conjunction",
  "∨": "disjunction",
  "→": "conditional",
  "↔": "biconditional",
};

const CONCEPT_ORDER: ConceptSlug[] = ["negation", "conjunction", "disjunction", "conditional", "biconditional"];

export type LogicErrorCode =
  | "EMPTY_FORMULA"
  | "FORMULA_TOO_LONG"
  | "UNKNOWN_SYMBOL"
  | "MULTI_LETTER_PROPOSITION"
  | "UPPERCASE_PROPOSITION"
  | "UNEXPECTED_END"
  | "UNEXPECTED_TOKEN"
  | "MISSING_CLOSING_PAREN"
  | "TRAILING_TOKEN"
  | "TOO_MANY_PROPOSITIONS"
  | "NO_OPERATOR"
  | "PROPOSITION_NOT_IN_LEGEND"
  | "TABLE_TOO_LARGE";

export type LogicErrorParams = Record<string, string | number>;

export interface LogicIssue {
  code: LogicErrorCode;
  params: LogicErrorParams;
}

export class LogicError extends Error {
  readonly code: LogicErrorCode;
  readonly params: LogicErrorParams;

  constructor(code: LogicErrorCode, params: LogicErrorParams = {}) {
    super(code);
    this.name = "LogicError";
    this.code = code;
    this.params = params;
  }
}

export function isLogicError(error: unknown): error is LogicError {
  return error instanceof LogicError;
}

/* ------------------------------------------------------------------ */
/* Tokenizer                                                           */
/* ------------------------------------------------------------------ */

export type Token =
  | { kind: "operator"; op: Operator; raw: string; position: number }
  | { kind: "paren"; value: "(" | ")"; raw: string; position: number }
  | { kind: "var"; name: string; raw: string; position: number };

const SINGLE_CHAR_OPERATORS: Readonly<Record<string, Operator>> = {
  "¬": "¬", "~": "¬", "!": "¬",
  "∧": "∧", "&": "∧", "^": "∧",
  "∨": "∨", "|": "∨",
  "→": "→",
  "↔": "↔",
};

export function tokenize(source: string): Token[] {
  if (source.length > MAX_FORMULA_LENGTH) throw new LogicError("FORMULA_TOO_LONG", { max: MAX_FORMULA_LENGTH });
  const tokens: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const char = source.charAt(i);
    if (/\s/.test(char)) { i++; continue; }
    if (source.startsWith("<->", i)) { tokens.push({ kind: "operator", op: "↔", raw: "<->", position: i }); i += 3; continue; }
    if (source.startsWith("->", i)) { tokens.push({ kind: "operator", op: "→", raw: "->", position: i }); i += 2; continue; }
    if (char === "(" || char === ")") { tokens.push({ kind: "paren", value: char, raw: char, position: i }); i++; continue; }
    if (Object.prototype.hasOwnProperty.call(SINGLE_CHAR_OPERATORS, char)) {
      tokens.push({ kind: "operator", op: SINGLE_CHAR_OPERATORS[char], raw: char, position: i });
      i++;
      continue;
    }
    if (/[A-Za-z]/.test(char)) {
      const match = /^[A-Za-z0-9_]+/.exec(source.slice(i));
      const word = match ? match[0] : char;
      if (word.length > 1) throw new LogicError("MULTI_LETTER_PROPOSITION", { word, position: i });
      if (char !== char.toLowerCase()) {
        throw new LogicError("UPPERCASE_PROPOSITION", { letter: char, suggestion: char.toLowerCase(), position: i });
      }
      tokens.push({ kind: "var", name: char, raw: char, position: i });
      i++;
      continue;
    }
    const codePoint = source.codePointAt(i);
    const symbol = codePoint === undefined ? char : String.fromCodePoint(codePoint);
    throw new LogicError("UNKNOWN_SYMBOL", { symbol, position: i });
  }
  return tokens;
}

/* ------------------------------------------------------------------ */
/* Parser (recursive descent)                                          */
/* ------------------------------------------------------------------ */

export function parseFormula(source: string): FormulaNode {
  const tokens = tokenize(source);
  if (tokens.length === 0) throw new LogicError("EMPTY_FORMULA");
  let index = 0;

  const isOperator = (op: Operator): boolean => {
    const token = tokens[index];
    return token !== undefined && token.kind === "operator" && token.op === op;
  };

  function biconditional(): FormulaNode {
    let left = conditional();
    while (isOperator("↔")) { index++; left = { op: "↔", left, right: conditional() }; }
    return left;
  }
  function conditional(): FormulaNode {
    const left = disjunction();
    if (isOperator("→")) { index++; return { op: "→", left, right: conditional() }; }
    return left;
  }
  function disjunction(): FormulaNode {
    let left = conjunction();
    while (isOperator("∨")) { index++; left = { op: "∨", left, right: conjunction() }; }
    return left;
  }
  function conjunction(): FormulaNode {
    let left = negation();
    while (isOperator("∧")) { index++; left = { op: "∧", left, right: negation() }; }
    return left;
  }
  function negation(): FormulaNode {
    if (isOperator("¬")) { index++; return { op: "¬", operand: negation() }; }
    return atom();
  }
  function atom(): FormulaNode {
    const token = tokens[index];
    if (token === undefined) throw new LogicError("UNEXPECTED_END");
    if (token.kind === "var") { index++; return { op: "var", name: token.name }; }
    if (token.kind === "paren" && token.value === "(") {
      index++;
      const inner = biconditional();
      const closing = tokens[index];
      if (closing === undefined || closing.kind !== "paren" || closing.value !== ")") {
        throw new LogicError("MISSING_CLOSING_PAREN", { position: token.position });
      }
      index++;
      return inner;
    }
    throw new LogicError("UNEXPECTED_TOKEN", { token: token.raw, position: token.position });
  }

  const formula = biconditional();
  const rest = tokens[index];
  if (rest !== undefined) throw new LogicError("TRAILING_TOKEN", { token: rest.raw, position: rest.position });
  return formula;
}

/* ------------------------------------------------------------------ */
/* Formatting and inspection                                           */
/* ------------------------------------------------------------------ */

/** Canonical text: Unicode operators, single spaces, parentheses only around binary subformulas. */
export function formatFormula(node: FormulaNode): string {
  if (node.op === "var") return node.name;
  if (node.op === "¬") return "¬" + wrap(node.operand);
  return wrap(node.left) + " " + node.op + " " + wrap(node.right);
}

function wrap(node: FormulaNode): string {
  return node.op === "var" || node.op === "¬" ? formatFormula(node) : "(" + formatFormula(node) + ")";
}

export function normalizeFormula(source: string): string {
  return formatFormula(parseFormula(source));
}

function collect(node: FormulaNode, onNode: (node: FormulaNode) => void): void {
  if (node.op === "¬") collect(node.operand, onNode);
  else if (node.op !== "var") { collect(node.left, onNode); collect(node.right, onNode); }
  onNode(node);
}

/** Proposition letters in alphabetical order. */
export function variablesOf(node: FormulaNode): string[] {
  const names: string[] = [];
  collect(node, (item) => { if (item.op === "var" && names.indexOf(item.name) === -1) names.push(item.name); });
  return names.sort();
}

/** Concepts (Q-matrix tags) detected from the operators, in a fixed order. */
export function conceptsOf(node: FormulaNode): ConceptSlug[] {
  const found: ConceptSlug[] = [];
  collect(node, (item) => { if (item.op !== "var") found.push(OPERATOR_CONCEPT[item.op]); });
  return CONCEPT_ORDER.filter((concept) => found.indexOf(concept) !== -1);
}

export function mainConcept(node: FormulaNode): ConceptSlug | null {
  return node.op === "var" ? null : OPERATOR_CONCEPT[node.op];
}

/** Non-atomic subformulas in evaluation order (children first), without duplicates. */
export function subformulas(node: FormulaNode): FormulaNode[] {
  const result: FormulaNode[] = [];
  const seen: string[] = [];
  collect(node, (item) => {
    if (item.op === "var") return;
    const text = formatFormula(item);
    if (seen.indexOf(text) === -1) { seen.push(text); result.push(item); }
  });
  return result;
}

/* ------------------------------------------------------------------ */
/* Evaluation                                                          */
/* ------------------------------------------------------------------ */

export type Assignment = Record<string, boolean>;

export function evaluate(node: FormulaNode, assignment: Assignment): boolean {
  switch (node.op) {
    case "var": {
      if (!Object.prototype.hasOwnProperty.call(assignment, node.name)) {
        throw new LogicError("PROPOSITION_NOT_IN_LEGEND", { found: node.name, allowed: Object.keys(assignment).sort().join(", ") });
      }
      return assignment[node.name] === true;
    }
    case "¬": return !evaluate(node.operand, assignment);
    case "∧": return evaluate(node.left, assignment) && evaluate(node.right, assignment);
    case "∨": return evaluate(node.left, assignment) || evaluate(node.right, assignment);
    case "→": return !evaluate(node.left, assignment) || evaluate(node.right, assignment);
    case "↔": return evaluate(node.left, assignment) === evaluate(node.right, assignment);
  }
}

/** All assignments in textbook order: the first row is all true, the last all false. */
export function assignmentsFor(variables: string[]): Assignment[] {
  const count = variables.length;
  const rows: Assignment[] = [];
  for (let row = 0; row < Math.pow(2, count); row++) {
    const assignment: Assignment = {};
    variables.forEach((name, column) => { assignment[name] = ((row >> (count - 1 - column)) & 1) === 0; });
    rows.push(assignment);
  }
  return rows;
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

export interface FormulaCheckOptions {
  maxPropositions?: number;
  requireOperator?: boolean;
  allowedPropositions?: string[];
}

export type FormulaCheck =
  | { ok: true; formula: FormulaNode; normalized: string; variables: string[] }
  | { ok: false; error: LogicIssue };

export function checkFormula(source: string, options: FormulaCheckOptions = {}): FormulaCheck {
  try {
    const formula = parseFormula(source);
    const variables = variablesOf(formula);
    if (options.allowedPropositions) {
      const allowed = options.allowedPropositions.slice().sort();
      const extra = variables.filter((name) => allowed.indexOf(name) === -1);
      if (extra.length > 0) {
        throw new LogicError("PROPOSITION_NOT_IN_LEGEND", { found: extra.join(", "), allowed: allowed.join(", ") });
      }
    }
    if (options.maxPropositions !== undefined && variables.length > options.maxPropositions) {
      throw new LogicError("TOO_MANY_PROPOSITIONS", { max: options.maxPropositions, found: variables.length });
    }
    if (options.requireOperator && formula.op === "var") throw new LogicError("NO_OPERATOR");
    return { ok: true, formula, normalized: formatFormula(formula), variables };
  } catch (error) {
    if (isLogicError(error)) return { ok: false, error: { code: error.code, params: error.params } };
    throw error;
  }
}

/**
 * Formula accepted for a truth-table exercise: up to 10 propositions, at least one operator and,
 * for the chosen columns, at most MAX_TABLE_CELLS cells to fill.
 */
export function checkTruthTableFormula(source: string, columns: TruthTableColumns = "all"): FormulaCheck {
  const check = checkFormula(source, { maxPropositions: MAX_TABLE_PROPOSITIONS, requireOperator: true });
  if (check.ok === false) return check;
  const cells = truthTableCellCount(check.formula, columns);
  if (cells > MAX_TABLE_CELLS) return { ok: false, error: { code: "TABLE_TOO_LARGE", params: { max: MAX_TABLE_CELLS, cells } } };
  return check;
}

/** Cells to fill: one per row in every asked column. */
export function truthTableCellCount(formula: FormulaNode, columns: TruthTableColumns = "all"): number {
  const rows = Math.pow(2, variablesOf(formula).length);
  return rows * (columns === "final" ? 1 : subformulas(formula).length);
}

// Explicit `=== false` comparisons: the API compiles with strict mode off, where `!x.ok` does not narrow the union.
function requireValid(check: FormulaCheck): FormulaNode {
  if (check.ok === false) throw new LogicError(check.error.code, check.error.params);
  return check.formula;
}

/* ------------------------------------------------------------------ */
/* Truth table                                                         */
/* ------------------------------------------------------------------ */

export interface TruthTableColumn {
  /** Canonical text of the subformula; also the column part of a cell key. */
  key: string;
  concept: ConceptSlug;
}

export interface TruthTable {
  formula: string;
  variables: string[];
  columns: TruthTableColumn[];
  rows: Array<{ assignment: Assignment; values: boolean[] }>;
}

export function buildTruthTable(source: string, columnsMode: TruthTableColumns = "all"): TruthTable {
  const formula = requireValid(checkTruthTableFormula(source, columnsMode));
  const variables = variablesOf(formula);
  const nodes = columnsMode === "final" ? [formula] : subformulas(formula);
  const columns = nodes.map((node) => ({ key: formatFormula(node), concept: OPERATOR_CONCEPT[node.op as Operator] }));
  const rows = assignmentsFor(variables).map((assignment) => ({
    assignment,
    values: nodes.map((node) => evaluate(node, assignment)),
  }));
  return { formula: formatFormula(formula), variables, columns, rows };
}

/** Cell key independent of column order: zero-based row index + canonical subformula text. */
export function truthTableCellKey(row: number, column: string): string {
  return row + "|" + column;
}

export type CellMark = "correct" | "wrong" | "empty";

export interface TruthTableGrade {
  correct: boolean;
  total: number;
  right: number;
  empty: number;
  wrong: Array<{ row: number; column: string; concept: ConceptSlug }>;
  errorsByConcept: Partial<Record<ConceptSlug, number>>;
  marks: Record<string, CellMark>;
}

/** Grades submitted cells. Anything that is not a boolean counts as an empty cell. */
export function gradeTruthTable(source: string, cells: Record<string, unknown>, columns: TruthTableColumns = "all"): TruthTableGrade {
  const table = buildTruthTable(source, columns);
  const submitted = cells || {};
  const grade: TruthTableGrade = { correct: false, total: 0, right: 0, empty: 0, wrong: [], errorsByConcept: {}, marks: {} };
  table.rows.forEach((row, rowIndex) => {
    table.columns.forEach((column, columnIndex) => {
      const key = truthTableCellKey(rowIndex, column.key);
      const value = Object.prototype.hasOwnProperty.call(submitted, key) ? submitted[key] : undefined;
      grade.total++;
      if (typeof value !== "boolean") { grade.empty++; grade.marks[key] = "empty"; return; }
      if (value === row.values[columnIndex]) { grade.right++; grade.marks[key] = "correct"; return; }
      grade.marks[key] = "wrong";
      grade.wrong.push({ row: rowIndex, column: column.key, concept: column.concept });
      grade.errorsByConcept[column.concept] = (grade.errorsByConcept[column.concept] || 0) + 1;
    });
  });
  grade.correct = grade.right === grade.total;
  return grade;
}

/* ------------------------------------------------------------------ */
/* Equivalence and translation                                         */
/* ------------------------------------------------------------------ */

export type EquivalenceResult =
  | { equivalent: true }
  | { equivalent: false; counterexample: Assignment; leftValue: boolean; rightValue: boolean };

/** Compares two formulas over the given propositions (default: union of both). */
export function checkEquivalence(left: FormulaNode, right: FormulaNode, variables?: string[]): EquivalenceResult {
  const names = variables
    ? variables.slice().sort()
    : variablesOf(left).concat(variablesOf(right)).filter((name, i, all) => all.indexOf(name) === i).sort();
  if (names.length > MAX_EQUIVALENCE_PROPOSITIONS) {
    throw new LogicError("TOO_MANY_PROPOSITIONS", { max: MAX_EQUIVALENCE_PROPOSITIONS, found: names.length });
  }
  for (const assignment of assignmentsFor(names)) {
    const leftValue = evaluate(left, assignment);
    const rightValue = evaluate(right, assignment);
    if (leftValue !== rightValue) return { equivalent: false, counterexample: assignment, leftValue, rightValue };
  }
  return { equivalent: true };
}

export type TranslationGrade =
  | { status: "correct"; normalizedAnswer: string; identicalToTarget: boolean }
  | { status: "incorrect"; normalizedAnswer: string; counterexample: Assignment; answerValue: boolean; expectedValue: boolean }
  | { status: "invalid"; error: LogicIssue };

/**
 * Grades a sentence-to-formula translation by logical equivalence over the legend.
 * The target and the legend are question data: invalid ones throw LogicError.
 */
export function gradeTranslation(targetSource: string, legend: string[], answerSource: string): TranslationGrade {
  const propositions = legend.filter((name, i, all) => all.indexOf(name) === i).sort();
  const target = requireValid(checkFormula(targetSource, {
    allowedPropositions: propositions,
    maxPropositions: MAX_EQUIVALENCE_PROPOSITIONS,
  }));
  const answer = checkFormula(answerSource, { allowedPropositions: propositions });
  if (answer.ok === false) return { status: "invalid", error: answer.error };
  const result = checkEquivalence(answer.formula, target, propositions);
  if (result.equivalent === false) {
    return {
      status: "incorrect",
      normalizedAnswer: answer.normalized,
      counterexample: result.counterexample,
      answerValue: result.leftValue,
      expectedValue: result.rightValue,
    };
  }
  return { status: "correct", normalizedAnswer: answer.normalized, identicalToTarget: answer.normalized === formatFormula(target) };
}
