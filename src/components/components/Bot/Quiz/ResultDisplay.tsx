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
      const timeout = setTimeout(() => setShowCelebration(false), 5000);
      return () => clearTimeout(timeout);
    }
  }, [totalCorrectAnswers, totalWrongAnswers]);

  const questions = detalhes?.questions || [];

  return (
    <motion.div
      className="w-full mt-6 max-w-2xl mx-auto space-y-6 animate-fade-in relative"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {showCelebration && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
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

      <div className="p-4 bg-[#1f2937] rounded-2xl shadow space-y-1">
        <Typograph
          text="Resumo:"
          variant="text3"
          weight="semibold"
          fontFamily="poppins"
          colorText="text-white"
        />
        <Typograph
          text={`✅ Acertos: ${totalCorrectAnswers}`}
          variant="text4"
          weight="medium"
          fontFamily="poppins"
          colorText="text-green-400"
        />
        <Typograph
          text={`❌ Erros: ${totalWrongAnswers}`}
          variant="text4"
          weight="medium"
          fontFamily="poppins"
          colorText="text-red-400"
        />
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => {
          const isCorrect = q.selectedOption.isCorrect === "true";
          const resposta = q.selectedOption.question;

          return (
            <div
              key={i}
              className={`p-4 rounded-xl flex items-start gap-3 ${isCorrect
                  ? "bg-green-800/20 border border-green-500"
                  : "bg-red-800/20 border border-red-500"
                }`}
            >
              {isCorrect ? (
                <CheckCircle2 className="text-green-400 mt-1" />
              ) : (
                <XCircle className="text-red-400 mt-1" />
              )}

              <Typograph
                text={
                  isCorrect
                    ? `Você acertou: ${resposta}`
                    : `Você errou: ${resposta}`
                }
                variant="text4"
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
