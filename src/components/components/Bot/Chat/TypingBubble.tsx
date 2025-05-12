import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Typograph } from "@/components/components/Typograph/Typograph";

interface TypingBubbleProps {
  onDone: () => void;
  text: string;
}

export function TypingBubble({ onDone, text }: TypingBubbleProps) {
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
    <motion.div
      className="flex items-end w-full mb-3 justify-start animate-fade-in"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-[#2c2c2c] text-gray-200 px-4 py-2 rounded-xl rounded-bl-none shadow max-w-[75%]">
        <Typograph
          text={showText ? text : `Só um momento${".".repeat(dotCount)}`}
          variant="text8"
          weight="regular"
          fontFamily="poppins"
          colorText="text-gray-200"
        />
      </div>
    </motion.div>
  );
}
