import { useEffect, useState } from "react";
import { Bot } from "lucide-react";

interface Props {
  onFinish: (msg: string) => void;
}

export function BotGreetingMessage({ onFinish }: Props) {
  const [showIcon, setShowIcon] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIcon(false);
      onFinish("Hi! Choose your level below 👇");
    }, 2000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return showIcon ? (
    <div className="flex items-center justify-start w-full px-4 py-2 animate-fade-in">
      <div className="flex items-center gap-2 px-4 py-2 text-blue-800 bg-blue-100 shadow-md rounded-2xl">
        <Bot className="w-5 h-5 animate-bounce" />
        <span>LogiBot is joining...</span>
      </div>
    </div>
  ) : null;
}
