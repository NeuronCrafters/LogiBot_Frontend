import { useState } from "react";
import {
  Loader2,
  User as UserIcon,
  Mail,
  Briefcase,
  School as SchoolIcon,
  BookOpen,
  Users,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-Auth";
import { Avatar } from "@/components/components/Avatar/Avatar";
import { Header } from "@/components/components/Header/Header";
import { Typograph } from "@/components/components/Typograph/Typograph";

const translateRole = (role: string) => {
  switch (role) {
    case "student":
      return "Estudante";
    case "professor":
    case "teacher":
      return "Professor";
    case "course-coordinator":
      return "Coordenador de Curso";
    case "admin":
      return "Administrador";
    default:
      return role;
  }
};

export function About() {
  const { user, isAuthenticated, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#141414]">
        <Loader2 className="w-12 h-12 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#141414]">
        <Typograph
          text="Erro ao carregar os dados."
          colorText="text-red-500"
          variant="text5"
          weight="medium"
          fontFamily="poppins"
        />
      </div>
    );
  }

  const occupation = Array.isArray(user.role)
    ? user.role.map(translateRole).join(", ")
    : translateRole(user.role);

  const isAdmin = Array.isArray(user.role)
    ? user.role.includes("admin")
    : user.role === "admin";

  const isProfessor = Array.isArray(user.role)
    ? user.role.includes("professor")
    : user.role === "professor";

  const schoolName =
    typeof user.schoolName === "string"
      ? user.schoolName
      : Array.isArray(user.schoolName)
        ? user.schoolName.join(", ")
        : "";

  const courseName = Array.isArray(user.courseName)
    ? user.courseName.join(", ")
    : user.courseName;

  const className =
    Array.isArray(user.className)
      ? user.className.join(", ")
      : typeof user.className === "string"
        ? user.className
        : "-";

  const professorCourses =
    Array.isArray(user.courses) && user.courses.length > 0
      ? user.courses.map((c: any) => c.name).join(", ")
      : "-";

  const professorClasses =
    Array.isArray(user.classes) && user.classes.length > 0
      ? user.classes.map((c: any) => c.name).join(", ")
      : "-";

  const professorDisciplines =
    Array.isArray(user.disciplines) && user.disciplines.length > 0
      ? user.disciplines.map((d: any) => d.name).join(", ")
      : "-";

  return (
    <div className="flex flex-col min-h-screen bg-[#141414] text-white">
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-neutral-800">
        <Typograph
          text="Sobre Mim"
          colorText="text-white"
          variant="text2"
          weight="bold"
          fontFamily="poppins"
        />
        {isAuthenticated && (
          <Button
            onClick={() => setMenuOpen(true)}
            className="p-0 flex items-center justify-center"
          >
            <div className="rainbow-avatar w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center">
              <Avatar
                seed={user._id}
                backgroundColor="#141414"
                className="w-full h-full rounded-full"
              />
            </div>
          </Button>
        )}
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="rainbow-card w-full max-w-md sm:max-w-lg md:max-w-xl shadow-2xl">
          <div className="card-content space-y-6">
            <div className="flex justify-center -mt-16">
              <div
                className={`rainbow-avatar ${isAdmin ? "w-32 h-32 sm:w-36 sm:h-36" : "w-40 h-40 sm:w-44 sm:h-44"}`}
              >
                <Avatar
                  seed={user._id}
                  backgroundColor="#2a2a2a"
                  className="w-full h-full rounded-full"
                />
              </div>
            </div>
            <div className="space-y-4">
              <Detail icon={<UserIcon size={18} />} label="Nome" value={user.name} />
              <Detail icon={<Mail size={18} />} label="Email" value={user.email} />
              <Detail icon={<Briefcase size={18} />} label="Ocupação" value={occupation} />
              {!isAdmin && (
                <>
                  <Detail icon={<SchoolIcon size={18} />} label="Universidade" value={schoolName} />
                  {isProfessor ? (
                    <>
                      <Detail icon={<BookOpen size={18} />} label="Curso(s)" value={professorCourses} />
                      <Detail icon={<Users size={18} />} label="Turma(s)" value={professorClasses} />
                      <Detail icon={<Layers size={18} />} label="Disciplina(s)" value={professorDisciplines} />
                    </>
                  ) : (
                    <>
                      <Detail icon={<BookOpen size={18} />} label="Curso" value={courseName} />
                      <Detail icon={<Users size={18} />} label="Turma" value={className} />
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Header isOpen={menuOpen} closeMenu={() => setMenuOpen(false)} />
    </div>
  );
}

interface DetailProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

function Detail({ label, value, icon }: DetailProps) {
  return (
    <div className="flex gap-2 flex-wrap items-center">
      {icon}
      <Typograph
        text={`${label}:`}
        colorText="text-gray-300"
        variant="text6"
        weight="medium"
        fontFamily="poppins"
      />
      <Typograph
        text={value}
        colorText="text-white"
        variant="text6"
        weight="semibold"
        fontFamily="poppins"
      />
    </div>
  );
}