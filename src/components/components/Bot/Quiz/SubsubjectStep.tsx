import { useState } from "react";
import { rasaService } from "@/services/api/api_rasa";
import { ButtonChoiceBot } from "@/components/components/Button/ButtonChoiceBot";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { formatTitle } from "@/utils/formatText";
import { ButtonData } from "./CategoryStep";
import { Question } from "../../../../@types/QuestionType";

interface SubsubjectStepProps {
  buttons: ButtonData[];
  onNext: (questions: Question[], subtopico: string) => void;
}

export function SubsubjectStep({ buttons, onNext }: SubsubjectStepProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async (payload: string) => {
    setLoading(true);
    try {
      const idx = payload.indexOf("{");
      const json = idx >= 0 ? payload.slice(idx) : "";
      const obj = json ? JSON.parse(json) : {};
      const subtopico = obj.subtopico as string || "";

      const res = await rasaService.gerarPerguntas(subtopico);
      const qs: Question[] = Array.isArray(res.questions) ? res.questions : [];

      onNext(qs, subtopico); // Subtópico puro enviado
    } catch (error: any) {
      console.error("SubsubjectStep erro ao gerar perguntas:", error);
      const msg = error.response?.data?.message || "Erro ao gerar perguntas";
      onNext([], msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="w-full px-2"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center w-full py-6">
            <Loader2 className="animate-spin text-gray-400 w-5 h-5" />
          </div>
        ) : (
          <ButtonChoiceBot
            options={buttons.map((btn) => ({
              label: formatTitle(btn.title),
              value: btn.payload
            }))}
            onSelect={handleClick}
          />
        )}
      </div>
    </motion.div>
  );
}
