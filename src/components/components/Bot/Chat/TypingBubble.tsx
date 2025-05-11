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
    }, 500);

    const revealTimeout = setTimeout(() => {
      setShowText(true);
      clearInterval(typingInterval);
      onDone();
    }, 2000);

    return () => {
      clearInterval(typingInterval);
      clearTimeout(revealTimeout);
    };
  }, [onDone]);

  return (
    <motion.div
      className="flex items-end w-full mb-3 justify-start"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-gray-800 text-gray-200 px-4 py-2 rounded-lg rounded-bl-none shadow max-w-[75%]">
        <Typograph
          text={showText ? text : `Só um momento${".".repeat(dotCount)}`}
          variant="text4"
          weight="regular"
          fontFamily="poppins"
          colorText="text-gray-200"
        />
      </div>
    </motion.div>
  );
}
