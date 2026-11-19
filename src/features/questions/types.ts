import type { NormalizedQuestion, QuestionIssue } from "@/shared/logic/questionCore";

export interface BankQuestion extends NormalizedQuestion {
  id: string;
  ownerId: string;
  disciplineId: string;
  disciplineName: string;
  version: number;
  sourceQuizQuestionId: string | null;
  /** Offered in the student workbench (truth table, translation and Parsons only). */
  practiceEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionPayload {
  disciplineId: string;
  type: string;
  statement: string;
  weight: number;
  subject: string | null;
  concepts: string[];
  language: string;
  content: unknown;
  practiceEnabled: boolean;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  invalid: number;
}

/** 400 response of the API with per-field issues. */
export interface QuestionValidationResponse {
  code: "questions.invalid";
  message: string;
  issues: QuestionIssue[];
}
