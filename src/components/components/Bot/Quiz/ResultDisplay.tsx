import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, PartyPopper } from "lucide-react";
import { Typograph } from "@/components/components/Typograph/Typograph";

interface AnswerDetail {
  level: string;
  subject: string;
  selectedOption: {
    question: string;
    isCorrect: string;
    isSelected: string;
  };
  correctOption?: string;
  totalCorrectAnswers: number;
  totalWrongAnswers: number;
  timestamp: string;
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
      className="w-full mt-4 max-w-2xl mx-auto space-y-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {showCelebration && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-center gap-2 text-green-400 bg-green-900/20 rounded-xl px-4 py-2 shadow"
        >
          <PartyPopper className="w-5 h-5 animate-bounce" />
          <Typograph
            text="Parabéns! Você acertou todas as questões!"
            variant="text4"
            weight="medium"
            fontFamily="poppins"
            colorText="text-green-400"
          />
        </motion.div>
      )}

      {/* Bloco de resumo com ícones */}
      <div className="bg-[#1f2937] rounded-xl p-4 shadow-sm space-y-2">
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

      {/* Lista de questões respondidas */}
      <div className="space-y-3">
        {questions.map((q, i) => {
          const isCorrect = q.selectedOption.isCorrect === "true";
          return (
            <div
              key={i}
              className={`p-3 rounded-lg border flex items-start gap-2 text-sm ${isCorrect
                  ? "border-green-500 bg-green-900/10 text-green-300"
                  : "border-red-500 bg-red-900/10 text-red-300"
                }`}
            >
              {isCorrect ? (
                <CheckCircle2 className="w-5 h-5 mt-1" />
              ) : (
                <XCircle className="w-5 h-5 mt-1" />
              )}
              <Typograph
                text={q.selectedOption.question}
                variant="text8"
                weight="regular"
                fontFamily="poppins"
                colorText="text-white"
              />
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
