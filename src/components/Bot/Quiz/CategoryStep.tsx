import { useState } from "react";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { ChoiceButtonGroup } from "@/components/Buttons/ChoiceButtonGroup";
import { formatTitle } from "@/utils/formatText";
import { quizService } from "@/services/api/api_quiz";

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
      className="w-full"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {loading && (
        <div className="flex justify-center items-center w-full py-6">
          <Loader2 className="animate-spin text-indigo-400 w-5 h-5" />
        </div>
      )}
      {!loading && (
        <ChoiceButtonGroup
          colorScheme="indigo"
          options={buttons.map((btn) => ({
            label: formatTitle(btn.title),
            value: btn.payload,
          }))}
          onSelect={handleClick}
        />
      )}
    </motion.div>
  );
}