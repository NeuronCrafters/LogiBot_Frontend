import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Header } from "@/components/components/Header/Header";
import { useAuthStore } from "@/stores/authStore";

export function FormsHeader() {
  const { user } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <Header isOpen={menuOpen} closeMenu={() => setMenuOpen(false)} />
      <div className="p-6 bg-[#2a2a2a] flex items-center justify-between">
        <div>
          {/* Exibe texto completo em telas a partir de "sm" e versão reduzida em telas menores */}
          <h1 className="text-xl font-bold text-white hidden sm:block">
            Gerenciamento Acadêmico
          </h1>
          <h1 className="text-xl font-bold text-white block sm:hidden">
            Gerenciamento
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <button onClick={() => setMenuOpen(true)} className="focus:outline-none">
              <Avatar className="h-10 w-10 bg-gray-700 text-white flex items-center justify-center">
                <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
