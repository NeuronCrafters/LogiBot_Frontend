import { useEffect, useState } from "react";
import { TypingBubble } from "@/components/components/Bot/Chat/TypingBubble";
import { motion } from "framer-motion";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { ButtonChoiceBot } from "../Button/ButtonChoiceBot";

interface InitialChoiceStepProps {
  onChoose: (choice: "quiz" | "chat") => void;
}

export function InitialChoiceStep({ onChoose }: InitialChoiceStepProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showTyping, setShowTyping] = useState(false);

  useEffect(() => {
    setShowTyping(true);
  }, []);

  return (
    <motion.div
      className="w-full px-2"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="rounded-xl p-6 max-w-2xl mx-auto bg-transparent">
        {showTyping && !showPrompt && (
          <TypingBubble
            text="Vamos conversar, sobre o que quer falar?"
            onDone={() => setShowPrompt(true)}
          />
        )}

        {showPrompt && (
          <>
            <Typograph
              text="O que deseja hoje?"
              variant="text2"
              weight="semibold"
              fontFamily="poppins"
              colorText="text-white"
              className="text-center mb-6"
            />

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <ButtonChoiceBot
                options={[
                  { label: "Fazer quiz (5 perguntas)", value: "quiz" },
                  { label: "Conversar sobre lógica de programação", value: "chat", variant: "green" },
                ]}
                onSelect={(value) => onChoose(value as "quiz" | "chat")}
              />

            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
