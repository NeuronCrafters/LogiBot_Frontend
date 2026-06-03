import { useEffect, useState } from "react";
import { logger } from "@/shared/lib/logger";
import { Loader2 } from "lucide-react";
import { Typograph } from "@/shared/components/Typography";
import { ChoiceButtonGroup } from "@/shared/components/forms/ChoiceButtonGroup";
import { formatTitle } from "@/shared/lib/formatText";
import { quizService } from "@/features/quiz/api/quizApi";

type ButtonData = { title: string; payload: string };

interface LevelStepProps {
  onNext: (buttons: ButtonData[], nivel: string) => void;
}

export function LevelStep({ onNext }: LevelStepProps) {
  const [levels, setLevels] = useState<ButtonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    quizService
      .listLevels()
      .then((data) => {
        setLevels(data.buttons || []);
      })
      .catch((err: unknown) =>
        logger.error("Quiz", "Erro ao listar níveis.", err),
      )
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (nivelPayload: string) => {
    setIsSubmitting(true);
    try {
      const res = await quizService.setLevel(nivelPayload);
      const botoesAssuntos = res.categories || [];
      onNext(botoesAssuntos, nivelPayload);
    } catch (err) {
      logger.error("Quiz", "Erro ao definir nível.", err);
      onNext([], nivelPayload);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center w-full py-4">
        <div className="flex items-center gap-2 text-gray-400 bg-[#1f1f1f] border border-white/10 px-4 py-2 rounded-2xl shadow">
          <Loader2 className="animate-spin w-4 h-4" />
          <span className="font-[Poppins] text-sm">Carregando níveis...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div>
        <Typograph
          text="Escolha seu nível de dificuldade"
          variant="text4"
          weight="medium"
          fontFamily="poppins"
          colorText="text-white"
          className="mb-5 text-center"
        />
        <ChoiceButtonGroup
          colorScheme="indigo"
          options={levels.map((l) => ({
            label: formatTitle(l.title),
            value: l.payload,
          }))}
          onSelect={handleSelect}
        />
        {isSubmitting && (
          <Loader2 className="animate-spin text-indigo-400 mx-auto mt-4" />
        )}
      </div>
    </div>
  );
}
