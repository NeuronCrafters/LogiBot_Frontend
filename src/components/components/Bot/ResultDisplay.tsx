import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

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
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (totalCorrectAnswers > 0 && totalWrongAnswers === 0) {
      setShowConfetti(true);
      const timeout = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timeout);
    }
  }, [totalCorrectAnswers, totalWrongAnswers]);

  const questions = detalhes?.questions || [];

  return (
    <div className="w-full mt-6 max-w-2xl mx-auto space-y-6 animate-fade-in relative">
      {showConfetti && (
        <Confetti width={width} height={height} numberOfPieces={300} recycle={false} />
      )}

      {/* Resumo */}
      <div className="p-4 bg-[#1f2937] rounded-2xl shadow">
        <p className="text-white font-bold mb-1">Resumo:</p>
        <p className="text-green-400 font-semibold">✅ Acertos: {totalCorrectAnswers}</p>
        <p className="text-red-400 font-semibold">❌ Erros: {totalWrongAnswers}</p>
      </div>

      {/* Respostas */}
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
              <div>
                <p className="text-white">
                  <span className="font-semibold">
                    {isCorrect ? "Você acertou:" : "Você errou:"}
                  </span>{" "}
                  {resposta}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
