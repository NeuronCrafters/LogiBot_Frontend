export type ExamState = "draft" | "scheduled" | "open" | "closed" | "released";
export type StudentExamStatus = "available" | "in_progress" | "upcoming" | "submitted" | "missed" | "released";

export interface ExamIssue { field: string; code: string; params: Record<string, string | number> }

export interface ManagedExamSummary {
  id: string;
  title: string;
  disciplineId: string;
  disciplineName: string;
  classId: string | null;
  state: ExamState;
  opensAt: string | null;
  closesAt: string | null;
  timeLimitMinutes: number | null;
  questionCount: number | null;
  submitted: number;
  inProgress: number;
}

export interface ManagedExam extends Omit<ManagedExamSummary, "questionCount"> {
  instructions: string | null;
  shuffle: boolean;
  publishedAt: string | null;
  closedAt: string | null;
  audience: number;
  totalWeight: number;
  questions: Array<{ questionId: string | null; type: string; statement: string; weight: number; version: number | null }>;
}

export interface ExamPayload {
  title: string;
  instructions: string;
  disciplineId: string;
  classId: string | null;
  shuffle: boolean;
  opensAt: string | null;
  closesAt: string | null;
  timeLimitMinutes: number | null;
  questionIds: string[];
}

export interface StudentExamSummary {
  id: string;
  title: string;
  disciplineName: string;
  opensAt: string | null;
  closesAt: string | null;
  timeLimitMinutes: number | null;
  questionCount: number;
  status: StudentExamStatus;
  startedAt: string | null;
  submittedAt: string | null;
  deadlineAt: string | null;
  grade?: number | null;
}

export type StudentQuestion =
  | { id: string; type: "quiz"; statement: string; language: string; weight: number; content: { options: string[] } }
  | { id: string; type: "truth_table"; statement: string; language: string; weight: number; content: { formula: string; columns?: "all" | "final" } }
  | { id: string; type: "translation"; statement: string; language: string; weight: number; content: { legend: Array<{ letter: string; text: string }> } }
  | { id: string; type: "parsons"; statement: string; language: string; weight: number; content: { lines: Array<{ id: string; text: string }> } }
  | { id: string; type: "essay"; statement: string; language: string; weight: number; content: Record<string, never> };

export type ExamAnswer =
  | { choice: number | null }
  | { cells: Record<string, boolean> }
  | { text: string }
  | { solution: Array<{ id: string; indent: number }> };

export type ExamAttempt =
  | {
    examId: string; title: string; instructions: string | null; status: "not_started"; state: ExamState;
    opensAt: string | null; closesAt: string | null; timeLimitMinutes: number | null; questionCount: number; serverNow: string;
  }
  | {
    examId: string; title: string; instructions: string | null; status: "in_progress"; startedAt: string; deadlineAt: string | null;
    serverNow: string; closesAt: string | null; timeLimitMinutes: number | null; questions: StudentQuestion[];
    answers: Record<string, ExamAnswer>; lastSavedAt: string | null;
  }
  | { examId: string; title: string; status: "submitted"; submittedAt: string; submitReason: "student" | "time_limit" | "exam_closed" }
  | ReleasedResult;

export type QuestionOutcome = "correct" | "partial" | "incorrect" | "blank";

export interface ReleasedResult {
  examId: string;
  title: string;
  status: "released";
  grade: number | null;
  submittedAt: string | null;
  submitReason: string | null;
  totalWeight: number;
  questions: Array<{ position: number; type: string; statement: string; language: string; weight: number; outcome: QuestionOutcome; points: number; comment: string }>;
}

export interface BlindReviewItem { id: string; code: string; text: string; score: number | null; comment: string }

export interface BlindReview {
  examId: string;
  title: string;
  released: boolean;
  reviewed: number;
  total: number;
  questions: Array<{ examQuestionId: string; position: number; statement: string; language: string; criteria: string; weight: number; items: BlindReviewItem[] }>;
}

export interface ExamResultRow {
  studentId: string;
  name: string;
  status: "submitted" | "missed";
  objectiveCorrect: number;
  objectiveTotal: number;
  essayPoints: number;
  essayTotal: number;
  grade: number | null;
  durationMs: number | null;
  submittedAt: string | null;
  submitReason: string | null;
}

export interface ExamResults { examId: string; title: string; releasedAt: string; rows: ExamResultRow[] }
