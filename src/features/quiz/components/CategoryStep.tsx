import { useState } from "react";
import { logger } from "@/shared/lib/logger";
import { Loader2 } from "lucide-react";
import { ChoiceButtonGroup } from "@/shared/components/forms/ChoiceButtonGroup";
import { formatTitle } from "@/shared/lib/formatText";
import { quizService } from "@/features/quiz/api/quizApi";

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
      logger.error("Quiz", "Erro ao listar subcategorias.", err);
      onNext([], categoriaPayload);
    }
  };

  return (
    <div className="w-full">
      {loading && (
        <div className="flex justify-center items-center w-full py-6">
          <Loader2 className="animate-spin text-indigo-400 w-5 h-5" />
        </div>
      )}
      {!loading && (
        <ChoiceButtonGroup
          colorScheme="indigo"
          options={buttons.map((btn) => ({ label: formatTitle(btn.title), value: btn.payload }))}
          onSelect={handleClick}
        />
      )}
    </div>
  );
}
