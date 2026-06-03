import { MessageCircle, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function InitialChoiceStep() {
  const navigate = useNavigate();

  return (
    <div id="initial-choice-container" className="w-full px-4 py-8">
      <h2 className="text-center text-white font-[Poppins] font-semibold text-xl mb-8">
        O que deseja fazer hoje?
      </h2>

      <div
        id="chat-mode-options"
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto"
      >
        <button
          id="chat-button"
          onClick={() => navigate("/chat")}
          className="flex flex-col items-center gap-4 bg-[#1f1f1f] border border-white/10 hover:border-blue-500/50 rounded-2xl p-6 transition-all duration-200 cursor-pointer group"
        >
          <div className="w-14 h-14 rounded-xl bg-blue-600/20 flex items-center justify-center group-hover:bg-blue-600/30 transition-colors">
            <MessageCircle className="w-8 h-8 text-blue-400" />
          </div>
          <div className="flex flex-col gap-1 text-center">
            <span className="text-white font-[Poppins] font-semibold text-base">
              Conversa Livre
            </span>
            <span className="text-gray-400 font-[Poppins] text-sm leading-snug">
              Tire dúvidas sobre lógica de programação com o LogiBot
            </span>
          </div>
          <span className="mt-auto w-full py-2 bg-blue-600 hover:bg-blue-700 border border-blue-400/40 text-white font-semibold text-sm rounded-md transition-colors shadow-md shadow-blue-900/30">
            Começar chat
          </span>
        </button>

        <button
          id="quiz-button"
          onClick={() => navigate("/quiz")}
          className="flex flex-col items-center gap-4 bg-[#1f1f1f] border border-white/10 hover:border-indigo-500/50 rounded-2xl p-6 transition-all duration-200 cursor-pointer group"
        >
          <div className="w-14 h-14 rounded-xl bg-indigo-600/20 flex items-center justify-center group-hover:bg-indigo-600/30 transition-colors">
            <Brain className="w-8 h-8 text-indigo-400" />
          </div>
          <div className="flex flex-col gap-1 text-center">
            <span className="text-white font-[Poppins] font-semibold text-base">
              Quiz
            </span>
            <span className="text-gray-400 font-[Poppins] text-sm leading-snug">
              Teste seus conhecimentos com 5 perguntas personalizadas por nível
              e tema
            </span>
          </div>
          <span className="mt-auto w-full py-2 bg-indigo-600 hover:bg-indigo-700 border border-indigo-400/40 text-white font-semibold text-sm rounded-md transition-colors shadow-md shadow-indigo-900/30">
            Iniciar quiz
          </span>
        </button>
      </div>
    </div>
  );
}
