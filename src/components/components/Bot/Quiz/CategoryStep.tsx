import { useEffect, useState } from "react";
import { rasaService } from "@/services/api/api_rasa";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { ButtonChoiceBot } from "@/components/components/Button/ButtonChoiceBot";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { formatTitle } from "@/utils/formatText";

export interface ButtonData {
  title: string;
  payload: string;
}

interface CategoryStepProps {
  buttons: ButtonData[];
  onNext: (subSubjects: ButtonData[], botText: string) => void;
}

export function CategoryStep({ buttons, onNext }: CategoryStepProps) {
  const [loading, setLoading] = useState(false);
  const [categoriaAtual, setCategoriaAtual] = useState("");
  const [showButtons, setShowButtons] = useState(false);

  const handleClick = async (value: string) => {
    setLoading(true);
    setShowButtons(false);
    try {
      const match = value.match(/\{"categoria":"(.+?)"\}/);
      const categoria = match?.[1] ?? "";
      setCategoriaAtual(categoria);

      const res = await rasaService.listarSubopcoes(categoria);
      const subSubjects = res.responses?.[0]?.buttons || [];
      const botText = res.responses?.[0]?.text || "";

      setTimeout(() => {
        onNext(subSubjects, botText);
      }, 500);
    } catch (err) {
      console.error("Erro em CategoryStep:", err);
      onNext([], "Erro ao obter tópicos");
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  useEffect(() => {
    if (buttons.length > 0) {
      const timer = setTimeout(() => {
        setShowButtons(true);
      }, 600);
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
        {categoriaAtual && (
          <Typograph
            text={`Escolha um tópico dentro de ${formatTitle(categoriaAtual)}:`}
            variant="text4"
            weight="medium"
            fontFamily="poppins"
            colorText="text-white"
            className="bg-gray-800 text-white px-4 py-2 rounded-2xl shadow-md max-w-fit mb-4"
          />
        )}
        {loading && (
          <div className="flex justify-center items-center w-full py-6">
            <Loader2 className="animate-spin text-gray-400 w-5 h-5" />
          </div>
        )}

        {!loading && showButtons && (
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
