import type { Assignment, CellMark, ConceptSlug, TruthTableGrade } from "@/shared/logic/logicCore";
import type { ParsonsLineMark, ParsonsPlacement } from "@/shared/logic/parsonsCore";

export type ExerciseSource = "catalog" | "custom" | "bank";

/** Question registered by a professor and offered in the workbench (no answer key). */
interface PracticeBankBase { id: string; statement: string; language: string; concepts: string[] }
export type PracticeBankItem =
  | (PracticeBankBase & { type: "truth_table"; content: { formula: string; columns?: "all" | "final" } })
  | (PracticeBankBase & { type: "translation"; content: { legend: Array<{ letter: string; text: string }> } })
  | (PracticeBankBase & { type: "parsons"; content: { lines: Array<{ id: string; text: string }> } });
export type PracticeBankType = PracticeBankItem["type"];
export type PracticeEventAction = "load" | "mark" | "clear" | "edit" | "insert" | "select" | "move" | "indent" | "reset";

export interface PracticeEvent {
  t: number;
  action: PracticeEventAction;
  row?: number;
  column?: string;
  value?: boolean | null;
  line?: string;
  from?: "bank" | "solution";
  to?: "bank" | "solution";
  position?: number;
  indent?: number;
  via?: "drag" | "button" | "keyboard";
  text?: string;
}

export interface TruthTableAttemptRequest {
  type: "truth_table";
  source: ExerciseSource;
  formula: string;
  /** Every intermediate column or only the final one; bank questions use the professor's choice. */
  columns?: "all" | "final";
  bankQuestionId?: string;
  cells: Record<string, boolean>;
  events: PracticeEvent[];
  hintsUsed: number;
  durationMs: number;
}

export interface TruthTableAttemptResponse {
  attemptId: string;
  attemptNumber: number;
  exerciseId: string;
  formula: string;
  concepts: ConceptSlug[];
  correct: boolean;
  total: number;
  right: number;
  empty: number;
  wrong: TruthTableGrade["wrong"];
  errorsByConcept: TruthTableGrade["errorsByConcept"];
  marks: Record<string, CellMark>;
  engineVersion: string;
}

interface CommonAttemptFields {
  events: PracticeEvent[];
  hintsUsed: number;
  durationMs: number;
}

export interface TranslationAttemptRequest extends CommonAttemptFields {
  type: "translation";
  exerciseId?: string;
  bankQuestionId?: string;
  answer: string;
}

export interface TranslationAttemptResponse {
  attemptId: string;
  attemptNumber: number;
  exerciseId: string;
  concepts: string[];
  correct: boolean;
  normalizedAnswer: string;
  equivalentTo?: string;
  counterexample?: Assignment;
  answerValue?: boolean;
  expectedValue?: boolean;
  engineVersion: string;
}

export interface ParsonsAttemptRequest extends CommonAttemptFields {
  type: "parsons";
  exerciseId?: string;
  bankQuestionId?: string;
  solution: ParsonsPlacement[];
}

export interface ParsonsAttemptResponse {
  attemptId: string;
  attemptNumber: number;
  exerciseId: string;
  concepts: string[];
  correct: boolean;
  marks: Record<string, ParsonsLineMark>;
  misplaced: number;
  wrongIndent: number;
  distractors: number;
  missing: number;
  engineVersion: string;
}

/** Hints of the workbench: up to 3 per exercise, each one going a step further. */
export interface HintItem { level: number; text: string; createdAt?: string }
export interface HintStatus { hints: HintItem[]; remaining: number }
export interface HintResponse extends HintItem { remaining: number; usedMaterial: boolean; materials: string[]; concepts: string[] }
