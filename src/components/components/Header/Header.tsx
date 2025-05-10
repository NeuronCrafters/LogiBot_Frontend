import { useAuth } from "@/hooks/use-Auth";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { Avatar } from "@/components/components/Avatar/Avatar";
import { Separator } from "@/components/ui/separator";
import { MenuOptions } from "@/components/components/Header/HeaderOptions";
import { X } from "lucide-react";

interface HeaderProps {
  isOpen: boolean;
  closeMenu: () => void;
}

export function Header({ isOpen, closeMenu }: HeaderProps) {
  const { user, logout } = useAuth();
  if (!user) return null;

  const rawRoles = Array.isArray(user.role) ? user.role : [user.role];
  const isAdmin = rawRoles.includes("admin");
  const isCoordinator = rawRoles.includes("course-coordinator");
  const isProfessor = rawRoles.includes("professor");
  const menuRole = isAdmin
    ? "admin"
    : isCoordinator
      ? "course-coordinator"
      : isProfessor
        ? "teacher"
        : "student";


  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
        onClick={closeMenu}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-[350px] bg-[#181818] transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="flex justify-end p-4">
          <button onClick={closeMenu} className="text-white hover:text-gray-400">
            <X size={28} />
          </button>
        </div>

        <div className="h-full p-6 flex flex-col">
          <div className="flex flex-col items-center space-y-2 mb-4">
            <div
              className="
    rounded-full p-[2px]
    bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600
    inline-flex items-center justify-center
    w-32 h-32
    sm:w-36 sm:h-36 
    md:w-40 md:h-40 
  "
            >
              <Avatar
                seed={user._id}
                backgroundColor="#2a2a2a"
                className="w-full h-full"
              />
            </div>

            <Typograph
              text={user.name}
              colorText="text-[#E4E4E4]"
              variant="text2"
              weight="bold"
              fontFamily="poppins"
            />
            <Typograph
              text={rawRoles.map(r =>
                r === "admin"
                  ? "Administrador"
                  : r === "professor"
                    ? "Professor"
                    : r === "course-coordinator"
                      ? "Coordenador de Curso"
                      : "Estudante"
              ).join(", ")}
              colorText="text-gray-400"
              variant="text4"
              weight="regular"
              fontFamily="poppins"
            />
          </div>

          <Separator className="bg-[#2a2a2a] mb-2" />

          {/* Opções de menu */}
          <MenuOptions
            role={menuRole as "student" | "teacher" | "course-coordinator" | "admin"}
            logout={() => { logout(); closeMenu(); }}
          />
        </div>
      </div>
    </>
  );
}
