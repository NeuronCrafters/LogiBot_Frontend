import { t, type MessageKey } from "@/i18n";
import { QUIZ_TOPICS } from "@/features/quiz/types";
import { logicIssueMessage } from "@/features/exercises/lib/logicLabels";
import type { LogicErrorCode } from "@/shared/logic/logicCore";
import type { QuestionIssue, QuestionType } from "@/shared/logic/questionCore";

export const typeLabel = (type: QuestionType | string) => t(`questions.type.${type}` as MessageKey);

/** Subjects come from the existing quiz topic catalog (concepts are sub-tags of a subject). */
export function subjectLabel(subject: string | null | undefined): string {
  if (!subject) return t("questions.editor.subjectNone");
  const topic = QUIZ_TOPICS.find((item) => item.value === subject);
  return topic ? topic.label : subject;
}

export function issueMessage(issue: QuestionIssue): string {
  if (issue.code === "FORMULA_INVALID") {
    const { logicCode, ...params } = issue.params;
    return logicIssueMessage({ code: logicCode as LogicErrorCode, params });
  }
  return t(`questions.issue.${issue.code}` as MessageKey, issue.params);
}

/** Stable DOM id for a form field path such as "content.options.1". */
export const fieldDomId = (base: string, field: string) => `${base}-${field.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
