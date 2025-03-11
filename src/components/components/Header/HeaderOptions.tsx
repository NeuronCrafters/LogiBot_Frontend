import { Link, useLocation } from "react-router-dom";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { Button } from "@/components/ui/button";
import { User, ChartPie, LogOut, Settings, HelpCircle, MessageSquare } from "lucide-react";

interface MenuOptionsProps {
  role: "student" | "teacher" | "course-coordinator" | "admin";
  logout: () => void;
}

export function MenuOptions({ role, logout }: MenuOptionsProps) {
  const location = useLocation(); // Obtém a rota atual

  // Filtros para esconder certos botões em telas específicas
  const isChatPage = location.pathname === "/chat";
  const isCrudPage = location.pathname === "/crud";
  const isAboutPage = location.pathname === "/about";
  const isFaqPage = location.pathname === "/faq";

  return (
    <nav className="flex flex-col space-y-4 bg-[#141414] p-4 rounded-lg shadow-md">
      {/* Botão "Detalhes" (aparece se NÃO estiver na página About) */}
      {!isAboutPage && (
        <Link to="/about">
          <Button variant="ghost" className="w-full justify-start flex items-center gap-2 text-gray-300 hover:text-gray-100">
            <User className="w-5 h-5" />
            <Typograph text="Detalhes" colorText="text-[#E4E4E4]" variant="text4" weight="regular" fontFamily="poppins" />
          </Button>
        </Link>
      )}

      {/* Botão "Resultados" (só para professores, coordenadores e admin) */}
      {["teacher", "course-coordinator", "admin"].includes(role) && (
        <Link to="/results">
          <Button variant="ghost" className="w-full justify-start flex items-center gap-2 text-gray-300 hover:text-gray-100">
            <ChartPie className="w-5 h-5" />
            <Typograph text="Resultados" colorText="text-[#E4E4E4]" variant="text4" weight="regular" fontFamily="poppins" />
          </Button>
        </Link>
      )}

      {/* Botão "Chat" (aparece se NÃO estiver na página do chat) */}
      {!isChatPage && (
        <Link to="/chat">
          <Button variant="ghost" className="w-full justify-start flex items-center gap-2 text-gray-300 hover:text-gray-100">
            <MessageSquare className="w-5 h-5" />
            <Typograph text="Chat" colorText="text-[#E4E4E4]" variant="text4" weight="regular" fontFamily="poppins" />
          </Button>
        </Link>
      )}

      {/* Botão "Criar" (aparece se NÃO estiver na página CRUD e APENAS para admin e coordenadores) */}
      {!isCrudPage && ["admin", "course-coordinator"].includes(role) && (
        <Link to="/crud">
          <Button variant="ghost" className="w-full justify-start flex items-center gap-2 text-gray-300 hover:text-gray-100">
            <Settings className="w-5 h-5" />
            <Typograph text="Criar" colorText="text-[#E4E4E4]" variant="text4" weight="regular" fontFamily="poppins" />
          </Button>
        </Link>
      )}

      {/* Botão "Dúvidas" (aparece se NÃO estiver na página FAQ) */}
      {!isFaqPage && (
        <Link to="/faq">
          <Button variant="ghost" className="w-full justify-start flex items-center gap-2 text-gray-300 hover:text-gray-100">
            <HelpCircle className="w-5 h-5" />
            <Typograph text="Dúvidas" colorText="text-[#E4E4E4]" variant="text4" weight="regular" fontFamily="poppins" />
          </Button>
        </Link>
      )}

      {/* Botão de Logout */}
      <Button
        variant="ghost"
        onClick={logout}
        className="w-full justify-start flex items-center gap-2 text-red-500 hover:text-red-300 mt-4"
      >
        <LogOut className="w-5 h-5 text-red-500" />
        <Typograph text="Sair" colorText="text-[#E4E4E4]" variant="text4" weight="regular" fontFamily="poppins" />
      </Button>
    </nav>
  );
}
