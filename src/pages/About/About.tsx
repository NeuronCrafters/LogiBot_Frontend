import { useState } from "react";
import { Loader2, Menu as MenuIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-Auth";
import { Avatar } from "@/components/components/Avatar/Avatar";
import { Header } from "@/components/components/Header/Header";

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
        <p className="text-red-500">Erro ao carregar os dados.</p>
      </div>
    );
  }

  const occupation = Array.isArray(user.role)
    ? user.role.map(translateRole).join(", ")
    : translateRole(user.role);

  const isAdmin = Array.isArray(user.role)
    ? user.role.includes("admin")
    : user.role === "admin";

  // extrai schoolName (que já vem na API como string)
  const schoolName =
    typeof user.schoolName === "string"
      ? user.schoolName
      : Array.isArray(user.schoolName)
        ? user.schoolName.join(", ")
        : "";

  // extrai nome do curso do primeiro elemento de user.courses
  const courseName =
    Array.isArray(user.courses) && user.courses.length > 0
      ? (user.courses[0] as any).name
      : "-";

  // extrai turma (só para estudante)
  const className =
    Array.isArray(user.className)
      ? user.className.join(", ")
      : typeof user.className === "string"
        ? user.className
        : "-";

  return (
    <div className="flex flex-col min-h-screen bg-[#141414] text-white">
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-neutral-800">
        <h2 className="text-2xl font-semibold font-Montserrat">Sobre Mim</h2>
        {isAuthenticated && (
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
            className="text-white"
          >
            <MenuIcon size={28} />
          </button>
        )}
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md sm:max-w-lg md:max-w-xl rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-1 shadow-2xl">
          <div className="bg-[#2a2a2a] rounded-3xl p-6 sm:p-10 space-y-6">

            <div className="flex justify-center -mt-16">
              <div className="rounded-full p-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                <Avatar
                  seed={user._id}
                  size={isAdmin ? 120 : 160}
                />
              </div>
            </div>

            <div className="space-y-4">
              <Detail label="Nome" value={user.name} />
              <Detail label="Email" value={user.email} />
              <Detail label="Ocupação" value={occupation} />

              {!isAdmin && (
                <>
                  <Detail label="Universidade" value={schoolName} />
                  <Detail label="Curso" value={courseName} />
                  {Array.isArray(user.role) && user.role.includes("student") && (
                    <Detail label="Turma" value={className} />
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
}
function Detail({ label, value }: DetailProps) {
  return (
    <div>
      <span className="font-medium text-gray-300">{label}:</span>{" "}
      <span className="font-semibold">{value}</span>
    </div>
  );
}
