import { useState } from "react";
import { logger } from "@/shared/lib/logger";
import { Question } from "@/features/quiz/types";
import { Typograph } from "@/shared/components/Typography";
import { QuizAnswerButton } from "./QuizAnswerButton";

interface QuestionsDisplayProps {
  questions: Question[];
  onSubmitAnswers: (answers: string[]) => Promise<void>;
}

export function QuestionsDisplay({
  questions,
  onSubmitAnswers,
}: QuestionsDisplayProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, string>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cleanOptionText = (text: string) => text.replace(/^[A-E][).]\s*/, "");

  const handleSelect = (questionIndex: number, option: string) => {
    if (isSubmitting) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionIndex]: option }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const answers = questions.map((q, index) => {
      const selected = selectedAnswers[index];
      const optionIndex = q.options.findIndex((opt) => opt === selected);
      return ["A", "B", "C", "D", "E"][optionIndex] || "?";
    });

    try {
      await onSubmitAnswers(answers);
    } catch (err) {
      logger.error("Quiz", "Erro ao submeter respostas.", err);
      setIsSubmitting(false);
    }
  };

  const allAnswered = Object.keys(selectedAnswers).length === questions.length;

  return (
    <div className="space-y-6">
      {questions.map((q, i) => (
        <div
          key={i}
          className="space-y-3 rounded-2xl border border-white/10 bg-neutral-950/50 p-4"
        >
          <div className="rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-4">
            <Typograph
              text={`${i + 1}. ${q.question}`}
              variant="text7"
              fontFamily="poppins"
              weight="medium"
              colorText="text-white"
            />
          </div>
          <div className="flex flex-col gap-2">
            {q.options.map((opt, j) => {
              const letter = ["A", "B", "C", "D", "E"][j] || "?";
              return (
                <QuizAnswerButton
                  key={j}
                  selected={selectedAnswers[i] === opt}
                  onClick={() => handleSelect(i, opt)}
                  disabled={isSubmitting}
                  text={
                    <span className="flex items-start gap-2">
                      <span className="font-bold text-indigo-400">
                        {letter}
                      </span>
                      <span className="text-white">{cleanOptionText(opt)}</span>
                    </span>
                  }
                />
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex flex-col items-center pt-2">
        <QuizAnswerButton
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
