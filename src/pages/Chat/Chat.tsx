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
import { ExtractOptions } from "@/components/components/Chat/ExtractOptions";
import { sendMessageToRasa, sendToActionServer } from "@/services/rasaService";

function Chat() {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [userLevel, setUserLevel] = useState<string | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [subOptions, setSubOptions] = useState<string[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [buttons, setButtons] = useState<{ title: string; payload: string }[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const { token } = useAuthStore(); // Usando o token do zustand

  // Função para enviar mensagem ao Rasa e atualizar o estado das mensagens
  const sendMessage = async (message: string, role: "user" | "assistant" = "user") => {
    setMessages((prev) => [...prev, { role, content: message }]);
    const response = await sendMessageToRasa(message);
    if (response && response.length > 0) {
      setMessages((prev) => [...prev, { role: "assistant", content: response[0].text }]);
      if (response[0].buttons) {
        setButtons(response[0].buttons);
      }
    }
  };

  // Função para iniciar a conversa
  const startConversation = async () => {
    const response = await sendMessageToRasa("iniciar", "user");
    if (response && response.length > 0) {
      setMessages([{ role: "assistant", content: response[0].text }]);
    }
  };

  // Função para definir o nível do usuário
  const handleLevelSelected = async (level: string) => {
    setUserLevel(level);
    const response = await sendToActionServer("action_definir_nivel", { nivel: level });
    if (response) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Nível definido: ${level}` }]);
      await listOptions(); // Listar opções após definir o nível
    }
  };

  // Função para listar opções
  const listOptions = async () => {
    const response = await sendToActionServer("action_listar_opcoes", { nivel: userLevel });
    if (response && response.responses && response.responses.length > 0) {
      setOptions(response.responses[0].buttons?.map((btn: { title: string }) => btn.title) || []);
      setButtons(response.responses[0].buttons || []);
    }
  };

  // Função para listar subopções
  const listSubOptions = async (categoria: string) => {
    const response = await sendToActionServer("action_listar_subopcoes", { categoria, nivel: userLevel });
    if (response && response.responses && response.responses.length > 0) {
      setSubOptions(response.responses[0].buttons?.map((btn: { title: string }) => btn.title) || []);
      setMessages((prev) => [...prev, { role: "assistant", content: response.responses[0].text }]);
      if (response.responses[0].buttons) {
        setButtons(response.responses[0].buttons);
      }
    }
  };

  // Função para gerar perguntas
  const generateQuestions = async (pergunta: string) => {
    const response = await sendToActionServer("action_gerar_perguntas_chatgpt", { pergunta, nivel: userLevel });
    if (response && response.responses && response.responses.length > 0) {
      setQuestions([response.responses[0].text]);
      setMessages((prev) => [...prev, { role: "assistant", content: response.responses[0].text }]);
    }
  };

  // Função para lidar com o clique nos botões
  const handleButtonClick = async (payload: string) => {
    if (payload.startsWith("/listar_subopcoes")) {
      const categoria = JSON.parse(payload.slice(payload.indexOf("{"))).categoria;
      await listSubOptions(categoria);
    } else if (payload.startsWith("/gerar_perguntas")) {
      const pergunta = JSON.parse(payload.slice(payload.indexOf("{"))).pergunta;
      await generateQuestions(pergunta); // Chama a API da OpenAI apenas aqui
    } else {
      await sendMessage(payload);
    }
  };

  // Função para extrair opções e enviar ao Rasa
  const handleOptionExtracted = async (option: string) => {
    await sendMessage(option);
  };

  // Efeito para iniciar a conversa ao carregar o componente
  useEffect(() => {
    startConversation();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#141414] flex-col items-center w-full max-w-full px-0 sm:px-8 md:px-16 mx-auto">
      <div className="absolute bg-[#141414] w-full justify-between flex border-b-[0.5px] border-neutral-800 px-6 py-4">
        <p className="font-Montserrat text-neutral-200 font-semibold text-2xl">CHAT SAEL</p>
        {token && ( // Verifica se o token existe (usuário autenticado)
          <button onClick={() => setMenuOpen(true)} className="text-white">
            <MenuIcon size={28} />
          </button>
        )}
      </div>

      <div className="flex flex-col items-center w-full h-screen py-32">
        <StartConversation onStart={startConversation} />

        {messages.map((message, index) => (
          <div key={index} className={`text-${message.role === "user" ? "white" : "blue-300"}`}>
            {message.content}
          </div>
        ))}

        {!userLevel && <LevelUser onLevelSelected={handleLevelSelected} />}

        {userLevel && options.length === 0 && (
          <ListOptions options={options} onOptionSelected={handleButtonClick} />
        )}

        {options.length > 0 && subOptions.length === 0 && (
          <ListSubOptions subOptions={subOptions} onSubOptionSelected={handleButtonClick} />
        )}

        {subOptions.length > 0 && questions.length === 0 && (
          <GenerateQuestions questions={questions} />
        )}

        {buttons.length > 0 && <ChatButtons buttons={buttons} onButtonClick={handleButtonClick} />}

        {messages.some((message) => message.role === "assistant" && message.content.includes("(")) && (
          <ExtractOptions
            text={messages.find((message) => message.role === "assistant" && message.content.includes("("))?.content || ""}
            onOptionSelected={handleOptionExtracted}
          />
        )}
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