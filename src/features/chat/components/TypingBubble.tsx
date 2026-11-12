import { t, useLocale } from "@/i18n";
﻿import { useState, useEffect } from "react";
import { Typograph } from "@/shared/components/Typography";

interface TypingBubbleProps {
  onDone: () => void;
  text: string;
}

export function TypingBubble({ onDone, text }: TypingBubbleProps) {
  useLocale();

  const [dotCount, setDotCount] = useState(1);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    const typingInterval = setInterval(() => {
      setDotCount((prev) => (prev < 3 ? prev + 1 : 1));
    }, 400);

    const revealTimeout = setTimeout(() => {
      setShowText(true);
      clearInterval(typingInterval);
      onDone();
    }, 1800);

    return () => {
      clearInterval(typingInterval);
      clearTimeout(revealTimeout);
    };
  }, [onDone]);

  return (
    <div className="flex items-end w-full mb-3 justify-start animate-fade-in">
      <div className="bg-surface-raised text-gray-200 px-4 py-2 rounded-xl rounded-bl-none shadow max-w-[75%]">
        <Typograph
          text={showText ? text : t("chat.soUmMomentovalue0", { value0: ".".repeat(dotCount) })}
          variant="text8"
          weight="regular"
          fontFamily="poppins"
          colorText="text-gray-200"
        />
      </div>
    </div>
  );
}
