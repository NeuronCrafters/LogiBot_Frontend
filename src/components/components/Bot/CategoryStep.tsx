import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { rasaService } from "@/services/api/api_rasa";

/**
 * Dados de cada botão:
 * - title: texto exibido
 * - payload: string bruta do Rasa
 */
export interface ButtonData {
  title: string;
  payload: string;
}

interface CategoryStepProps {
  /**
   * Botões de assunto (ex.: Variáveis, Listas, Condicionais)
   */
  buttons: ButtonData[];
  /**
   * Callback quando o usuário escolhe um assunto:
   * @param subSubjects - botões de sub-assunto retornados pelo Rasa
   * @param botText - texto da resposta do bot (ex.: "Escolha um tópico dentro de ...")
   */
  onNext: (subSubjects: ButtonData[], botText: string) => void;
}

export function CategoryStep({ buttons, onNext }: CategoryStepProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async (btn: ButtonData) => {
    setLoading(true);
    try {
      // Extrai a categoria do payload: {"categoria":"valor"}
      const match = btn.payload.match(/\{"categoria":"(.+)"\}/);
      const categoria = match?.[1] ?? "";

      const res = await rasaService.listarSubopcoes(categoria);
      const subSubjects = res.responses?.[0]?.buttons || [];
      const botText = res.responses?.[0]?.text || "";

      onNext(subSubjects, botText);
    } catch (err) {
      console.error("Erro em CategoryStep:", err);
      onNext([], "Erro ao obter tópicos");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-center text-gray-400 p-4">Carregando tópicos...</p>;
  }

  return (
    <div className="flex flex-wrap justify-center gap-3 mt-4">
      {buttons.map((btn, idx) => (
        <Button
          key={idx}
          onClick={() => handleClick(btn)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2"
        >
          {btn.title}
        </Button>
      ))}
    </div>
  );
}
