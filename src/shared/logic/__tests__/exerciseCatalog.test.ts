import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import fixturesJson from "../exercises.fixtures.json";
import parsonsSource from "../parsonsCore.ts?raw";
import catalogSource from "../exerciseCatalog.ts?raw";
import { checkFormula, variablesOf } from "../logicCore";
import {
  MAX_PARSONS_LINES,
  PARSONS_ENGINE_VERSION,
  checkParsonsDefinition,
  checkParsonsPlacements,
  gradeParsons,
  type ParsonsDefinition,
} from "../parsonsCore";
import { PARSONS_EXERCISES, TRANSLATION_EXERCISES, type ContentLanguage, type LocalizedText } from "../exerciseCatalog";

// Same cases as LogiBot_Backend/src/__tests__/exerciseCatalog.test.ts.
interface Fixtures {
  parsonsEngineVersion: string;
  parsonsCoreSha256: string;
  catalogSha256: string;
  definitions: Record<string, ParsonsDefinition>;
  grading: Array<{ name: string; definition: string; answer: Array<[string, number]>; expected: unknown }>;
  validation: Array<{ definition: string; input: unknown; code: string; params: Record<string, unknown> }>;
}
const fixtures = fixturesJson as unknown as Fixtures;
const sha256 = (source: string) => createHash("sha256").update(source.replace(/\r\n/g, "\n"), "utf8").digest("hex");

const LANGUAGES: ContentLanguage[] = ["pt-BR", "en-US", "es-ES"];
const complete = (text: LocalizedText) => LANGUAGES.every((language) => typeof text[language] === "string" && text[language].trim().length > 0);

describe("shared exercise files: parity with the API copy", () => {
  it("match the hashes and engine version recorded in the shared fixtures", () => {
    expect(sha256(parsonsSource)).toBe(fixtures.parsonsCoreSha256);
    expect(sha256(catalogSource)).toBe(fixtures.catalogSha256);
    expect(PARSONS_ENGINE_VERSION).toBe(fixtures.parsonsEngineVersion);
  });
});

describe("parsonsCore: LCS grading", () => {
  it.each(fixtures.grading)("$name", ({ definition, answer, expected }) => {
    const placements = answer.map(([id, indent]) => ({ id, indent }));
    expect(gradeParsons(fixtures.definitions[definition], placements)).toEqual(expected);
  });

  it.each(fixtures.validation)("rejects invalid input with $code", ({ definition, input, code, params }) => {
    expect(checkParsonsPlacements(fixtures.definitions[definition], input)).toEqual({ ok: false, error: { code, params } });
  });

  it("limits the number of lines", () => {
    const input = Array.from({ length: MAX_PARSONS_LINES + 1 }, () => ({ id: "a", indent: 0 }));
    expect(checkParsonsPlacements(fixtures.definitions.single, input)).toEqual({ ok: false, error: { code: "TOO_MANY_LINES", params: { max: MAX_PARSONS_LINES } } });
  });

  it("rejects definitions whose solutions do not use exactly the non-distractor lines", () => {
    expect(checkParsonsDefinition(fixtures.definitions.single)).toBeNull();
    expect(checkParsonsDefinition({ lines: [{ id: "a" }, { id: "b" }], solutions: [[["a", 0]]] })).toMatchObject({ code: "UNKNOWN_LINE" });
    expect(checkParsonsDefinition({ lines: [{ id: "a" }, { id: "a" }], solutions: [[["a", 0]]] })).toMatchObject({ code: "DUPLICATE_LINE" });
    expect(checkParsonsDefinition({ lines: [{ id: "a" }], solutions: [] })).toMatchObject({ code: "NOT_A_LIST" });
  });
});

describe("built-in exercise catalog", () => {
  it("has unique ids across types", () => {
    const ids = [...TRANSLATION_EXERCISES, ...PARSONS_EXERCISES].map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(TRANSLATION_EXERCISES)("translation $id is complete and consistent", (exercise) => {
    expect(complete(exercise.sentence)).toBe(true);
    exercise.legend.forEach((entry) => expect(complete(entry.text)).toBe(true));
    const letters = exercise.legend.map((entry) => entry.letter);
    const target = checkFormula(exercise.target, { allowedPropositions: letters, requireOperator: true });
    expect(target.ok).toBe(true);
    if (target.ok) expect(variablesOf(target.formula)).toEqual(letters.slice().sort());
  });

  it.each(PARSONS_EXERCISES)("parsons $id is complete and solvable", (exercise) => {
    expect(complete(exercise.statement)).toBe(true);
    exercise.lines.forEach((line) => expect(complete(line.text)).toBe(true));
    expect(exercise.concepts.length).toBeGreaterThan(0);
    expect(checkParsonsDefinition(exercise)).toBeNull();
    exercise.solutions.forEach((solution) => {
      const grade = gradeParsons(exercise, solution.map(([id, indent]) => ({ id, indent })));
      expect(grade.correct).toBe(true);
    });
  });
});
