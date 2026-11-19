/*
 * LogiBots Parsons core: validation and grading of "build the algorithm" exercises.
 *
 * Shared by the API and the web app and must stay BYTE-IDENTICAL in:
 *   LogiBot_Backend/src/services/logic/parsonsCore.ts
 *   LogiBot_Frontend/src/shared/logic/parsonsCore.ts
 * Both suites check its SHA-256 against exercises.fixtures.json (`parsonsCoreSha256`).
 *
 * Rules: no imports, no runtime dependencies, ES2016-compatible APIs only.
 * Errors are codes, never user-facing text.
 *
 * Feedback uses the longest common subsequence (LCS) between the student's lines
 * and each valid solution: only lines outside the LCS are reported as misplaced,
 * so one extra line at the top does not mark every following line as wrong.
 */

export const PARSONS_ENGINE_VERSION = "1.0.0";
export const MAX_PARSONS_INDENT = 4;
export const MAX_PARSONS_LINES = 40;

export interface ParsonsLineDefinition {
  id: string;
  distractor?: boolean;
}

/** One valid solution: ordered [lineId, indent] pairs. */
export type ParsonsSolution = Array<[string, number]>;

export interface ParsonsDefinition {
  lines: ParsonsLineDefinition[];
  solutions: ParsonsSolution[];
}

export interface ParsonsPlacement {
  id: string;
  indent: number;
}

export type ParsonsIssueCode = "NOT_A_LIST" | "TOO_MANY_LINES" | "UNKNOWN_LINE" | "DUPLICATE_LINE" | "INVALID_INDENT";

export interface ParsonsIssue {
  code: ParsonsIssueCode;
  params: Record<string, string | number>;
}

export type ParsonsLineMark = "correct" | "misplaced" | "wrong_indent" | "distractor";

export interface ParsonsGrade {
  correct: boolean;
  marks: Record<string, ParsonsLineMark>;
  misplaced: number;
  wrongIndent: number;
  distractors: number;
  /** How many solution lines were not used. Which ones is not revealed. */
  missing: number;
  /** Index of the valid solution closest to the answer. */
  solutionIndex: number;
}

export type ParsonsCheck =
  | { ok: true; placements: ParsonsPlacement[] }
  | { ok: false; error: ParsonsIssue };

/** Validates untrusted input (e.g. from an HTTP body) against the exercise lines. */
export function checkParsonsPlacements(definition: ParsonsDefinition, input: unknown): ParsonsCheck {
  if (!Array.isArray(input)) return { ok: false, error: { code: "NOT_A_LIST", params: {} } };
  if (input.length > MAX_PARSONS_LINES) return { ok: false, error: { code: "TOO_MANY_LINES", params: { max: MAX_PARSONS_LINES } } };
  const known = definition.lines.map((line) => line.id);
  const seen: string[] = [];
  const placements: ParsonsPlacement[] = [];
  for (let position = 0; position < input.length; position++) {
    const item = input[position];
    const id = item && typeof item === "object" ? (item as { id?: unknown }).id : undefined;
    const indent = item && typeof item === "object" ? (item as { indent?: unknown }).indent : undefined;
    if (typeof id !== "string" || known.indexOf(id) === -1) {
      return { ok: false, error: { code: "UNKNOWN_LINE", params: { position } } };
    }
    if (seen.indexOf(id) !== -1) return { ok: false, error: { code: "DUPLICATE_LINE", params: { line: id } } };
    if (typeof indent !== "number" || indent % 1 !== 0 || indent < 0 || indent > MAX_PARSONS_INDENT) {
      return { ok: false, error: { code: "INVALID_INDENT", params: { line: id, max: MAX_PARSONS_INDENT } } };
    }
    seen.push(id);
    placements.push({ id, indent });
  }
  return { ok: true, placements };
}

/** Positions (in `a`) of one longest common subsequence of `a` and `b`; on ties it skips the earlier line of `a`. */
function lcsPositions(a: string[], b: string[]): number[] {
  const rows = a.length;
  const cols = b.length;
  const table: number[][] = [];
  for (let i = 0; i <= rows; i++) {
    table.push([]);
    for (let j = 0; j <= cols; j++) table[i].push(0);
  }
  for (let i = rows - 1; i >= 0; i--) {
    for (let j = cols - 1; j >= 0; j--) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const positions: number[] = [];
  let i = 0;
  let j = 0;
  while (i < rows && j < cols) {
    if (a[i] === b[j]) { positions.push(i); i++; j++; }
    else if (table[i + 1][j] >= table[i][j + 1]) i++;
    else j++;
  }
  return positions;
}

/** Grades valid placements (see checkParsonsPlacements). */
export function gradeParsons(definition: ParsonsDefinition, placements: ParsonsPlacement[]): ParsonsGrade {
  const isDistractor = (id: string) => definition.lines.some((line) => line.id === id && line.distractor === true);
  const used = placements.filter((placement) => !isDistractor(placement.id));
  const usedIds = used.map((placement) => placement.id);

  let best: ParsonsGrade | null = null;
  let bestScore = -1;
  for (let solutionIndex = 0; solutionIndex < definition.solutions.length; solutionIndex++) {
    const solution = definition.solutions[solutionIndex];
    const solutionIds = solution.map((step) => step[0]);
    const matched = lcsPositions(usedIds, solutionIds);
    const marks: Record<string, ParsonsLineMark> = {};
    let wrongIndent = 0;
    let score = 0;
    placements.forEach((placement) => { marks[placement.id] = isDistractor(placement.id) ? "distractor" : "misplaced"; });
    matched.forEach((position) => {
      const placement = used[position];
      const expected = solution[solutionIds.indexOf(placement.id)][1];
      if (placement.indent === expected) { marks[placement.id] = "correct"; score += 2; }
      else { marks[placement.id] = "wrong_indent"; wrongIndent++; score += 1; }
    });
    const misplaced = used.length - matched.length;
    const distractors = placements.length - used.length;
    const missing = solutionIds.filter((id) => usedIds.indexOf(id) === -1).length;
    if (score > bestScore) {
      bestScore = score;
      best = {
        correct: misplaced === 0 && wrongIndent === 0 && distractors === 0 && missing === 0,
        marks, misplaced, wrongIndent, distractors, missing, solutionIndex,
      };
    }
  }
  if (best === null) throw new Error("Parsons exercise without solutions");
  return best;
}

/** Checks an exercise definition (catalog or question bank) before it is offered. */
export function checkParsonsDefinition(definition: ParsonsDefinition): ParsonsIssue | null {
  const ids = definition.lines.map((line) => line.id);
  for (let i = 0; i < ids.length; i++) {
    if (ids.indexOf(ids[i]) !== i) return { code: "DUPLICATE_LINE", params: { line: ids[i] } };
  }
  if (definition.solutions.length === 0) return { code: "NOT_A_LIST", params: {} };
  const required = definition.lines.filter((line) => !line.distractor).map((line) => line.id).sort().join("|");
  for (const solution of definition.solutions) {
    const check = checkParsonsPlacements(definition, solution.map((step) => ({ id: step[0], indent: step[1] })));
    if (check.ok === false) return check.error;
    if (solution.map((step) => step[0]).sort().join("|") !== required) return { code: "UNKNOWN_LINE", params: { position: -1 } };
  }
  return null;
}
