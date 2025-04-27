// src/components/components/Bot/QuestionsDisplay.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Question } from "./Question";

interface QuestionsDisplayProps {
  /** Array de perguntas com suas opções */
  questions: Question[];
  /** Callback quando usuário submete todas as respostas */
  onSubmitAnswers: (answers: string[]) => void;
}

export function QuestionsDisplay({ questions, onSubmitAnswers }: QuestionsDisplayProps) {
  // Estado local para armazenar a resposta de cada pergunta
  const [answers, setAnswers] = useState<string[]>(
    Array(questions.length).fill("")
  );

  // Marca a opção selecionada para a pergunta idx
  const handleSelect = (idx: number, opt: string) => {
    const next = [...answers];
    next[idx] = opt;
    setAnswers(next);
  };

  // Verifica se todas as perguntas foram respondidas
  const allAnswered = answers.every((ans) => ans !== "");

  return (
    <div className="space-y-6">
      {questions.map((q, idx) => (
        <div key={idx} className="p-4 bg-gray-800 rounded-lg">
          <p className="text-white text-lg font-medium mb-3">
            {idx + 1}. {q.question}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {q.options.map((opt, i) => (
              <Button
                key={i}
                variant={answers[idx] === opt ? "default" : "outline"}
                onClick={() => handleSelect(idx, opt)}
                className="text-left"
              >
                {opt}
              </Button>
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <Button
          onClick={() => onSubmitAnswers(answers)}
          disabled={!allAnswered}
        >
          Enviar respostas
        </Button>
      </div>
    </div>
  );
}
