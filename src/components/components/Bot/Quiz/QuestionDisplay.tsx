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
    <div className="space-y-8 mt-6">
      {questions.map((q, i) => (
        <div key={i} className="space-y-4">
          <div className="border border-white/20 rounded-2xl p-4 bg-[#141414] shadow-md w-full max-w-[520px] mx-auto">
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
                  text={
                    <span className="flex items-start gap-2">
                      <span className="font-bold text-blue-400">{letter})</span>
                      <span className="text-white">{opt}</span>
                    </span>
                  }
                />
              );
            })}

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
