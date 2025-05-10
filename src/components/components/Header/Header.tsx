import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-Auth";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { MenuOptions } from "@/components/components/Header/HeaderOptions";
import { Button } from "@/components/ui/button";
import { HelpCircle, LogOut, X } from "lucide-react";

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
  const isProfessor = rawRoles.includes("professor"); // <-- ajuste aqui
  const menuRole = isAdmin
    ? "admin"
    : isCoordinator
      ? "course-coordinator"
      : isProfessor
        ? "teacher"
        : "student";

  const location = useLocation();
  const isAboutPage = location.pathname === "/about";
  const isFaqPage = location.pathname === "/faq";

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
        onClick={closeMenu}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-[350px] bg-[#181818] transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex justify-end p-4">
          <button onClick={closeMenu} className="text-white hover:text-gray-400">
            <X size={28} />
          </button>
        </div>

        <div className="h-full p-6 flex flex-col">
          {/* Avatar e nome */}
          <div className="flex flex-col items-center space-y-2 mb-4">
            <Avatar className="h-36 w-36 bg-white">
              <AvatarImage src="/default-avatar.png" alt={user.name || "Usuário"} />
              <AvatarFallback>
                {user.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <Typograph
              text={user.name || "Usuário"}
              colorText="text-[#E4E4E4]"
              variant="text2"
              weight="bold"
              fontFamily="poppins"
            />
            <Typograph
              text={rawRoles.join(", ")}
              colorText="text-gray-400"
              variant="text4"
              weight="regular"
              fontFamily="poppins"
            />
          </div>

          <Separator className="bg-[#2a2a2a] mb-2" />

          {/* Opções de menu */}
          <MenuOptions role={menuRole as "student" | "teacher" | "course-coordinator" | "admin"} logout={logout} />

          {/* Links de rodapé */}
          <div className="mt-auto space-y-4">
            {!isFaqPage && (
              <Link to="/faq">
                <Button
                  variant="ghost"
                  className="w-full justify-start flex items-center gap-2 text-gray-300 hover:text-gray-100"
                >
                  <HelpCircle className="w-5 h-5 text-[#E4E4E4]" />
                  <Typograph
                    text="Dúvidas"
                    colorText="text-[#E4E4E4]"
                    variant="text4"
                    weight="regular"
                    fontFamily="poppins"
                  />
                </Button>
              </Link>
            )}

            <Button
              variant="ghost"
              onClick={() => { logout(); closeMenu(); }}
              className="w-full justify-start text-red-500 hover:text-red-400"
            >
              <LogOut className="w-5 h-5 text-red-500 mr-2" />
              <Typograph
                text="Sair"
                colorText="text-[#E4E4E4]"
                variant="text4"
                weight="regular"
                fontFamily="poppins"
              />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
