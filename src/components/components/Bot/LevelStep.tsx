// src/components/components/Bot/LevelStep.tsx
import { useEffect, useState } from "react";
import { rasaService } from "@/services/api/api_rasa";
import { Button } from "@/components/ui/button";

type ButtonData = { title: string; payload: string };

interface LevelStepProps {
  /** 
   * Recebe os botões de categoria que vêm do Rasa,
   * e o texto que o bot retornou (ex: "Agora escolha um assunto")
   */
  onNext: (buttons: ButtonData[], botText: string) => void;
}

export function LevelStep({ onNext }: LevelStepProps) {
  const [levels, setLevels] = useState<ButtonData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    rasaService.listarNiveis()
      .then(data => {
        const buttons = data.responses?.[0]?.buttons || [];
        setLevels(buttons);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Carregando níveis…</p>;
  if (levels.length === 0) return <p>Nenhum nível disponível</p>;

  const handleClick = async (lvl: ButtonData) => {
    // mostra o payload ao chat
    onNext([], lvl.title); // opcional: mostre a mensagem do usuário
    try {
      const res = await rasaService.definirNivel(lvl.title);
      const nextButtons = res.responses?.[1]?.buttons || [];
      const botText = res.responses?.[1]?.text || "";
      onNext(nextButtons, botText);
    } catch {
      onNext([], "Erro ao definir nível.");
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      {levels.map((lvl, i) => (
        <Button key={i} onClick={() => handleClick(lvl)}>
          {lvl.title}
        </Button>
      ))}
    </div>
  );
}
