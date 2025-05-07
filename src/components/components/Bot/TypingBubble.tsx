import { useState, useEffect } from "react";

export function TypingBubble({ onDone, text }: { onDone: () => void; text: string }) {
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
    <div className="flex items-end w-full mb-3 justify-start animate-fade-in">
      <div className="bg-gray-800 text-gray-200 px-4 py-2 rounded-lg rounded-bl-none shadow max-w-[75%]">
        <p className="text-left whitespace-pre-wrap">
          {showText ? text : `Só um momento${".".repeat(dotCount)}`}
        </p>
      </div>
    </div>
  );
}
