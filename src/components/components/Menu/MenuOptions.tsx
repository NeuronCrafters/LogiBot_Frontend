import React from "react";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, BarChart2, User, ChartPie } from "lucide-react";

interface MenuOptionsProps {
  role: "student" | "teacher" | "course-coordinator" | "admin";
  logout: () => void;
}

export function MenuOptions({ role, logout }: MenuOptionsProps) {
  const options = [
    { href: "/me", label: "Detalhes", icon: <User className="w-5 h-5 mr-2" />, roles: ["student", "teacher", "course-coordinator", "admin"] },
    { href: "/students", label: "Alunos", icon: <Users className="w-5 h-5 mr-2" />, roles: ["teacher", "course-coordinator", "admin"] },
    { href: "/results", label: "Resultados", icon: <ChartPie className="w-5 h-5 mr-2" />, roles: ["teacher", "course-coordinator", "admin"] },
    { href: "/teachers", label: "Professores", icon: <BookOpen className="w-5 h-5 mr-2" />, roles: ["course-coordinator", "admin"] },
  ];

  const filteredOptions = options.filter((option) => option.roles.includes(role));

  return (
    <nav className="flex flex-col space-y-4">
      {filteredOptions.map((item) => (
        <a key={item.label} href={item.href} className="flex items-center space-x-3 hover:text-gray-300">
          <Button variant="ghost" className="w-full justify-start">
            {item.icon}
            <Typograph text={item.label} colorText="text-[#E4E4E4]" variant="text4" weight="regular" fontFamily="poppins" />
          </Button>
        </a>
      ))}
    </nav>
  );
}
