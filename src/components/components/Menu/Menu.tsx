import React from "react";
import { useAuthStore } from "@/stores/authStore";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { MenuOptions } from "@/components/components/Menu/MenuOptions";
import { Button } from "@/components/ui/button";
import { HelpCircle, LogOut } from "lucide-react";

export function Menu({ isOpen, closeMenu }: { isOpen: boolean; closeMenu: () => void }) {
  const { user, logout } = useAuthStore();

  if (!user) return null;

  return (
    <div
      className={`fixed inset-y-0 right-0 z-50 w-[350px] bg-[#181818] transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"
        }`}
    >
      <div className="h-full p-6 flex flex-col">
        <div className="flex flex-col items-center space-y-2 mb-4">
          <Avatar className="h-36 w-36 bg-white">
            <AvatarImage src={user.avatar || "/default-avatar.png"} alt={user.name || "Usuário"} />
            <AvatarFallback>{user.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          <Typograph text={user.name || "Usuário"} colorText="text-[#E4E4E4]" variant="text2" weight="bold" fontFamily="poppins" />
          <Typograph text={user.role || "Cargo não definido"} colorText="text-gray-400" variant="text4" weight="regular" fontFamily="poppins" />
        </div>

        <Separator className="bg-[#2a2a2a] mb-2" />

        <MenuOptions role={user.role} logout={logout} />

        <div className="mt-auto space-y-4">
          <a href="/help" className="flex items-center space-x-3 hover:text-gray-300">
            <Button variant="ghost" className="w-full justify-start">
              <HelpCircle className="w-5 h-5 text-[#E4E4E4] mr-2" />
              <Typograph text="Dúvidas" colorText="text-[#E4E4E4]" variant="text4" weight="regular" fontFamily="poppins" />
            </Button>
          </a>

          <Button
            variant="ghost"
            onClick={() => {
              logout();
              closeMenu();
            }}
            className="w-full justify-start text-red-500 hover:text-red-400"
          >
            <LogOut className="w-5 h-5 text-red-500 mr-2" />
            <Typograph text="Sair" colorText="text-[#E4E4E4]" variant="text4" weight="regular" fontFamily="poppins" />
          </Button>
        </div>
      </div>
    </div>
  );
}
