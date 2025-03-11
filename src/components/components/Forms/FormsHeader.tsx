import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";
import { FilterForms } from "@/components/components/Forms/Forms/FilterForms";
import { BackButton } from "../Button/BackButton";

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

  return (
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
        <BackButton />
      </div>
    </div>
  );
}
