import { useEffect, useState } from "react";
import { rasaService } from "@/services/api/api_rasa";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { ButtonChoiceBot } from "@/components/components/Button/ButtonChoiceBot";
import { formatTitle } from "@/utils/formatText";
import { useAuth } from "@/hooks/use-Auth";
import { useCategoryClickTracker } from "@/hooks/use-CategoryClickTracker";

export interface ButtonData {
  title: string;
  payload: string;
}

interface CategoryStepProps {
  buttons: ButtonData[];
  onNext: (subSubjects: ButtonData[], payload: string) => void;
}

export function CategoryStep({ buttons, onNext }: CategoryStepProps) {
  const { user } = useAuth();
  const { recordClick } = useCategoryClickTracker(user?._id || null);

  const [loading, setLoading] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  const handleClick = async (value: string) => {
    setLoading(true);
    setShowButtons(false);

    const match = value.match(/\{"categoria":"(.+?)"\}/);
    const categoria = match?.[1] ?? "";
    recordClick(categoria);

    try {
      const res = await rasaService.listarSubopcoes(categoria);
      const subSubjects = res.responses?.[0]?.buttons || [];
      onNext(subSubjects, value);
    } catch (err) {
      console.error("Erro em CategoryStep:", err);
      onNext([], value);
    } finally {
      // delay para smooth
      setTimeout(() => setLoading(false), 500);
    }
  };

  useEffect(() => {
    if (buttons.length > 0) {
      const timer = setTimeout(() => setShowButtons(true), 600);
      return () => clearTimeout(timer);
    }
  }, [buttons]);

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
          {!loading && showButtons && (
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
