import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { ButtonChoiceBot } from "@/components/components/Button/ButtonChoiceBot";
import { formatTitle } from "@/utils/formatText";
import { quizService } from "@/services/api/api_quiz"; // MUDANÇA: Novo import
import { Question } from "@/@types/QuestionType";

type ButtonData = { title: string; payload: string };

interface SubsubjectStepProps {
  buttons: ButtonData[];
  onNext: (questions: Question[], subtopico: string) => void;
}

export function SubsubjectStep({ buttons, onNext }: SubsubjectStepProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async (subtopicoPayload: string) => {
    setLoading(true);
    try {
      const res = await quizService.generateQuiz(subtopicoPayload);
      const qs: Question[] = Array.isArray(res.questions) ? res.questions : [];
      onNext(qs, subtopicoPayload);
    } catch (error: any) {
      console.error("SubsubjectStep erro ao gerar perguntas:", error);
      const msg = error.response?.data?.message || "Erro ao gerar perguntas";
      onNext([], msg);
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
              value: btn.payload,
            }))}
            onSelect={handleClick}
          />
        )}
      </div>
    </motion.div>
  );
}