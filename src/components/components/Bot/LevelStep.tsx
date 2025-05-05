import { useEffect, useState } from "react";
import { rasaService } from "@/services/api/api_rasa";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type ButtonData = { title: string; payload: string };

interface LevelStepProps {
  onNext: (buttons: ButtonData[], botText: string) => void;
}

export function LevelStep({ onNext }: LevelStepProps) {
  const [levels, setLevels] = useState<ButtonData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    rasaService
      .listarNiveis()
      .then((data) => {
        const buttons = data.responses?.[0]?.buttons || [];
        setLevels(buttons);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleClick = async (lvl: ButtonData) => {
    onNext([], lvl.title);
    try {
      const res = await rasaService.definirNivel(lvl.title);
      const nextButtons = res.responses?.[1]?.buttons || [];
      const botText = res.responses?.[1]?.text || "";
      onNext(nextButtons, botText);
    } catch {
      onNext([], "Erro ao definir nível.");
    }
  };

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
        <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-2xl shadow-md animate-fade-in">
          Nenhum nível disponível, use a caixa de texto abaixo para conversar.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-2">
      <div className="borde rounded-xl p-6 shadow-sm max-w-2xl mx-auto animate-fade-in">
        <div className="flex flex-wrap justify-center gap-3">
          {levels.map((lvl, i) => (
            <Button
              key={i}
              onClick={() => handleClick(lvl)}
              className="bg-blue-700 hover:bg-blue-800 focus:ring-2 focus:ring-blue-400 text-white rounded-2xl px-5 py-2.5 shadow transition-all min-w-[140px]"
            >
              {lvl.title}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
