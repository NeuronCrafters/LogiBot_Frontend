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
      onFinish("Olá! Escolha seu nível abaixo 👇");
    }, 2000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return showIcon ? (
    <div className="flex items-center justify-start w-full px-4 py-2 animate-fade-in">
      <div className="flex items-center gap-2 bg-blue-100 text-blue-800 rounded-2xl px-4 py-2 shadow-md">
        <Bot className="animate-bounce w-5 h-5" />
        <span>O SAEL está entrando...</span>
      </div>
    </div>
  ) : null;
}
