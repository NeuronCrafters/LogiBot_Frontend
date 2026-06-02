import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Typograph } from "@/components/Typograph/Typograph";

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
    <div className="mx-auto w-full max-w-3xl space-y-4 break-words text-left whitespace-normal">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <div className="flex items-center gap-2 text-sm text-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <Typograph text={`Acertos: ${totalCorrectAnswers}`} variant="text8" weight="medium" fontFamily="poppins" colorText="text-green-400" />
          </div>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <div className="flex items-center gap-2 text-sm text-red-400">
          <XCircle className="w-4 h-4" />
          <Typograph text={`Erros: ${totalWrongAnswers}`} variant="text8" weight="medium" fontFamily="poppins" colorText="text-red-400" />
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {questions.map((q, i) => {
          const { isCorrect, isOpen } = { isCorrect: q.isCorrect, isOpen: openIndex === i };
          return (
            <div key={i} className={`rounded-xl border bg-neutral-950/60 p-4 ${isCorrect ? "border-emerald-500/30" : "border-red-500/30"}`}>
              <button onClick={() => setOpenIndex(isOpen ? null : i)} className="w-full flex justify-between items-start text-left">
                <div className="flex items-start gap-2">
                  {isCorrect ? <CheckCircle2 className="w-5 h-5 mt-1 text-green-400 flex-shrink-0" /> : <XCircle className="w-5 h-5 mt-1 text-red-400 flex-shrink-0" />}
                  <Typograph text={`${i + 1}. ${q.question}`} variant="text8" weight="medium" fontFamily="poppins" colorText="text-white" />
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5 text-white/70 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-white/70 flex-shrink-0" />}
              </button>

              {isOpen && (
                <div className="mt-3 pt-3 border-t border-white/10">
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
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
