import { Link, useLocation } from "react-router-dom";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { Button } from "@/components/ui/button";
import { User, ChartPie, LogOut, Settings, HelpCircle, MessageSquare } from "lucide-react";

interface MenuOptionsProps {
  role: "student" | "teacher" | "course-coordinator" | "admin";
  logout: () => void;
}

export function MenuOptions({ role, logout }: MenuOptionsProps) {
  const location = useLocation();

  const isChatPage = location.pathname === "/chat";
  const isCrudPage = location.pathname === "/crud";
  const isAboutPage = location.pathname === "/about";
  const isFaqPage = location.pathname === "/faq";
  const isChartPage = location.pathname === "/chart";

  return (
    <nav className="flex flex-col space-y-4 bg-[#141414] p-4 rounded-lg shadow-md">
      {!isAboutPage && (
        <Link to="/about">
          <Button variant="ghost" className="w-full justify-start flex items-center gap-2 text-gray-300 hover:text-gray-100">
            <User className="w-5 h-5" />
            <Typograph text="Detalhes" colorText="text-[#E4E4E4]" variant="text4" weight="regular" fontFamily="poppins" />
          </Button>
        </Link>
      )}

      {["teacher", "course-coordinator", "admin"].includes(role) && (
        <Link to="/chart">
          <Button variant="ghost" className="w-full justify-start flex items-center gap-2 text-gray-300 hover:text-gray-100">
            <ChartPie className="w-5 h-5" />
            <Typograph text="Resultados" colorText="text-[#E4E4E4]" variant="text4" weight="regular" fontFamily="poppins" />
          </Button>
        </Link>
      )}

      {!isChatPage && (
        <Link to="/chat">
          <Button variant="ghost" className="w-full justify-start flex items-center gap-2 text-gray-300 hover:text-gray-100">
            <MessageSquare className="w-5 h-5" />
            <Typograph text="Chat" colorText="text-[#E4E4E4]" variant="text4" weight="regular" fontFamily="poppins" />
          </Button>
        </Link>
      )}

      {!isCrudPage && ["admin", "course-coordinator"].includes(role) && (
        <Link to="/crud">
          <Button variant="ghost" className="w-full justify-start flex items-center gap-2 text-gray-300 hover:text-gray-100">
            <Settings className="w-5 h-5" />
            <Typograph text="Criar" colorText="text-[#E4E4E4]" variant="text4" weight="regular" fontFamily="poppins" />
          </Button>
        </Link>
      )}

      {!isFaqPage && (
        <Link to="/faq">
          <Button variant="ghost" className="w-full justify-start flex items-center gap-2 text-gray-300 hover:text-gray-100">
            <HelpCircle className="w-5 h-5" />
            <Typograph text="Dúvidas" colorText="text-[#E4E4E4]" variant="text4" weight="regular" fontFamily="poppins" />
          </Button>
        </Link>
      )}

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
