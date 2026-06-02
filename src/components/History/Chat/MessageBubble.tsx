import { Typograph } from "@/components/Typograph/Typograph";
import { Bot, User } from "lucide-react";

interface MessageBubbleProps {
  text: string;
  sender: "user" | "bot";
}

export function MessageBubble({ text, sender }: MessageBubbleProps) {
  const isUser = sender === "user";

  return (
    <div className={`flex w-full mb-4 ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? "bg-blue-600" : "bg-purple-600"}`}>
          {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
        </div>

        <div
          className={`px-4 py-3 rounded-2xl shadow-md text-sm md:text-base ${isUser
              ? "bg-blue-600 text-white rounded-tr-none"
              : "bg-[#2c2c2c] text-gray-200 rounded-tl-none"
            }`}
        >
          <Typograph
            text={text}
            variant="text6"
            weight="regular"
            fontFamily="poppins"
            colorText={isUser ? "text-white" : "text-gray-200"}
          />
        </div>
      </div>
    </div>
  );
}