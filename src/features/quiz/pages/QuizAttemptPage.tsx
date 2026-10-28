import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  XCircle,
} from "lucide-react";
import { studentQuizApi } from "@/features/quiz/api/quizApi";
import { QUIZ_TOPICS } from "@/features/quiz/types";
import type { AttemptDetail, QuizAttemptResult } from "@/features/quiz/types";
import { toast } from "@/shared/lib/toast";

const TOPIC_LABEL: Record<string, string> = Object.fromEntries(
  QUIZ_TOPICS.map((t) => [t.value, t.label]),
);

const LETTERS = ["A", "B", "C", "D", "E"] as const;

// ── Result view ────────────────────────────────────────────────────────────────

function ResultView({
  result,
  onRetry,
  onBack,
}: {
  result: QuizAttemptResult;
  onRetry: () => void;
  onBack: () => void;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const pct = Math.round((result.score / result.totalQuestions) * 100);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 py-6">
          <span className="font-[Poppins] text-4xl font-bold text-white">
            {pct}%
          </span>
          <span className="font-[Poppins] text-xs text-indigo-300">
            Score
          </span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 py-6">
          <span className="font-[Poppins] text-4xl font-bold text-emerald-400">
            {result.score}
          </span>
          <span className="font-[Poppins] text-xs text-emerald-400">Correct</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-red-500/20 bg-red-500/10 py-6">
          <span className="font-[Poppins] text-4xl font-bold text-red-400">
            {result.totalQuestions - result.score}
          </span>
          <span className="font-[Poppins] text-xs text-red-400">Wrong</span>
        </div>
      </div>

      <div className="space-y-2">
        {result.detalhes.map((detail: AttemptDetail, i) => (
          <div
            key={i}
            className={`overflow-hidden rounded-xl border ${
              detail.isCorrect
                ? "border-emerald-500/20 bg-emerald-500/5"
                : "border-red-500/20 bg-red-500/5"
            }`}
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="flex w-full items-center gap-3 p-4 text-left"
            >
              <div className="shrink-0">
                {detail.isCorrect ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
              <span className="flex-1 font-[Poppins] text-sm text-white">
                {i + 1}. {detail.question}
              </span>
              {openIndex === i ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-zinc-500" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500" />
              )}
            </button>

            {openIndex === i && (
              <div className="space-y-2 border-t border-white/5 px-4 pb-4 pt-3">
                {!detail.isCorrect && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                    <div>
                      <p className="font-[Poppins] text-[10px] font-semibold uppercase tracking-wider text-red-400">
                        Your answer ({detail.selected})
                      </p>
                      <p className="mt-0.5 font-[Poppins] text-sm text-zinc-300">
                        {detail.selectedText}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <div>
                    <p className="font-[Poppins] text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                      Correct answer ({detail.correct})
                    </p>
                    <p className="mt-0.5 font-[Poppins] text-sm text-zinc-300">
                      {detail.correctText}
                    </p>
                  </div>
                </div>
                {detail.explanation && (
                  <div className="rounded-lg border border-white/5 bg-white/5 p-3">
                    <p className="font-[Poppins] text-xs leading-relaxed text-zinc-400">
                      {detail.explanation}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <button
          onClick={onRetry}
          className="h-11 flex-1 rounded-lg bg-indigo-600 font-[Poppins] text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          Try again
        </button>
        <button
          onClick={onBack}
          className="h-11 flex-1 rounded-lg border border-white/10 bg-white/5 font-[Poppins] text-sm text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          Back to quizzes
        </button>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export function QuizAttempt() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizAttemptResult | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const {
    data: quiz,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["quizDetail", id],
    queryFn: () => studentQuizApi.getQuiz(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  const submitMutation = useMutation({
    mutationFn: () => studentQuizApi.submitAttempt(id!, answers),
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["studentQuizHub"] });
    },
    onError: () => toast.error("Failed to submit answers. Please try again."),
  });

  const handleSelect = (questionId: string, letter: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: letter }));
  };

  const handleRetry = () => {
    setAnswers({});
    setResult(null);
    setCurrentIndex(0);
  };

  // Reset index when quiz loads
  useEffect(() => { setCurrentIndex(0); }, [id]);

  if (isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </main>
    );
  }

  if (error || !quiz) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="font-[Poppins] text-sm text-zinc-400">
          Quiz not found.
        </p>
        <button
          onClick={() => navigate("/quiz")}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-[Poppins] text-sm text-zinc-300 hover:bg-white/10"
        >
          Back
        </button>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        {/* Header */}
        <section className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-[Poppins] text-xl font-semibold text-white">
                  {quiz.title}
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 font-[Poppins] text-xs text-indigo-400">
                    <BookOpen className="h-3 w-3" />
                    {quiz.disciplineName}
                  </span>
                  <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-[Poppins] text-xs text-zinc-500">
                    {TOPIC_LABEL[quiz.topic] ?? quiz.topic}
                  </span>
                </div>
                {quiz.description && (
                  <p className="mt-2 font-[Poppins] text-xs leading-relaxed text-zinc-500">
                    {quiz.description}
                  </p>
                )}
              </div>
            </div>
            {!result && (
              <button
                onClick={() => navigate("/quiz")}
                className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 font-[Poppins] text-sm text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}
          </div>
        </section>

        {/* Content */}
        <section className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 sm:p-6">
          {result ? (
            <ResultView
              result={result}
              onRetry={handleRetry}
              onBack={() => navigate("/quiz")}
            />
          ) : (() => {
            const total = quiz.questions.length;
            const q = quiz.questions[currentIndex];
            const isLast = currentIndex === total - 1;
            const currentAnswer = answers[q.id];
            const answered = !!currentAnswer;

            return (
              <div className="space-y-5">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-[Poppins] text-xs text-zinc-500">
                      Question {currentIndex + 1} of {total}
                    </span>
                    <span className="font-[Poppins] text-xs text-zinc-600">
                      {Object.keys(answers).length}/{total} answered
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Question */}
                <div className="space-y-3">
                  <p className="font-[Poppins] text-base font-medium leading-relaxed text-white">
                    {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => {
                      const letter = LETTERS[oi];
                      const selected = currentAnswer === letter;
                      return (
                        <button
                          key={oi}
                          onClick={() => handleSelect(q.id, letter)}
                          className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                            selected
                              ? "border-indigo-500/50 bg-indigo-500/15 text-white"
                              : "border-white/10 bg-neutral-950/60 text-zinc-300 hover:border-white/20 hover:bg-white/5"
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-[Poppins] text-[10px] font-bold transition-colors ${
                              selected
                                ? "border-indigo-400 bg-indigo-500 text-white"
                                : "border-white/20 bg-white/5 text-zinc-500"
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="font-[Poppins] text-sm leading-relaxed">
                            {opt}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-3 border-t border-white/5 pt-4">
                  <button
                    onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                    disabled={currentIndex === 0}
                    className="flex h-10 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-4 font-[Poppins] text-sm text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </button>

                  <div className="flex flex-1 justify-center gap-1">
                    {quiz.questions.map((_, qi) => (
                      <button
                        key={qi}
                        onClick={() => setCurrentIndex(qi)}
                        className={`h-2 rounded-full transition-all ${
                          qi === currentIndex
                            ? "w-5 bg-indigo-500"
                            : answers[quiz.questions[qi].id]
                              ? "w-2 bg-indigo-400/40"
                              : "w-2 bg-white/10"
                        }`}
                      />
                    ))}
                  </div>

                  {isLast ? (
                    <button
                      onClick={() => submitMutation.mutate()}
                      disabled={!answered || submitMutation.isPending}
                      className="flex h-10 items-center gap-1.5 rounded-lg bg-indigo-600 px-4 font-[Poppins] text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Finish
                          <CheckCircle2 className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentIndex((i) => Math.min(total - 1, i + 1))}
                      disabled={!answered}
                      className="flex h-10 items-center gap-1.5 rounded-lg bg-indigo-600 px-4 font-[Poppins] text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </section>
      </div>
    </main>
  );
}
