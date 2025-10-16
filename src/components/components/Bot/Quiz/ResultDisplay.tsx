// ARQUIVO DO FRONTEND: src/components/components/Bot/Quiz/ResultDisplay.tsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Typograph } from "@/components/components/Typograph/Typograph";

// MUDANÇA: A interface local agora corresponde à da API
interface ResultDetail {
  question: string;
  selected: string;
  selectedText: string;
  correct: string;
  correctText: string;
  isCorrect: boolean;
  explanation: string;
}

interface ResultDisplayProps {
  totalCorrectAnswers: number;
  totalWrongAnswers: number;
  detalhes: ResultDetail[];
}

export function ResultDisplay({ totalCorrectAnswers, totalWrongAnswers, detalhes }: ResultDisplayProps) {
  const [, setShowCelebration] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const questions = detalhes || [];

  useEffect(() => {
    if (totalCorrectAnswers > 0 && totalWrongAnswers === 0) {
      setShowCelebration(true);
      const timeout = setTimeout(() => setShowCelebration(false), 4000);
      return () => clearTimeout(timeout);
    }
  }, [totalCorrectAnswers, totalWrongAnswers]);

  return (
    <motion.div
      className="w-full mt-4 max-w-2xl mx-auto space-y-4 text-left whitespace-normal break-words"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* ... (código do resumo e celebração sem alterações) ... */}
      <div className="bg-[#2a2a2a] rounded-xl p-4 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-green-400 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          <Typograph text={`Acertos: ${totalCorrectAnswers}`} variant="text8" weight="medium" fontFamily="poppins" colorText="text-green-400" />
        </div>
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <XCircle className="w-4 h-4" />
          <Typograph text={`Erros: ${totalWrongAnswers}`} variant="text8" weight="medium" fontFamily="poppins" colorText="text-red-400" />
        </div>
      </div>

      {/* Detalhes das Perguntas */}
      <div className="space-y-3">
        {questions.map((q, i) => {
          const { isCorrect, isOpen } = { isCorrect: q.isCorrect, isOpen: openIndex === i };
          return (
            <div key={i} className={`rounded-xl border p-4 ${isCorrect ? "border-green-500 bg-green-900/10" : "border-red-500 bg-red-900/10"}`}>
              <button onClick={() => setOpenIndex(isOpen ? null : i)} className="w-full flex justify-between items-start text-left">
                <div className="flex items-start gap-2">
                  {isCorrect ? <CheckCircle2 className="w-5 h-5 mt-1 text-green-400 flex-shrink-0" /> : <XCircle className="w-5 h-5 mt-1 text-red-400 flex-shrink-0" />}
                  <Typograph text={`${i + 1}. ${q.question}`} variant="text8" weight="medium" fontFamily="poppins" colorText="text-white" />
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5 text-white/70 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-white/70 flex-shrink-0" />}
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-3 pt-3 border-t border-white/10 overflow-hidden"
                  >
                    <div className="text-sm text-white/80 space-y-2">
                      {!isCorrect && (
                        <p>
                          <strong className="text-white/90 font-semibold">Sua resposta: </strong>
                          {q.selected} - {q.selectedText}
                        </p>
                      )}
                      <p>
                        <strong className="text-white/90 font-semibold">Resposta correta: </strong>
                        {q.correct} - {q.correctText}
                      </p>
                      <p>
                        <strong className="text-white/90 font-semibold">Explicação: </strong>
                        {q.explanation}
                      </p>
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