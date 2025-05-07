import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TypingBubble } from "@/components/components/Bot/TypingBubble";

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
    <div className="w-full px-2">
      <div className="rounded-xl p-6 max-w-2xl mx-auto animate-fade-in">
        {showTyping && !showPrompt && (
          <TypingBubble
            text="Vamos conversar, sobre o que quer falar?"
            onDone={() => setShowPrompt(true)}
          />
        )}

        {showPrompt && (
          <>
            <p className="text-white text-lg font-semibold text-center mb-6">
              O que deseja hoje?
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                onClick={() => onChoose("quiz")}
                className="bg-blue-700 hover:bg-blue-800 text-white rounded-2xl px-5 py-2.5 shadow transition-all"
              >
                Fazer quiz (5 perguntas)
              </Button>
              <Button
                onClick={() => onChoose("chat")}
                className="bg-green-600 hover:bg-green-700 text-white rounded-2xl px-5 py-2.5 shadow transition-all"
              >
                Conversar sobre lógica de programação
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}