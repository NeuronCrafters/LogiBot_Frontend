import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Question } from "./Question";

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
    <div className="space-y-6">
      {questions.map((q, idx) => (
        <div key={idx} className="p-6 bg-[#1e1e2f] rounded-2xl shadow-md animate-fade-in">
          <p className="text-white text-lg font-semibold mb-4">
            {idx + 1}. {q.question}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {q.options.map((opt, i) => (
              <Button
                key={i}
                variant={answers[idx] === opt ? "default" : "outline"}
                onClick={() => handleSelect(idx, opt)}
                className={`text-left transition-all ${answers[idx] === opt
                  ? "bg-blue-700 hover:bg-blue-800 text-white"
                  : "bg-transparent text-white border border-white/20 hover:bg-white/10"
                  }`}
              >
                {opt}
              </Button>
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-end mt-4">
        <Button
          onClick={() => onSubmitAnswers(answers)}
          disabled={!allAnswered}
          className="bg-blue-700 hover:bg-blue-800 focus:ring-2 focus:ring-blue-400 text-white font-semibold rounded-2xl px-6 py-2.5 shadow transition-all disabled:opacity-50"
        >
          Enviar respostas
        </Button>
      </div>
    </div>
  );
}
