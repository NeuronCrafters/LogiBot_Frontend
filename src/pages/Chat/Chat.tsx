import { useState, useEffect } from "react";
import { ChevronLeft, PanelRightOpen } from "lucide-react";
import { Header } from "@/components/components/Header/Header";
import { useAuth } from "@/hooks/use-Auth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ChatMessages } from "../../components/components/Bot/ChatMessages";
import { LevelSelector } from "../../components/components/Bot/LevelSelector";
import { ChatInput } from "@/components/components/Input/ChatInput.tsx";

function Chat() {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const userName = user?.name || "User";

  useEffect(() => {
    setMessages([{ role: "assistant", content: "Olá! Escolha seu nível abaixo 👇" }]);
  }, []);

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInputText("");
  };

  const handleLevelSelect = (level: string) => {
    sendMessage(level);
  };

  return (
    <div className="flex min-h-screen bg-[#141414] flex-col items-center w-full max-w-full px-0 sm:px-8 md:px-16 mx-auto">
      {/* header */}
      <div className="absolute bg-[#141414] w-full flex justify-between border-b-[0.5px] border-neutral-800 px-24 py-6">
        <Button
          variant="outline"
          size="icon"
          className="border-neutral-400 border rounded-md text-slate-100"
          onClick={() => navigate("/")}
        >
          <ChevronLeft />
        </Button>

        <p className="font-Montserrat text-neutral-200 font-semibold text-2xl">CHAT SAEL</p>

        {user && (
          <button onClick={() => setMenuOpen(true)} className="text-white">
            <PanelRightOpen size={28} strokeWidth={0.75} />
          </button>
        )}
      </div>

      <div className="flex flex-col items-center w-full h-full pt-32 pb-24">
        <div className="w-full max-w-2xl mx-auto">
          <ChatMessages
            messages={messages}
            userName={userName}
          />

          <LevelSelector
            onSelectLevel={handleLevelSelect}
          />
        </div>

        <div className="fixed bottom-0 left-0 right-0 mb-8">
          <ChatInput
            inputText={inputText}
            setInputText={setInputText}
            sendMessage={sendMessage}
          />
        </div>
      </div>

      <Header
        isOpen={menuOpen}
        closeMenu={() => setMenuOpen(false)}
      />
    </div>
  );
}

export { Chat };
