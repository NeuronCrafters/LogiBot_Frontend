import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { studentQuizApi } from "@/features/quiz/api/quizApi";
import { QUIZ_TOPICS } from "@/features/quiz/types";
import type { StudentQuizItem } from "@/features/quiz/types";

const TOPIC_LABEL: Record<string, string> = Object.fromEntries(
  QUIZ_TOPICS.map((t) => [t.value, t.label]),
);

function QuizCard({
  quiz,
  onClick,
}: {
  quiz: StudentQuizItem;
  onClick: () => void;
}) {
  const pct =
    quiz.attempted && quiz.bestTotalQuestions
      ? Math.round((quiz.bestScore! / quiz.bestTotalQuestions) * 100)
      : null;

  return (
    <button
      onClick={onClick}
      className="group flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 text-left shadow-md shadow-black/10 transition-all hover:border-white/20 hover:bg-[#252525]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
          <Brain className="h-5 w-5" />
        </div>
        {quiz.attempted ? (
          <span className="flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-[Poppins] text-xs font-medium text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            {pct}%
          </span>
        ) : (
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-[Poppins] text-xs text-zinc-500">
            Not answered
          </span>
        )}
      </div>

      <div className="flex-1">
        <p className="font-[Poppins] text-sm font-semibold leading-snug text-white">
          {quiz.title}
        </p>
        {quiz.description && (
          <p className="mt-1 line-clamp-2 font-[Poppins] text-xs leading-relaxed text-zinc-500">
            {quiz.description}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-t border-white/5 pt-3">
        <span className="inline-flex items-center gap-1 rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 font-[Poppins] text-[10px] font-medium text-indigo-400">
          <BookOpen className="h-3 w-3" />
          {quiz.disciplineName}
        </span>
        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-[Poppins] text-[10px] text-zinc-500">
          {TOPIC_LABEL[quiz.topic] ?? quiz.topic}
        </span>
        <span className="ml-auto flex items-center gap-1 font-[Poppins] text-[10px] text-zinc-600">
          {quiz.questionCount} {quiz.questionCount === 1 ? "question" : "questions"}
          <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  );
}

export function Quiz() {
  const navigate = useNavigate();

  const {
    data: quizzes,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["studentQuizHub"],
    queryFn: studentQuizApi.getHub,
    staleTime: 2 * 60 * 1000,
  });

  return (
    <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <section className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-[Poppins] text-2xl font-semibold text-white">
                My Quizzes
              </h1>
              <p className="mt-1 font-[Poppins] text-sm leading-relaxed text-zinc-400">
                Quizzes available for your class subjects.
              </p>
            </div>
          </div>
        </section>

        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-[#1f1f1f] py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            <p className="font-[Poppins] text-sm text-zinc-500">
              Loading quizzes...
            </p>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/5 py-16">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="font-[Poppins] text-sm font-semibold text-white">
                Failed to load quizzes
              </p>
              <p className="mt-1 font-[Poppins] text-xs text-zinc-500">
                Check your connection and try again.
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 font-[Poppins] text-sm text-red-300 transition-colors hover:bg-red-500/20"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !error && quizzes?.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/10 bg-[#1f1f1f] py-20">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-neutral-950/60 text-zinc-700">
              <Brain className="h-7 w-7" />
            </div>
            <div className="text-center">
              <p className="font-[Poppins] text-sm font-semibold text-white">
                No quiz available
              </p>
              <p className="mt-1 max-w-xs font-[Poppins] text-xs leading-relaxed text-zinc-500">
                Your professors have not created quizzes for your subjects yet.
              </p>
            </div>
          </div>
        )}

        {!isLoading && !error && quizzes && quizzes.length > 0 && (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {quizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                onClick={() => navigate(`/quiz/${quiz.id}`)}
              />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
