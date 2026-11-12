import { t, useLocale } from "@/i18n";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Brain, GraduationCap, Loader2, Plus } from "lucide-react";
import { quizHistoryApi } from "@/features/quiz/api/quizApi";
import { formatRelativeTime } from "@/shared/lib/formatDate";
import { Button } from "@/components/ui/button";

interface QuizHistoryProps {
  userId: string;
  closeMenu?: () => void;
}

export function QuizHistory({ userId, closeMenu }: QuizHistoryProps) {
  useLocale();

  const navigate = useNavigate();

  const { data: quizzes = [], isLoading, isError } = useQuery({
    queryKey: ["quizHistory", userId],
    queryFn: () => quizHistoryApi.getHistory(userId),
    staleTime: 2 * 60 * 1000,
    enabled: !!userId,
  });

  const handleSelect = (quizId: string) => {
    navigate(`/quiz/${quizId}`);
    closeMenu?.();
  };

  const handleNewQuiz = () => {
    navigate("/quiz");
    closeMenu?.();
  };

  if (isLoading) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
        <span className="font-[Poppins] text-xs text-zinc-500">
          {t("quiz.carregandoHistorico")}</span>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-1">
      <Button
        onClick={handleNewQuiz}
        className="mb-1 h-9 w-full px-3 gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-600 font-[Poppins] text-xs font-medium text-on-accent transition-colors hover:bg-indigo-500"
      >
        <Plus size={14} />
        {t("quiz.verQuizzes")}</Button>

      {isError ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 px-4 text-center">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="font-[Poppins] text-xs text-zinc-500">
            {t("common.erroAoCarregarHistorico")}</span>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 px-4 text-center">
          <Brain className="h-5 w-5 text-zinc-700" />
          <span className="font-[Poppins] text-xs text-zinc-500">
            {t("quiz.nenhumQuizRespondido")}</span>
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {quizzes.map((quiz, index) => (
            <div
              key={`${quiz.quizId}-${index}`}
              onClick={() => handleSelect(quiz.quizId)}
              className="group flex cursor-pointer items-start gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-white/5"
            >
              <GraduationCap
                size={14}
                className="mt-0.5 shrink-0 text-indigo-400"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-[Poppins] text-xs leading-snug text-zinc-300 transition-colors group-hover:text-white">
                  {quiz.title || t("common.quiz")}
                </span>
                <div className="flex items-center gap-2 leading-snug">
                  <span className="font-[Poppins] text-xs text-zinc-600">
                    {formatRelativeTime(new Date(quiz.completedAt))}
                  </span>
                  <span className="font-[Poppins] text-xs font-semibold text-emerald-400">
                    {quiz.score}/{quiz.totalQuestions}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
