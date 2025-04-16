import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";
import { academicApi } from "@/services/apiClient";

export interface Item {
  id: string | number;
  name: string;
}

export interface FormsListProps {
  items: Item[];
  entity: "university" | "course" | "discipline" | "class" | "professor" | "student";
  onEdit: (item: Item) => void;
  onDelete: (id: string | number) => void;
}

function FormsList({ items, entity, onEdit, onDelete }: FormsListProps) {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleDeleteAction = async (id: string | number) => {
    const confirmed = window.confirm("Tem certeza que deseja deletar?");
    if (!confirmed) return;

    if (
      entity === "university" ||
      entity === "course" ||
      entity === "discipline" ||
      entity === "class"
    ) {
      try {
        await academicApi.delete(entity, id.toString());
        toast.success("Item deletado!");
        onDelete(id);
      } catch (error) {
        toast.error("Erro ao deletar item.");
        console.error("Erro ao deletar item:", error);
      }
    } else {
      onDelete(id);
    }
  };

  return (
    <div className="bg-[#181818] text-white p-4 rounded-md">
      <h2 className="text-xl font-semibold mb-4">
        {entity === "student"
          ? "Alunos"
          : entity === "professor"
            ? "Professores"
            : `${entity.charAt(0).toUpperCase() + entity.slice(1)}s`}{" "}
        encontrad{entity === "university" ? "as" : "os"}:
      </h2>
      <ul>
        {items.map((item) => (
          <li
            key={item.id}
            className="bg-[#202020] flex flex-col sm:flex-row justify-between items-start sm:items-center rounded-md p-2 mb-2"
          >
            <span className="mb-2 sm:mb-0">{item.name}</span>
            {(entity !== "student" && entity !== "professor") && (
              <div className="flex gap-2">
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
  );
}

export { FormsList };
