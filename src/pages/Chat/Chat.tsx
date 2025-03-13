import { useState } from "react";
import { Send, Menu as MenuIcon } from "lucide-react";
import { Header } from "@/components/components/Header/Header";
import { useAuthStore } from "@/stores/authStore";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import logo from "../../assets/logo.svg";

function Chat() {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const { token } = useAuthStore();
  const userName = "User";

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInputText("");

    try {
      if (!token) {
        console.error("Token JWT não encontrado.");
        return;
      }

      const response = await fetch("http://localhost:3000/sael/talk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });

      const responseData = await response.json();

      if (response.ok && responseData.length > 0) {
        setTimeout(() => {
          setMessages((prev) => [...prev, { role: "assistant", content: responseData[0].text }]);
        }, 500);
      } else {
        console.error("Erro na resposta do servidor:", responseData);
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#141414] flex-col items-center w-full max-w-full px-0 sm:px-8 md:px-16 mx-auto">

      <div className="absolute bg-[#141414] w-full flex justify-between border-b-[0.5px] border-neutral-800 px-6 py-4">
        <p className="font-Montserrat text-neutral-200 font-semibold text-2xl">CHAT SAEL</p>
        {token && (
          <button onClick={() => setMenuOpen(true)} className="text-white">
            <MenuIcon size={28} />
          </button>
        )}
      </div>

      <div className="flex flex-col items-center w-full h-screen py-32">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-end w-full max-w-lg mb-3 ${message.role === "user" ? "justify-end" : "justify-start"
              } animate-fade-in`}
          >
            {message.role === "assistant" && (
              <div className="mr-2">
                <img src={logo} alt="Bot" className="w-10 h-10 rounded-full bg-white p-1" />
              </div>
            )}

            <div
              className={`p-3 rounded-lg max-w-[75%] ${message.role === "user"
                ? "bg-blue-600 text-white ml-auto rounded-br-none"
                : "bg-gray-800 text-gray-200 mr-auto rounded-bl-none"
                }`}
            >
              {message.content}
            </div>

            {message.role === "user" && (
              <Avatar className="ml-2 bg-gray-700 w-10 h-10">
                <AvatarFallback className="text-white font-semibold">{userName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 mb-8 px-4 flex justify-center">
        <div className="flex items-center bg-[#1a1f27] size-14 rounded-full w-full max-w-lg mx-auto p-2">
          <input
            type="text"
            placeholder="Comece a escrever"
            className="w-full bg-transparent text-gray-200 outline-none rounded-full py-3 px-6"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button
            onClick={() => sendMessage(inputText)}
            className="text-neutral-200 bg-blue-700 rounded-full p-2 ml-2"
          >
            <Send strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <Header isOpen={menuOpen} closeMenu={() => setMenuOpen(false)} />
    </div>
  );
}

export { Chat };
