import { BadgeAlert, CheckCircle2, XCircle } from "lucide-react";

interface ResultDisplayProps {
  userAnswers: string[];
  correctAnswers: string[];
  totalCorrectAnswers: number;
  totalWrongAnswers: number;
}

export function ResultDisplay({
  userAnswers,
  correctAnswers,
  totalCorrectAnswers,
  totalWrongAnswers,
}: ResultDisplayProps) {
  return (
    <div className="w-full mt-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="p-4 bg-[#1e1e2f] rounded-2xl shadow">
        <p className="text-white font-bold mb-1">Resumo:</p>
        <p className="text-green-400 font-semibold">✅ Acertos: {totalCorrectAnswers}</p>
        <p className="text-red-400 font-semibold">❌ Erros: {totalWrongAnswers}</p>
      </div>

      <div className="space-y-4">
        {userAnswers.map((answer, i) => {
          const isCorrect = correctAnswers.includes(answer);

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
                  {answer}
                </p>

                {!isCorrect && correctAnswers[i] && (
                  <p className="text-sm text-blue-300 mt-1">
                    Resposta correta: <span className="font-medium">{correctAnswers[i]}</span>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
