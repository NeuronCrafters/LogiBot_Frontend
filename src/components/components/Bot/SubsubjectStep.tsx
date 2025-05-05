import { useState } from "react";
import { Button } from "@/components/ui/button";
import { rasaService } from "@/services/api/api_rasa";
import { Loader2 } from "lucide-react";
import { ButtonData } from "./CategoryStep";
import { Question } from "./Question";

interface SubsubjectStepProps {
  buttons: ButtonData[];
  onNext: (questions: Question[], botText: string) => void;
}

export function SubsubjectStep({ buttons, onNext }: SubsubjectStepProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async (btn: ButtonData) => {
    setLoading(true);
    try {
      const idx = btn.payload.indexOf("{");
      const json = idx >= 0 ? btn.payload.slice(idx) : "";
      const obj = json ? JSON.parse(json) : {};
      const subtopico = obj.subtopico as string || "";

      const res = await rasaService.gerarPerguntas(subtopico);
      const questions: Question[] = Array.isArray(res.questions) ? res.questions : [];

      onNext(questions, "Aqui estão suas perguntas:");
    } catch (err: any) {
      console.error("SubsubjectStep: erro ao gerar perguntas:", err.response ?? err);
      const msg = err.response?.data?.message || "Erro ao gerar perguntas";
      onNext([], msg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center w-full py-4">
        <div className="flex items-center gap-2 text-gray-600 bg-gray-100 px-4 py-2 rounded-2xl shadow animate-fade-in">
          <Loader2 className="animate-spin w-4 h-4" />
          <span>Gerando perguntas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-2">
      <div className="animate-fade-in max-w-2xl mx-auto flex flex-col items-center gap-4">
        {buttons.map((btn, i) => (
          <Button
            key={i}
            onClick={() => handleClick(btn)}
            className="bg-blue-700 hover:bg-blue-800 focus:ring-2 focus:ring-blue-400 text-white rounded-2xl px-5 py-2.5 shadow transition-all w-full max-w-sm min-w-[140px]"
          >
            {btn.title}
          </Button>
        ))}
      </div>
    </div>
  );
}
