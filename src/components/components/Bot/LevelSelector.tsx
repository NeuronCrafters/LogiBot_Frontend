import { useEffect, useState } from "react";
import { rasaService } from "@/services/api/api_rasa";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

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
          if (firstResponse.buttons && firstResponse.buttons.length > 0) {
            const validButtons = firstResponse.buttons.filter(
              (btn: LevelButton) => btn.title && btn.payload
            );
            setLevels(validButtons);
          }
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
      <div className="flex justify-center items-center w-full py-4">
        <div className="flex items-center gap-2 text-gray-600 bg-gray-100 px-4 py-2 rounded-2xl shadow animate-fade-in">
          <Loader2 className="animate-spin w-4 h-4" />
          <span>Carregando níveis...</span>
        </div>
      </div>
    );
  }

  if (levels.length === 0) {
    return (
      <div className="flex justify-center items-center w-full py-4">
        <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-2xl shadow animate-fade-in">
          Nenhum nível disponível
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-2">
      <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm max-w-2xl mx-auto animate-fade-in">
        <div className="flex flex-wrap justify-center gap-3">
          {levels.map((level, index) => (
            <Button
              key={index}
              onClick={() => onSelectLevel(level.title)}
              className="bg-blue-700 hover:bg-blue-800 focus:ring-2 focus:ring-blue-400 text-white rounded-2xl px-5 py-2.5 shadow transition-all min-w-[140px]"
            >
              {level.title}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

export { LevelSelector };
