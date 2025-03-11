import { useState, useEffect } from "react";
import { Send, Menu as MenuIcon } from "lucide-react";
import { Header } from "@/components/components/Header/Header";
import { useAuthStore } from "@/stores/authStore";
import { StartConversation } from "@/components/components/Chat/StartConversation";
import { LevelUser } from "@/components/components/Chat/LevelUser";
import { ListOptions } from "@/components/components/Chat/ListOptions";
import { ListSubOptions } from "@/components/components/Chat/ListSubOptions";
import { GenerateQuestions } from "@/components/components/Chat/GenerateQuestions";
import { ChatButtons } from "@/components/components/Chat/ChatButtons";
import { sendMessageToRasa, sendToActionServer } from "@/services/rasaService";

function Chat() {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [userLevel, setUserLevel] = useState<string | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [subOptions, setSubOptions] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const { token } = useAuthStore();

  useEffect(() => {
    console.log("Iniciando a conversa...");
    startConversation();
    fetchLevels();
  }, []);

  const sendMessage = async (message: string, role: "user" | "assistant" = "user") => {
    console.log("Enviando mensagem:", message);
    setMessages((prev) => [...prev, { role, content: message }]);
    try {
      const response = await sendMessageToRasa(message);
      console.log("Resposta do Rasa:", response);
      if (response && response.length > 0) {
        setMessages((prev) => [...prev, { role: "assistant", content: response[0].text }]);
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }
  };

  const startConversation = async () => {
    try {
      const response = await sendMessageToRasa("iniciar", "user");
      console.log("Resposta inicial do Rasa:", response);
      if (response && response.length > 0) {
        setMessages([{ role: "assistant", content: response[0].text }]);
      }
    } catch (error) {
      console.error("Erro ao iniciar conversa:", error);
    }
  };

  const fetchLevels = async () => {
    try {
      const response = await sendToActionServer("action_listar_niveis", {});
      console.log("Níveis recebidos:", response);
      if (response && response.responses) {
        const levels = response.responses[0].buttons?.map((btn: { title: string }) => btn.title) || [];
        setOptions(levels);
      }
    } catch (error) {
      console.error("Erro ao buscar níveis:", error);
    }
  };

  const handleLevelSelected = async (level: string) => {
    console.log("Nível selecionado:", level);
    setUserLevel(level);
    try {
      const response = await sendToActionServer("action_definir_nivel", { nivel: level });
      console.log("Resposta ao definir nível:", response);
      if (response) {
        await fetchOptions(level);
      }
    } catch (error) {
      console.error("Erro ao definir nível:", error);
    }
  };

  const fetchOptions = async (level: string) => {
    try {
      console.log("Buscando opções para o nível:", level);
      const response = await sendToActionServer("action_listar_opcoes", { nivel: level });
      console.log("Opções recebidas:", response);
      if (response && response.responses) {
        setOptions(response.responses[0].buttons?.map((btn: { title: string }) => btn.title) || []);
      }
    } catch (error) {
      console.error("Erro ao buscar opções:", error);
    }
  };

  const handleOptionSelected = async (option: string) => {
    console.log("Opção selecionada:", option);
    try {
      const response = await sendToActionServer("action_listar_subopcoes", { categoria: option });
      console.log("Subopções recebidas:", response);
      if (response && response.responses) {
        setSubOptions(response.responses[0].buttons?.map((btn: { title: string }) => btn.title) || []);
      }
    } catch (error) {
      console.error("Erro ao buscar subopções:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#141414] flex-col items-center w-full max-w-full px-0 sm:px-8 md:px-16 mx-auto">
      <div className="absolute bg-[#141414] w-full justify-between flex border-b-[0.5px] border-neutral-800 px-6 py-4">
        <p className="font-Montserrat text-neutral-200 font-semibold text-2xl">CHAT SAEL</p>
        {token && (
          <button onClick={() => setMenuOpen(true)} className="text-white">
            <MenuIcon size={28} />
          </button>
        )}
      </div>

      <div className="flex flex-col items-center w-full h-screen py-32">
        <StartConversation onStart={startConversation} />

        {!userLevel ? (
          <LevelUser onLevelSelected={handleLevelSelected} levels={options} />
        ) : subOptions.length === 0 ? (
          <ListOptions options={options} onOptionSelected={handleOptionSelected} />
        ) : (
          <ListSubOptions subOptions={subOptions} onSubOptionSelected={sendMessage} />
        )}

        {messages.map((message, index) => (
          <div key={index} className={`text-${message.role === "user" ? "white" : "blue-300"}`}>
            {message.content}
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 mb-8 px-4">
        <div className="flex justify-center bg-[#1a1f27] size-14 rounded-full w-full max-w-lg mx-auto">
          <div className="flex items-center p-2 rounded-full w-full">
            <input
              type="text"
              placeholder="Comece a escrever"
              className="w-full bg-transparent text-gray-200 outline-none rounded-full py-3 px-6"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button onClick={() => sendMessage(inputText)} className="text-neutral-200 bg-blue-700 rounded-full p-2">
              <Send strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      <Header isOpen={menuOpen} closeMenu={() => setMenuOpen(false)} />
    </div>
  );
}

export { Chat };
