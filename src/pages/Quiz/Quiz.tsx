import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Brain } from "lucide-react";
import { useAuth } from "@/hooks/use-Auth";
import { useQuizFlow } from "@/hooks/use-QuizFlow";
import { LevelStep } from "@/components/Bot/Quiz/LevelStep";
import { CategoryStep } from "@/components/Bot/Quiz/CategoryStep";
import { SubsubjectStep } from "@/components/Bot/Quiz/SubsubjectStep";
import { QuestionsDisplay } from "@/components/Bot/Quiz/QuestionDisplay";
import { ResultDisplay } from "@/components/Bot/Quiz/ResultDisplay";

const PROGRESS_STEPS = [
  "Nível",
  "Categoria",
  "Subtópico",
  "Perguntas",
  "Resultado",
] as const;

const STEP_INDEX: Record<string, number> = {
  levels: 0,
  categories: 1,
  subsubjects: 2,
  questions: 3,
  results: 4,
};

export function Quiz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?._id || "user";

  const {
    step,
    questions,
    resultData,
    categoryButtons,
    subsubjectButtons,
    handleInitialChoice,
    handleLevelNext,
    handleCategoryNext,
    handleSubsubjectNext,
    handleSubmitAnswers,
  } = useQuizFlow({ userId });

  useEffect(() => {
    handleInitialChoice("quiz");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentIndex = STEP_INDEX[step] ?? 0;

  return (
    <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <section className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-[Poppins] text-2xl font-semibold text-white">
                  Quiz
                </h1>
                <p className="mt-2 font-[Poppins] text-sm leading-relaxed text-zinc-400">
                  Pratique por nível, tema e subtópico com feedback imediato.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate("/inicio")}
              className="inline-flex h-10 w-fit items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 font-[Poppins] text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 sm:p-6">
          <div className="mb-8 flex items-center justify-between">
            {PROGRESS_STEPS.map((label, i) => (
              <div key={label} className="flex flex-1 items-center">
                <div className="flex min-w-0 flex-col items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full font-[Poppins] text-xs font-semibold transition-all ${
                      i < currentIndex
                        ? "bg-indigo-600 text-white"
                        : i === currentIndex
                          ? "bg-indigo-500 text-white ring-2 ring-indigo-400/30"
                          : "bg-white/10 text-zinc-500"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span
                    className={`hidden max-w-20 truncate font-[Poppins] text-[10px] transition-colors sm:block ${
                      i === currentIndex
                        ? "text-white"
                        : i < currentIndex
                          ? "text-indigo-400"
                          : "text-zinc-600"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < PROGRESS_STEPS.length - 1 && (
                  <div
                    className={`mx-2 mb-5 h-px flex-1 transition-colors ${
                      i < currentIndex ? "bg-indigo-500" : "bg-white/10"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {(step === "initial" || step === "levels") && (
              <motion.div
                key="levels"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                <LevelStep onNext={handleLevelNext} />
              </motion.div>
            )}
            {step === "categories" && (
              <motion.div
                key="categories"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                <CategoryStep
                  buttons={categoryButtons}
                  onNext={handleCategoryNext}
                />
              </motion.div>
            )}
            {step === "subsubjects" && (
              <motion.div
                key="subsubjects"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                <SubsubjectStep
                  buttons={subsubjectButtons}
                  onNext={handleSubsubjectNext}
                />
              </motion.div>
            )}
            {step === "questions" && (
              <motion.div
                key="questions"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                <QuestionsDisplay
                  questions={questions}
                  onSubmitAnswers={handleSubmitAnswers}
                />
              </motion.div>
            )}
            {step === "results" && resultData && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ResultDisplay
                  totalCorrectAnswers={resultData.totalCorrectAnswers}
                  totalWrongAnswers={resultData.totalWrongAnswers}
                  detalhes={resultData.detalhes}
                />
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => handleInitialChoice("quiz")}
                    className="h-11 rounded-lg border border-indigo-400/40 bg-indigo-600 px-5 font-[Poppins] text-sm font-semibold text-white shadow-md shadow-indigo-900/30 transition-colors hover:bg-indigo-700"
                  >
                    Continuar praticando
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </main>
  );
}
