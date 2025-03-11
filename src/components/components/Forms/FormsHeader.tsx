import { useState } from "react";
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Header } from "@/components/components/Header/Header";
import { useAuthStore } from "@/stores/authStore";

interface FormsHeaderProps {
  openCreateModal: () => void;
}

export function FormsHeader({ openCreateModal }: FormsHeaderProps) {
  const { user } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <Header isOpen={menuOpen} closeMenu={() => setMenuOpen(false)} />

      <div className="p-6 bg-[#2a2a2a] flex flex-col sm:flex-row items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Gerenciamento Acadêmico</h1>

        <div className="flex items-center gap-4">
          <ButtonCRUD action="create" onClick={openCreateModal} />

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
