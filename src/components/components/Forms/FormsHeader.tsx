import { useState } from "react";
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";
import { FilterForms } from "@/components/components/Forms/Forms/FilterForms";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Header } from "@/components/components/Header/Header";
import { useAuthStore } from "@/stores/authStore";

interface FormsHeaderProps {
  selectedEntity: string;
  setSelectedEntity: (value: string) => void;
  selectedUniversity: string | null;
  setSelectedUniversity: (value: string | null) => void;
  selectedCourse: string | null;
  setSelectedCourse: (value: string | null) => void;
  fetchData: () => void;
  openCreateModal: () => void;
}

export function FormsHeader({
  selectedEntity,
  setSelectedEntity,
  selectedUniversity,
  setSelectedUniversity,
  selectedCourse,
  setSelectedCourse,
  fetchData,
  openCreateModal,
}: FormsHeaderProps) {
  const { user } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false); // Estado do menu lateral

  return (
    <>
      {/* Header lateral do usuário */}
      <Header isOpen={menuOpen} closeMenu={() => setMenuOpen(false)} />

      <div className="p-6 bg-[#2a2a2a] flex flex-col sm:flex-row items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Gerenciamento Acadêmico</h1>

        <div className="flex items-center gap-4">
          <FilterForms
            selectedEntity={selectedEntity}
            selectedUniversity={selectedUniversity}
            setSelectedUniversity={setSelectedUniversity}
            selectedCourse={selectedCourse}
            setSelectedCourse={setSelectedCourse}
            fetchData={fetchData}
          />

          <ButtonCRUD action="create" onClick={openCreateModal} />

          {/* Avatar do usuário - Abre o menu lateral */}
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
