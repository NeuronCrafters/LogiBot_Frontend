// src/components/components/Bot/SubsubjectStep.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { rasaService } from "@/services/api/api_rasa";
import { ButtonData } from "./CategoryStep";
import { Question } from "./Question";

interface SubsubjectStepProps {
  /** Botões de sub-assunto (e.g., "divisao_inteira_o_que_e") */
  buttons: ButtonData[];
  /** Callback após gerar perguntas do sub-assunto */
  onNext: (questions: Question[], botText: string) => void;
}

export function SubsubjectStep({ buttons, onNext }: SubsubjectStepProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async (btn: ButtonData) => {
    setLoading(true);
    try {
      // Extrai JSON do payload (posição do primeiro '{')
      const idx = btn.payload.indexOf("{");
      const json = idx >= 0 ? btn.payload.slice(idx) : "";
      const obj = json ? JSON.parse(json) : {};
      const subtopico = obj.subtopico as string || "";

      // Chama o backend para gerar perguntas
      const res = await rasaService.gerarPerguntas(subtopico);
      const qs: Question[] = Array.isArray(res.questions) ? res.questions : [];

      onNext(qs, "Aqui estão suas perguntas:");
    } catch (error: any) {
      console.error("SubsubjectStep erro ao gerar perguntas:", error);
      const msg = error.response?.data?.message || "Erro ao gerar perguntas";
      onNext([], msg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-center text-gray-400 p-4">Gerando perguntas...</p>;
  }

  return (
    <div className="flex flex-wrap justify-center gap-3 mt-4">
      {buttons.map((btn, i) => (
        <Button
          key={i}
          onClick={() => handleClick(btn)}
          className="bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2"
        >
          {btn.title}
        </Button>
      ))}
    </div>
  );
}
