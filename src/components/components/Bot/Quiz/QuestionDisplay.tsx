import { useState } from "react";
import { Question } from "@/@types/QuestionType";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { ButtonBotAnswer } from "@/components/components/Button/ButtonBotAnswer";

interface QuestionsDisplayProps {
  questions: Question[];
  onSubmitAnswers: (answers: string[]) => Promise<void>;
}

export function QuestionsDisplay({
  questions,
  onSubmitAnswers,
}: QuestionsDisplayProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelect = (questionIndex: number, option: string) => {
    if (isSubmitting) return;
    setSelectedAnswers((prev) => {
      const current = prev[questionIndex];
      if (current === option) {
        const updated = { ...prev };
        delete updated[questionIndex];
        return updated;
      } else {
        return { ...prev, [questionIndex]: option };
      }
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const answers = questions.map((q, index) => {
      const selected = selectedAnswers[index];
      const optionIndex = q.options.findIndex((opt) => opt === selected);
      const letter = ["A", "B", "C", "D", "E"][optionIndex] || "?";
      return letter;
    });

    try {
      await onSubmitAnswers(answers);
      // se quiser reabilitar depois:
      // setIsSubmitting(false);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const allAnswered = Object.keys(selectedAnswers).length === questions.length;

  return (
    <div className="mt-6 space-y-8">
      {questions.map((q, i) => (
        <div key={i} className="space-y-4">
          <div className="border border-white/20 rounded-2xl p-4 bg-[#539169] shadow-md w-full max-w-[520px] mx-auto">
            <Typograph
              text={`${i + 1}. ${q.question}`}
              variant="text7"
              fontFamily="poppins"
              weight="medium"
              colorText="text-white"
            />
          </div>
          <div className="flex flex-col items-center gap-2">
            {q.options.map((opt, j) => {
              const letter = ["A", "B", "C", "D", "E"][j] || "?";
              return (
                <ButtonBotAnswer
                  key={j}
                  selected={selectedAnswers[i] === opt}
                  onClick={() => handleSelect(i, opt)}
                  disabled={isSubmitting}
                  text={
                    <span className="flex items-start gap-2">
                      <span className="font-bold text-blue-400">{letter}</span>
                      <span className="text-white">{opt}</span>
                    </span>
                  }
                />
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex flex-col items-center pt-2">
        <ButtonBotAnswer
          isSubmit
          onClick={handleSubmit}
          disabled={!allAnswered || isSubmitting}
          text={isSubmitting ? "Analisando respostas..." : "Enviar respostas"}
        />

        {isSubmitting && (
          <Typograph
            text="Por favor, aguarde enquanto suas respostas são analisadas..."
            variant="text10"
            fontFamily="poppins"
            weight="regular"
            colorText="text-white/70"
            className="mt-2"
          />
        )}
      </div>
    </div>
  );
}
