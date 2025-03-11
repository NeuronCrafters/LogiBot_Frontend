import { Link } from "react-router-dom";
import { useState } from "react";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { Button } from "@/components/ui/button";
import { User, ChartPie, LogOut, Settings, ChevronDown, ChevronUp } from "lucide-react";

interface MenuOptionsProps {
  role: "student" | "teacher" | "course-coordinator" | "admin";
  logout: () => void;
}

export function MenuOptions({ role, logout }: MenuOptionsProps) {
  const [isCrudOpen, setIsCrudOpen] = useState(false);

  const options = [
    { href: "/me", label: "Detalhes", icon: <User className="w-5 h-5 mr-2" />, roles: ["student", "teacher", "course-coordinator", "admin"] },
    { href: "/results", label: "Resultados", icon: <ChartPie className="w-5 h-5 mr-2" />, roles: ["teacher", "course-coordinator", "admin"] },
  ];

  const crudOptions = [
    { href: "/crud?type=university", label: "Criar Universidade", icon: <ChartPie className="w-5 h-5 mr-2" /> },
    { href: "/crud?type=course", label: "Criar Curso" },
    { href: "/crud?type=class", label: "Criar Turma" },
    { href: "/crud?type=professor", label: "Criar Professor" },
    { href: "/crud?type=discipline", label: "Criar Disciplina" },
    { href: "/crud?type=assignDiscipline", label: "Vincular Aluno a Disciplina" },
  ];

  const filteredOptions = options.filter((option) => option.roles.includes(role));

  return (
    <nav className="flex flex-col space-y-4 bg-[#141414] p-4 rounded-lg shadow-md">
      {filteredOptions.map((item) => (
        <Link key={item.label} to={item.href} className="flex items-center space-x-3 text-gray-300 hover:text-gray-100">
          <Button variant="ghost" className="w-full justify-start flex items-center gap-2">
            {item.icon}
            <Typograph text={item.label} colorText="text-[#E4E4E4]" variant="text4" weight="regular" fontFamily="poppins" />
          </Button>
        </Link>
      ))}

      <button
        onClick={() => setIsCrudOpen(!isCrudOpen)}
        className="flex items-center justify-between w-full bg-transparent text-gray-300 hover:text-gray-100 px-4 py-2 rounded"
      >
        <div className="flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          <Typograph text="Criar" colorText="text-[#E4E4E4]" variant="text4" weight="regular" fontFamily="poppins" />
        </div>
        {isCrudOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isCrudOpen && (
        <div className="pl-6 flex flex-col space-y-2">
          {crudOptions.map((option) => (
            <Link key={option.label} to={option.href} className="text-gray-300 hover:text-gray-100">
              <Button variant="ghost" className="w-full justify-start">
                {option.label}
              </Button>
            </Link>
          ))}
        </div>
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
