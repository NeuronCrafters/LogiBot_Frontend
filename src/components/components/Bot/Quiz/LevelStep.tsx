import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { rasaService } from "@/services/api/api_rasa";
import { motion } from "framer-motion";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { ButtonChoiceBot } from "@/components/components/Button/ButtonChoiceBot";
import { formatTitle } from "@/utils/formatText";

type ButtonData = { title: string; payload: string };

interface LevelStepProps {
  onNext: (buttons: ButtonData[], nivel: string) => void;
}

export function LevelStep({ onNext }: LevelStepProps) {
  const [levels, setLevels] = useState<ButtonData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    rasaService
      .listarNiveis()
      .then((data) => {
        const buttons = data.responses?.[0]?.buttons || [];
        setLevels(buttons);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (nivelSelecionado: string) => {
    console.log("🟨 Nível clicado pelo usuário:", nivelSelecionado);
    try {
      const res = await rasaService.definirNivel(nivelSelecionado);
      const botoesAssuntos = res.responses?.[1]?.buttons || [];
      onNext(botoesAssuntos, nivelSelecionado); // 🔥 aqui usamos onNext corretamente
    } catch (err) {
      console.error("Erro ao definir nível:", err);
      onNext([], nivelSelecionado);
    }
  };

  if (loading) {
    return (
      <motion.div className="flex justify-center items-center w-full py-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-2 text-gray-600 bg-gray-100 px-4 py-2 rounded-2xl shadow">
          <Loader2 className="animate-spin w-4 h-4" />
          <span>Carregando níveis...</span>
        </div>
      </motion.div>
    );
  }

  if (levels.length === 0) {
    return (
      <motion.div className="flex justify-center items-center w-full py-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-2xl shadow-md">
          Nenhum nível disponível, use a caixa de texto abaixo para conversar.
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="w-full px-2"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="rounded-xl p-6 max-w-2xl mx-auto">
        <Typograph
          text="Escolha seu nível de dificuldade"
          variant="text4"
          weight="medium"
          fontFamily="poppins"
          colorText="text-white"
          className="text-center mb-6"
        />
        <ButtonChoiceBot
          options={levels.map((l) => ({
            label: formatTitle(l.title),
            value: l.title
          }))}
          onSelect={handleSelect}
        />
      </div>
    </motion.div>
  );
}
