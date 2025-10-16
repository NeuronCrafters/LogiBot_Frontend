import { useState } from "react";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { ButtonChoiceBot } from "@/components/components/Button/ButtonChoiceBot";
import { formatTitle } from "@/utils/formatText";
import { quizService } from "@/services/api/api_quiz"; // MUDANÇA: Novo import

export interface ButtonData {
  title: string;
  payload: string;
}

interface CategoryStepProps {
  buttons: ButtonData[];
  onNext: (subSubjects: ButtonData[], payload: string) => void;
}

export function CategoryStep({ buttons, onNext }: CategoryStepProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async (categoriaPayload: string) => {
    setLoading(true);
    try {
      const res = await quizService.listSubcategories(categoriaPayload);
      const subSubjects = res.buttons || [];
      onNext(subSubjects, categoriaPayload);
    } catch (err) {
      console.error("Erro em CategoryStep:", err);
      onNext([], categoriaPayload);
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
        {loading && (
          <div className="flex justify-center items-center w-full py-6">
            <Loader2 className="animate-spin text-gray-400 w-5 h-5" />
          </div>
        )}
        {!loading && (
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