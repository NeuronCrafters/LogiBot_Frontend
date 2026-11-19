import type { ExamAnswer } from "@/features/exams/types";

export const MAX_ESSAY_LENGTH = 10000;

/** Same rule as the API: an empty answer counts as unanswered. */
export function isAnswered(answer: ExamAnswer | undefined): boolean {
  if (!answer) return false;
  if ("choice" in answer) return answer.choice !== null;
  if ("cells" in answer) return Object.keys(answer.cells).length > 0;
  if ("text" in answer) return answer.text.trim().length > 0;
  return answer.solution.length > 0;
}
