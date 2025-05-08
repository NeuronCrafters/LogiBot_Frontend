import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";
import { academicApi } from "@/services/apiClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AcademicEntityType } from "@/services/api/api_routes";

export interface Item {
  id: string | number;
  name: string;
  code?: string;
}

export type EntityType = AcademicEntityType | "student";

export interface FormsListProps {
  items: Item[];
  entity: EntityType;
  onEdit: (item: Item) => void;
  onDelete: (id: string | number) => void;
  createdItem?: Item | null;
}

function FormsList({
  items,
  entity,
  onEdit,
  onDelete,
  createdItem,
}: FormsListProps) {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (createdItem && entity === "class") {
      setShowModal(true);
    }
  }, [createdItem, entity]);

  const handleDeleteAction = async (id: string | number) => {
    const confirmed = window.confirm("Tem certeza que deseja deletar?");
    if (!confirmed) return;

    const deletableEntities: AcademicEntityType[] = [
      "university",
      "course",
      "discipline",
      "class",
      "professor",
    ];

    if (deletableEntities.includes(entity as AcademicEntityType)) {
      try {
        await academicApi.delete(entity as AcademicEntityType, id.toString());
        toast.success("Item deletado com sucesso!");
        onDelete(id);
      } catch (error) {
        toast.error("Erro ao deletar item.");
        console.error("Erro ao deletar item:", error);
      }
    } else {
      onDelete(id);
    }
  };

  const formatTitle = (e: EntityType) => {
    switch (e) {
      case "student":
        return "Alunos";
      case "professor":
        return "Professores";
      default:
        return `${e.charAt(0).toUpperCase()}${e.slice(1)}s`;
    }
  };

  return (
    <>
      <div className="bg-[#181818] text-white p-4 rounded-md">
        <h2 className="text-xl font-semibold mb-4">
          {formatTitle(entity)} encontrados:
        </h2>
        <ul>
          {items.map((item) => (
            <li
              key={item.id}
              className="bg-[#202020] flex flex-col sm:flex-row justify-between items-start sm:items-center rounded-md p-2 mb-2"
            >
              <div className="text-sm">
                <p><strong>Nome:</strong> {item.name}</p>
                {item.code && (
                  <p className="text-xs text-gray-400">Código: {item.code}</p>
                )}
                <p className="text-xs text-gray-500">ID: {item.id}</p>
              </div>

              {["university", "course", "discipline", "class", "professor"].includes(entity) && (
                <div className="flex gap-2 mt-2 sm:mt-0">
                  <ButtonCRUD
                    action="update"
                    onClick={() => onEdit(item)}
                    compact={isMobile}
                  />
                  <ButtonCRUD
                    action="delete"
                    onClick={() => handleDeleteAction(item.id)}
                    compact={isMobile}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Modal para quando uma turma for criada */}
      {createdItem && (
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="bg-[#202020] text-white">
            <DialogHeader>
              <DialogTitle>Turma criada com sucesso!</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 mt-2">
              <p><strong>Nome:</strong> {createdItem.name}</p>
              {createdItem.code && <p><strong>Código:</strong> {createdItem.code}</p>}
              <p><strong>ID:</strong> {createdItem.id}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export { FormsList };
