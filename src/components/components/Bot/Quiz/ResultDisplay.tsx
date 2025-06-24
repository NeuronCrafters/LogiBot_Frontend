import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, PartyPopper, ChevronDown, ChevronUp } from "lucide-react";
import { Typograph } from "@/components/components/Typograph/Typograph";

interface AnswerDetail {
  question: string;
  selectedOption: {
    question: string;
    isCorrect: string;
    isSelected: string;
  };
  correctOption: string;
  explanation: string;
}

interface ResultDisplayProps {
  detalhes?: {
    questions?: AnswerDetail[];
  };
  totalCorrectAnswers: number;
  totalWrongAnswers: number;
}

export function ResultDisplay({
  detalhes,
  totalCorrectAnswers,
  totalWrongAnswers,
}: ResultDisplayProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    if (totalCorrectAnswers > 0 && totalWrongAnswers === 0) {
      setShowCelebration(true);
      const timeout = setTimeout(() => setShowCelebration(false), 4000);
      return () => clearTimeout(timeout);
    }
  }, [totalCorrectAnswers, totalWrongAnswers]);

  const questions = detalhes?.questions || [];

  return (
    <motion.div
      className="w-full mt-4 max-w-2xl mx-auto space-y-4 text-left"  // <— text-left aqui
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {showCelebration && (
        <motion.div
          className="flex items-center justify-center gap-2 text-green-400 bg-green-900/20 rounded-xl px-4 py-2 shadow text-left whitespace-normal break-words"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4 }}
        >
          <PartyPopper className="w-5 h-5 animate-bounce" />
          <Typograph
            text="🏆 Parabéns! Você acertou todas as questões!"
            variant="text4"
            weight="medium"
            fontFamily="poppins"
            colorText="text-green-400"
          />
        </motion.div>
      )}

      {/* Resumo */}
      <div className="bg-[#2a2a2a] rounded-xl p-4 shadow-sm space-y-2 text-left whitespace-normal break-words">
        <div className="flex items-center gap-2 text-green-400 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          <Typograph
            text={`Acertos: ${totalCorrectAnswers}`}
            variant="text8"
            weight="medium"
            fontFamily="poppins"
            colorText="text-green-400"
          />
        </div>
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <XCircle className="w-4 h-4" />
          <Typograph
            text={`Erros: ${totalWrongAnswers}`}
            variant="text8"
            weight="medium"
            fontFamily="poppins"
            colorText="text-red-400"
          />
        </div>
      </div>

      {/* Perguntas */}
      <div className="space-y-3 text-left whitespace-normal break-words">
        {questions.map((q, i) => {
          const isCorrect = q.selectedOption.isCorrect === "true";
          const isOpen = openIndex === i;

          return (
            <div
              key={i}
              className={`rounded-xl border p-4 ${isCorrect
                ? "border-green-500 bg-green-900/10"
                : "border-red-500 bg-red-900/10"
                }`}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex justify-between items-start"
              >
                <div className="flex items-start gap-2">
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 mt-1 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 mt-1 text-red-400" />
                  )}
                  <Typograph
                    text={`${i + 1}. ${q.selectedOption.question}`}
                    variant="text8"
                    weight="medium"
                    fontFamily="poppins"
                    colorText="text-white"
                  />
                </div>
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-white/70" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white/70" />
                )}
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-3 overflow-hidden text-left whitespace-normal break-words"
                  >
                    <div className="text-sm text-white/70 space-y-2">
                      {/* Resposta correta */}
                      <div className="flex flex-wrap items-baseline gap-1">
                        <Typograph
                          text="Resposta correta:"
                          variant="text8"
                          weight="semibold"
                          fontFamily="poppins"
                          colorText="text-white"
                        />
                        <Typograph
                          text={q.correctOption}
                          variant="text8"
                          weight="regular"
                          fontFamily="poppins"
                          colorText="text-white"
                        />
                      </div>

                      {/* Sua resposta */}
                      <div className="flex flex-wrap items-baseline gap-1">
                        <Typograph
                          text="Sua resposta:"
                          variant="text8"
                          weight="semibold"
                          fontFamily="poppins"
                          colorText="text-white"
                        />
                        <Typograph
                          text={q.selectedOption.isSelected}
                          variant="text8"
                          weight="regular"
                          fontFamily="poppins"
                          colorText="text-white"
                        />
                      </div>

                      {/* Explicação */}
                      <div className="flex flex-wrap items-baseline gap-1">
                        <Typograph
                          text="Explicação:"
                          variant="text8"
                          weight="semibold"
                          fontFamily="poppins"
                          colorText="text-white"
                        />
                        <Typograph
                          text={q.explanation}
                          variant="text8"
                          weight="regular"
                          fontFamily="poppins"
                          colorText="text-white"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
