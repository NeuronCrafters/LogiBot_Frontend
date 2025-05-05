import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
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
  buttons: ButtonData[];
  onNext: (subSubjects: ButtonData[], botText: string) => void;
}

export function CategoryStep({ buttons, onNext }: CategoryStepProps) {
  const [loading, setLoading] = useState(false);
  const [categoriaAtual, setCategoriaAtual] = useState("");
  const [showButtons, setShowButtons] = useState(false);

  const handleClick = async (btn: ButtonData) => {
    setLoading(true);
    setShowButtons(false);
    try {
      const match = btn.payload.match(/\{"categoria":"(.+?)"\}/);
      const categoria = match?.[1] ?? "";
      setCategoriaAtual(categoria);

      const res = await rasaService.listarSubopcoes(categoria);
      const subSubjects = res.responses?.[0]?.buttons || [];
      const botText = res.responses?.[0]?.text || "";

      // Delay controlado para exibir botões com leve suspense visual
      setTimeout(() => {
        onNext(subSubjects, botText);
      }, 500);
    } catch (err) {
      console.error("Erro em CategoryStep:", err);
      onNext([], "Erro ao obter tópicos");
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  useEffect(() => {
    if (buttons.length > 0) {
      const timer = setTimeout(() => {
        setShowButtons(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [buttons]);

  const categoriaFormatada = categoriaAtual
    ? categoriaAtual.charAt(0).toUpperCase() + categoriaAtual.slice(1).toLowerCase()
    : "";

  return (
    <div className="w-full px-2">
      {/* Mensagem de instrução do bot */}
      {categoriaAtual && (
        <div className="w-full px-4 mt-4">
          <div className="bg-gray-800 text-white px-4 py-2 rounded-2xl shadow-md max-w-fit animate-fade-in">
            Escolha um tópico dentro de{" "}
            <span className="text-blue-400 font-semibold">{categoriaFormatada}</span>:
          </div>
        </div>
      )}

      {/* Loading de busca por subassuntos */}
      {loading && (
        <div className="flex justify-center items-center w-full py-6">
          <Loader2 className="animate-spin text-gray-400 w-5 h-5" />
        </div>
      )}

      {/* Lista de botões após carregamento */}
      {!loading && showButtons && (
        <div className="flex flex-col items-center gap-4 mt-6 animate-fade-in">
          {buttons.map((btn, idx) => (
            <Button
              key={idx}
              onClick={() => handleClick(btn)}
              className="bg-blue-700 hover:bg-blue-800 focus:ring-2 focus:ring-blue-400 text-white rounded-2xl px-5 py-2.5 shadow transition-all w-full max-w-sm"
            >
              {btn.title}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
