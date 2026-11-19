import { useMemo } from "react";
import { QUESTION_TYPES, type QuestionType } from "@/shared/logic/questionCore";
import { useFeatures } from "@/features/release/hooks/useFeatures";

/**
 * Question types offered to the professor. "Montar algoritmo" follows its release in the
 * feature release page: while it is blocked, it is neither offered in filters nor for new questions.
 * `keep` is the type of a question being edited, which always stays available.
 */
export function useQuestionTypes(keep?: QuestionType | null): QuestionType[] {
  const { isEnabled } = useFeatures();
  const parsons = isEnabled("practice_parsons");
  return useMemo(() => QUESTION_TYPES.filter((type) => type !== "parsons" || parsons || type === keep), [parsons, keep]);
}
