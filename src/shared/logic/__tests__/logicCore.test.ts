import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import fixturesJson from "../logicCore.fixtures.json";
import coreSource from "../logicCore.ts?raw";
import {
  LOGIC_ENGINE_VERSION,
  LogicError,
  MAX_FORMULA_LENGTH,
  buildTruthTable,
  checkTruthTableFormula,
  checkEquivalence,
  checkFormula,
  conceptsOf,
  formatFormula,
  gradeTranslation,
  gradeTruthTable,
  normalizeFormula,
  parseFormula,
  subformulas,
  variablesOf,
  type FormulaCheckOptions,
} from "../logicCore";

// Same golden cases as LogiBot_Backend/src/__tests__/logicCore.test.ts.
interface Fixtures {
  engineVersion: string;
  coreSha256: string;
  parse: Array<{ input: string; normalized: string; variables: string[]; concepts: string[] }>;
  subformulas: Array<{ input: string; expected: string[] }>;
  truthTables: Array<{ input: string; variables: string[]; columns: Record<string, string> }>;
  parseErrors: Array<{ input: string; code: string; params: Record<string, unknown> }>;
  checkFormula: Array<{ input: string; options: FormulaCheckOptions; code: string | null; params: Record<string, unknown> | null }>;
  equivalence: Array<{ left: string; right: string; equivalent: boolean; counterexample?: Record<string, boolean>; leftValue?: boolean; rightValue?: boolean }>;
  translation: Array<{
    target: string; legend: string[]; answer: string; status: string; normalizedAnswer?: string; identicalToTarget?: boolean;
    counterexample?: Record<string, boolean>; answerValue?: boolean; expectedValue?: boolean; code?: string; params?: Record<string, unknown>;
  }>;
  truthTableGrading: Array<{
    formula: string; columns?: "all" | "final"; cells: Record<string, unknown>;
    expected: { correct: boolean; total: number; right: number; empty: number; wrong: unknown[]; errorsByConcept: Record<string, number> };
  }>;
  truthTableLimits: Array<{ input: string; columns: "all" | "final"; code: string | null; params?: Record<string, unknown>; rows?: number; columns_count?: number }>;
}

const fixtures = fixturesJson as unknown as Fixtures;
const bits = (values: boolean[]) => values.map((value) => (value ? "1" : "0")).join("");
const errorOf = (run: () => unknown): unknown => {
  try { run(); } catch (error) { return error; }
  return undefined;
};

describe("logicCore: parity with the API copy", () => {
  it("matches the hash and engine version recorded in the shared fixtures", () => {
    const source = coreSource.replace(/\r\n/g, "\n");
    expect(createHash("sha256").update(source, "utf8").digest("hex")).toBe(fixtures.coreSha256);
    expect(LOGIC_ENGINE_VERSION).toBe(fixtures.engineVersion);
  });
});

describe("logicCore: parser", () => {
  it.each(fixtures.parse)("parses $input", ({ input, normalized, variables, concepts }) => {
    const formula = parseFormula(input);
    expect(formatFormula(formula)).toBe(normalized);
    expect(variablesOf(formula)).toEqual(variables);
    expect(conceptsOf(formula)).toEqual(concepts);
    expect(normalizeFormula(normalized)).toBe(normalized);
  });

  it.each(fixtures.parseErrors)("rejects $input with $code", ({ input, code, params }) => {
    expect(checkFormula(input)).toEqual({ ok: false, error: { code, params } });
    expect(() => parseFormula(input)).toThrow(LogicError);
  });

  it("limits the formula length", () => {
    const longFormula = "p & ".repeat(60) + "p";
    expect(longFormula.length).toBeGreaterThan(MAX_FORMULA_LENGTH);
    expect(checkFormula(longFormula)).toEqual({ ok: false, error: { code: "FORMULA_TOO_LONG", params: { max: MAX_FORMULA_LENGTH } } });
  });

  it("handles the deepest nesting allowed by the length limit", () => {
    expect(normalizeFormula("~".repeat(MAX_FORMULA_LENGTH - 1) + "p")).toBe("¬".repeat(MAX_FORMULA_LENGTH - 1) + "p");
  });

  it.each(fixtures.checkFormula)("checks $input with options", ({ input, options, code, params }) => {
    const result = checkFormula(input, options);
    if (code === null) expect(result.ok).toBe(true);
    else expect(result).toEqual({ ok: false, error: { code, params } });
  });
});

describe("logicCore: truth tables", () => {
  it.each(fixtures.subformulas)("lists the subformulas of $input", ({ input, expected }) => {
    expect(subformulas(parseFormula(input)).map(formatFormula)).toEqual(expected);
  });

  it.each(fixtures.truthTables)("builds the table of $input", ({ input, variables, columns }) => {
    const table = buildTruthTable(input);
    expect(table.variables).toEqual(variables);
    expect(table.rows).toHaveLength(Math.pow(2, variables.length));
    variables.forEach((name) => expect(table.rows[0].assignment[name]).toBe(true));
    for (const column of Object.keys(columns)) {
      const expected = columns[column];
      const index = table.columns.findIndex((item) => item.key === column);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(bits(table.rows.map((row) => row.values[index]))).toBe(expected);
    }
  });

  it("rejects formulas that are not valid truth-table exercises", () => {
    expect(errorOf(() => buildTruthTable("p"))).toMatchObject({ code: "NO_OPERATOR" });
    expect(errorOf(() => buildTruthTable("p & q & r & s & t & u & v & w & x & y & z"))).toMatchObject({ code: "TOO_MANY_PROPOSITIONS", params: { max: 10, found: 11 } });
  });

  it.each(fixtures.truthTableGrading)("grades cells of $formula", ({ formula, columns, cells, expected }) => {
    const grade = gradeTruthTable(formula, cells, columns);
    const { marks, ...summary } = grade;
    expect(summary).toEqual(expected);
    expect(Object.keys(marks)).toHaveLength(expected.total);
  });

  it.each(fixtures.truthTableLimits)("sizes $input with $columns columns", ({ input, columns, code, params, rows, columns_count }) => {
    const check = checkTruthTableFormula(input, columns);
    if (code) {
      expect(check.ok).toBe(false);
      if (check.ok === false) expect(check.error).toEqual({ code, params });
      return;
    }
    const table = buildTruthTable(input, columns);
    expect(table.rows).toHaveLength(rows!);
    expect(table.columns).toHaveLength(columns_count!);
  });

  it("treats a missing cell map as all empty", () => {
    expect(gradeTruthTable("p -> q", undefined as unknown as Record<string, unknown>).empty).toBe(4);
  });
});

describe("logicCore: equivalence and translation", () => {
  it.each(fixtures.equivalence)("compares $left and $right", ({ left, right, equivalent, counterexample, leftValue, rightValue }) => {
    const result = checkEquivalence(parseFormula(left), parseFormula(right));
    expect(result).toEqual(equivalent ? { equivalent } : { equivalent, counterexample, leftValue, rightValue });
  });

  it.each(fixtures.translation)("grades $answer for $target", (item) => {
    const result = gradeTranslation(item.target, item.legend, item.answer);
    if (item.status === "correct") {
      expect(result).toEqual({ status: "correct", normalizedAnswer: item.normalizedAnswer, identicalToTarget: item.identicalToTarget });
    } else if (item.status === "incorrect") {
      expect(result).toEqual({
        status: "incorrect", normalizedAnswer: item.normalizedAnswer, counterexample: item.counterexample,
        answerValue: item.answerValue, expectedValue: item.expectedValue,
      });
    } else {
      expect(result).toEqual({ status: "invalid", error: { code: item.code, params: item.params } });
    }
  });

  it("throws when the question data itself is inconsistent", () => {
    const error = errorOf(() => gradeTranslation("p -> r", ["p", "q"], "p"));
    expect(error).toBeInstanceOf(LogicError);
    expect(error).toMatchObject({ code: "PROPOSITION_NOT_IN_LEGEND", params: { found: "r", allowed: "p, q" } });
  });
});
