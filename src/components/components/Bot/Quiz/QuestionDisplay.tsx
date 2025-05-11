import { useState } from "react";
import { Question } from "@/@types/QuestionType";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { ButtonBotAnswer } from "@/components/components/Button/ButtonBotAnswer";

interface QuestionsDisplayProps {
  questions: Question[];
  onSubmitAnswers: (answers: string[]) => void;
}

export function QuestionsDisplay({
  questions,
  onSubmitAnswers,
}: QuestionsDisplayProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});

  const handleSelect = (questionIndex: number, option: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionIndex]: option }));
  };

  const handleSubmit = () => {
    const answers = questions.map((q, index) => {
      const selected = selectedAnswers[index];
      const optionIndex = q.options.findIndex((opt) => opt === selected);
      const letter = ["A", "B", "C", "D", "E"][optionIndex] || "?";
      return letter;
    });

    onSubmitAnswers(answers);
  };

  return (
    <div className="space-y-6 mt-6">
      {questions.map((q, i) => (
        <div
          key={i}
          className="bg-[#1f2937] p-4 rounded-xl shadow space-y-4 border border-white/5"
        >
          <Typograph
            text={`${i + 1}. ${q.question}`}
            variant="text5"
            fontFamily="poppins"
            weight="semibold"
            colorText="text-white"
          />
          <div className="flex flex-col gap-2">
            {q.options.map((opt, j) => (
              <ButtonBotAnswer
                key={j}
                text={opt}
                selected={selectedAnswers[i] === opt}
                onClick={() => handleSelect(i, opt)}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-center pt-2">
        <ButtonBotAnswer
          isSubmit
          text="Enviar respostas"
          onClick={handleSubmit}
          disabled={questions.length === 0 || Object.keys(selectedAnswers).length !== questions.length}
        />
      </div>
    </div>
  );
}