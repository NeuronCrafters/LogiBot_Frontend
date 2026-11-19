import { date, t, type MessageKey } from "@/i18n";
import type { ExamIssue, ExamState, StudentExamStatus } from "@/features/exams/types";

export const stateLabel = (state: ExamState) => t(`exams.state.${state}` as MessageKey);
export const studentStatusLabel = (status: StudentExamStatus) => t(`exams.student.status.${status}` as MessageKey);
export const formatDateTime = (value: string | Date) => date(value, { dateStyle: "short", timeStyle: "short" });

/** Exam form issues: specific messages first, then the generic question-bank ones (REQUIRED, TOO_LONG). */
export function examIssueMessage(issue: ExamIssue): string {
  const specific = `exams.issue.${issue.code}`;
  const message = t(specific as MessageKey, issue.params);
  return message === specific ? t(`questions.issue.${issue.code}` as MessageKey, issue.params) : message;
}

/** mm:ss or h:mm:ss for the countdown. */
export function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

/** Value for <input type="datetime-local"> in the person's own time zone. */
export function toLocalInput(value: string | null): string {
  if (!value) return "";
  const when = new Date(value);
  const offset = when.getTimezoneOffset() * 60000;
  return new Date(+when - offset).toISOString().slice(0, 16);
}

export function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const when = new Date(value);
  return isNaN(+when) ? null : when.toISOString();
}
