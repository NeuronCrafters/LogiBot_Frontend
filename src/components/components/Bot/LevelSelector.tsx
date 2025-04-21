import { useEffect, useState } from "react";
import { rasaService } from "@/services/api/api_rasa";
import { Button } from "@/components/ui/button";

interface LevelSelectorProps {
  onSelectLevel: (level: string) => void;
}

interface LevelButton {
  title: string;
  payload: string;
}

function LevelSelector({ onSelectLevel }: LevelSelectorProps) {
  const [levels, setLevels] = useState<LevelButton[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLevels() {
      try {
        const data = await rasaService.listarNiveis();
        console.log("Dados recebidos da API:", data);

        if (data && data.responses && data.responses.length > 0) {
          const firstResponse = data.responses[0];
          console.log("Primeira resposta:", firstResponse);

          if (firstResponse.buttons && firstResponse.buttons.length > 0) {
            console.log("Botões encontrados:", firstResponse.buttons);
            // Garante que cada botão tem title e payload
            const validButtons = firstResponse.buttons.filter(
              (btn: LevelButton) => btn.title && btn.payload
            );
            setLevels(validButtons);
          } else {
            console.log("Nenhum botão encontrado na resposta");
          }
        } else {
          console.log("Resposta da API não tem a estrutura esperada");
        }
      } catch (error) {
        console.error("Erro ao buscar níveis:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLevels();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <p className="text-gray-400">Carregando níveis...</p>
      </div>
    );
  }

  if (levels.length === 0) {
    return (
      <div className="flex justify-center items-center p-4">
        <p className="text-gray-400">Nenhum nível disponível</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-3 mt-4 max-w-2xl mx-auto">
      {levels.map((level, index) => (
        <Button
          key={index}
          onClick={() => onSelectLevel(level.title)}
          className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2 min-w-[120px]"
        >
          {level.title}
        </Button>
      ))}
    </div>
  );
}

export { LevelSelector }; 