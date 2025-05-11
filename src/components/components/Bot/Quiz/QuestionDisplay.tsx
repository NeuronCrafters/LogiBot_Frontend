import { useState } from "react";
import { motion } from "framer-motion";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { Question } from "../../../../@types/QuestionType";
import { ButtonBotAnswer } from "@/components/components/Button/ButtonBotAnswer";

interface QuestionsDisplayProps {
  questions: Question[];
  onSubmitAnswers: (answers: string[]) => void;
}

export function QuestionsDisplay({ questions, onSubmitAnswers }: QuestionsDisplayProps) {
  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(""));

  const handleSelect = (idx: number, opt: string) => {
    const next = [...answers];
    next[idx] = opt;
    setAnswers(next);
  };

  const allAnswered = answers.every((ans) => ans !== "");

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {questions.map((q, idx) => (
        <div
          key={idx}
          className="p-6 bg-[#1f2937] rounded-2xl shadow-md"
        >
          <Typograph
            text={`${idx + 1}. ${q.question}`}
            variant="text3"
            weight="semibold"
            fontFamily="poppins"
            colorText="text-white"
            className="mb-4"
          />

          <div className="flex flex-col items-center gap-3">
            {q.options.map((opt, i) => (
              <ButtonBotAnswer
                key={i}
                text={opt}
                selected={answers[idx] === opt}
                onClick={() => handleSelect(idx, opt)}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-end mt-6">
        <ButtonBotAnswer
          text="Enviar respostas"
          isSubmit
          onClick={() => onSubmitAnswers(answers)}
          disabled={!allAnswered}
        />
      </div>
    </motion.div>
  );
}
