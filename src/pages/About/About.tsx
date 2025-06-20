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
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-Auth";
import { Avatar } from "@/components/components/Avatar/Avatar";
import { Header } from "@/components/components/Header/Header";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { DisciplineCode } from "@/components/components/About/DisciplineCode";
import { ChangePasswordModal } from "@/components/components/Security/ChangePasswordModal";

/* ───────── Types ───────── */
interface DisciplineObject {
  id: string;
  name: string;
  code: string;
}

/* ───────── Utils ───────── */
const translateRole = (r: string) =>
({
  student: "Estudante",
  professor: "Professor",
  teacher: "Professor",
  "course-coordinator": "Coordenador de Curso",
  admin: "Administrador",
}[r] ?? r);

function isDisciplineObj(d: unknown): d is DisciplineObject {
  return (
    d !== null &&
    typeof d === "object" &&
    "id" in d &&
    "name" in d &&
    "code" in d
  );
}

export function About() {
  const { user, isAuthenticated, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  /* ---------- Loading & Erros ---------- */
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#141414]">
        <Loader2 className="w-12 h-12 animate-spin text-gray-500" />
      </div>
    );

  if (!user)
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

  /* ---------- Derivações ---------- */
  const roles = Array.isArray(user.role) ? user.role : [user.role];
  const occupation = roles.map(translateRole).join(", ");

  const isAdmin = roles.includes("admin");
  const isProfessor = roles.includes("professor");

  const schoolName = Array.isArray(user.schoolName) ? user.schoolName.join(", ") : user.schoolName ?? "-";
  const courseName = Array.isArray(user.courseName) ? user.courseName.join(", ") : user.courseName ?? "-";
  const className = Array.isArray(user.className) ? user.className.join(", ") : user.className ?? "-";
  const profCourses = Array.isArray(user.courses) ? user.courses.map((c: any) => c.name).join(", ") : "-";
  const profClasses = Array.isArray(user.classes) ? user.classes.map((c: any) => c.name).join(", ") : "-";

  /* ---------- Disciplinas ---------- */
  const disciplineObjects: DisciplineObject[] = Array.isArray(user.disciplines)
    ? user.disciplines.reduce<DisciplineObject[]>((acc, d) => {
      if (isDisciplineObj(d)) {
        acc.push(d);
      } else if (typeof d === "string") {
        acc.push({ id: d, name: d, code: d });
      }
      return acc;
    }, [])
    : [];

  const profDisciplines =
    disciplineObjects.length > 0
      ? disciplineObjects.map((d) => d.name).join(", ")
      : "-";

  return (
    <div className="flex flex-col min-h-screen bg-[#141414] text-white">
      {/* --- Header --- */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-neutral-800">
        <Typograph
          text="Sobre Mim"
          colorText="text-white"
          variant="text2"
          weight="bold"
          fontFamily="poppins"
        />
        {isAuthenticated && (
          <Button onClick={() => setMenuOpen(true)} className="p-0 flex items-center justify-center">
            <div className="rainbow-avatar w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center">
              <Avatar seed={user._id} backgroundColor="#141414" className="w-full h-full rounded-full" />
            </div>
          </Button>
        )}
      </header>

      {/* --- Conteúdo --- */}
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="rainbow-card w-full max-w-md sm:max-w-lg md:max-w-xl shadow-2xl">
          <div className="card-content space-y-6">

            {/* Avatar grande */}
            <div className="flex justify-center -mt-16">
              <div className={`rainbow-avatar ${isAdmin ? "w-32 h-32 sm:w-36 sm:h-36" : "w-40 h-40 sm:w-44 sm:h-44"}`}>
                <Avatar seed={user._id} backgroundColor="#2a2a2a" className="w-full h-full rounded-full" />
              </div>
            </div>

            {/* Info */}
            <div className="space-y-4">
              <Detail icon={<UserIcon size={18} />} label="Nome" value={user.name} />
              <Detail icon={<Mail size={18} />} label="Email" value={user.email} />
              <Detail icon={<Briefcase size={18} />} label="Ocupação" value={occupation} />

              {!isAdmin && (
                <>
                  <Detail icon={<SchoolIcon size={18} />} label="Universidade" value={schoolName} />

                  {isProfessor ? (
                    <>
                      <Detail icon={<BookOpen size={18} />} label="Curso(s)" value={profCourses} />
                      <Detail icon={<Users size={18} />} label="Turma(s)" value={profClasses} />

                      {/* Disciplinas + modal de códigos */}
                      <div className="flex gap-2 flex-wrap items-center">
                        <Layers size={18} />
                        <Typograph
                          text="Disciplina(s):"
                          colorText="text-gray-300"
                          variant="text6"
                          weight="medium"
                          fontFamily="poppins"
                        />
                        <Typograph
                          text={profDisciplines}
                          colorText="text-white"
                          variant="text6"
                          weight="semibold"
                          fontFamily="poppins"
                        />
                        {disciplineObjects.length > 0 && (
                          <DisciplineCode disciplines={disciplineObjects} />
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <Detail icon={<BookOpen size={18} />} label="Curso" value={courseName} />
                      <Detail icon={<Users size={18} />} label="Turma" value={className} />
                    </>
                  )}
                </>
              )}

              {/* Alterar senha */}
              <div className="flex gap-2 items-center">
                <KeyRound size={18} />
                <Button
                  variant="outline"
                  className="text-sm border-neutral-600 text-white hover:bg-neutral-800"
                  onClick={() => setShowChangePassword(true)}
                >
                  Alterar senha
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* --- Drawer menu --- */}
      <Header isOpen={menuOpen} closeMenu={() => setMenuOpen(false)} />

      {/* --- Modal alterar senha --- */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </div>
  );
}

/* --- Sub-componente reutilizável --- */
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