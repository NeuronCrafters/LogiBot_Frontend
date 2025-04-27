import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { rasaService } from "@/services/api/api_rasa";
import { ButtonData } from "./CategoryStep";

/**
 * Estrutura de uma pergunta com opções
 */
export interface Question {
  question: string;
  options: string[];
}

interface SubsubjectStepProps {
  /**
   * Botões de sub-assunto (ex.: 'Divisao inteira o que e', 'exemplo codigo')
   */
  buttons: ButtonData[];
  /**
   * Callback ao gerar perguntas:
   * @param questions - array de perguntas com opções
   * @param botText - texto da resposta do bot (ex.: "Aqui estão suas perguntas:")
   */
  onNext: (questions: Question[], botText: string) => void;
}

export function SubsubjectStep({ buttons, onNext }: SubsubjectStepProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async (btn: ButtonData) => {
    setLoading(true);
    try {
      // Extrai o JSON a partir do primeiro '{'
      const jsonStart = btn.payload.indexOf("{");
      const jsonStr = jsonStart >= 0 ? btn.payload.slice(jsonStart) : "";
      const payloadObj = jsonStr ? JSON.parse(jsonStr) : {};
      const subtopico = payloadObj.subtopico as string || "";

      // Chama o endpoint que espera { pergunta }
      const res = await rasaService.gerarPerguntas(subtopico);
      const questions = Array.isArray(res.questions) ? res.questions : [];
      const botText = "Aqui estão suas perguntas:";

      onNext(questions, botText);
    } catch (err: any) {
      console.error("SubsubjectStep: erro ao gerar perguntas:", err.response ?? err);
      const msg = err.response?.data?.message || "Erro ao gerar perguntas";
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
      {buttons.map((btn, idx) => (
        <Button
          key={idx}
          onClick={() => handleClick(btn)}
          className="bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2"
        >
          {btn.title}
        </Button>
      ))}
    </div>
  );
}
