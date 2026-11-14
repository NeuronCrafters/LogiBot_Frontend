import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Brain } from "lucide-react";
import { t, useLocale } from "@/i18n";
import { studentQuizApi } from "@/features/quiz/api/quizApi";
import { QUIZ_TOPICS } from "@/features/quiz/types";
import { pickPracticeQuiz } from "../lib/learningSuggestions";
import { preloadQuizAttemptPage } from "@/shared/navigation/preloadQuiz";

export function ChatQuizPracticeInvitation({ userId, sessionId, questions, onReady }: {
  userId: string; sessionId: string; questions: readonly string[]; onReady?: () => void;
}) {
  useLocale();
  const queryClient = useQueryClient();
  const storageKey = `logibot.quizPractice:${userId}:${sessionId}`;
  const [dismissed, setDismissed] = useState<string[]>(() => {
    try { const value = JSON.parse(sessionStorage.getItem(storageKey) || "[]"); return Array.isArray(value) ? value : []; }
    catch { return []; }
  });
  const { data: quizzes = [] } = useQuery({
    queryKey: ["studentQuizHub", userId],
    queryFn: () => studentQuizApi.getHub(),
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const quiz = pickPracticeQuiz(quizzes, questions);
  const visible = !!quiz && !dismissed.includes(quiz.topic);
  useEffect(() => { if (visible) onReady?.(); }, [visible, quiz?.id, onReady]);
  if (!visible || !quiz) return null;
  const dismiss = (hide = true) => {
    const next = [...dismissed, quiz.topic];
    if (hide) setDismissed(next);
    try { sessionStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Keep the current dismissal even if storage is unavailable. */ }
  };
  const prepareQuiz = () => {
    void preloadQuizAttemptPage().catch(() => {});
    void queryClient.prefetchQuery({ queryKey: ["quizDetail", quiz.id], queryFn: () => studentQuizApi.getQuiz(quiz.id), staleTime: 5 * 60 * 1000 });
  };
  const topic = QUIZ_TOPICS.find(option => option.value === quiz.topic)?.label || quiz.topic;
  return <section aria-label={t("chat.quizPracticeTitle")} className="mb-6 ml-12 mr-2 rounded-2xl border border-indigo-400/25 bg-indigo-500/5 p-4 font-[Poppins]">
    <div className="flex items-start gap-3">
      <Brain aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-indigo-400" />
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-white">{t("chat.quizPracticeTitle")}</h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-300">{t("chat.quizPracticeInvitation", { topic })}</p>
        <p lang={quiz.language || undefined} className="mt-2 text-xs text-zinc-400 [overflow-wrap:anywhere]">{quiz.title}</p>
      </div>
    </div>
    <div className="mt-3 flex flex-wrap gap-2">
      <Link to={`/quiz/${quiz.id}`} onPointerEnter={prepareQuiz} onFocus={prepareQuiz} onClick={() => { prepareQuiz(); dismiss(false); }} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-on-accent transition-colors hover:bg-indigo-500">
        {t("chat.quizPracticeAction")}<ArrowRight aria-hidden="true" size={15} />
      </Link>
      <button type="button" onClick={() => dismiss()} className="min-h-11 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-neutral-800 hover:text-white">{t("chat.quizPracticeDismiss")}</button>
    </div>
  </section>;
}
