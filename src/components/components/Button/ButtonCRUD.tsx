import { Button } from "@/components/ui/button";
import { Plus, Trash, List, Search, Pencil } from "lucide-react";

interface ButtonCRUDProps {
  action: "create" | "delete" | "list" | "search" | "update";
  onClick: () => void;
}

const actionConfig = {
  create: { label: "Criar", icon: <Plus className="w-5 h-5" />, color: "bg-blue-500" },
  delete: { label: "Deletar", icon: <Trash className="w-5 h-5" />, color: "bg-red-500" },
  list: { label: "Listar", icon: <List className="w-5 h-5" />, color: "bg-gray-500" },
  search: { label: "Buscar", icon: <Search className="w-5 h-5" />, color: "bg-green-500" },
  update: { label: "Atualizar", icon: <Pencil className="w-5 h-5" />, color: "bg-yellow-500" },
};

export function ButtonCRUD({ action, onClick }: ButtonCRUDProps) {
  const { label, icon, color } = actionConfig[action];

  return (
    <Button onClick={onClick} className={`${color} text-white px-4 py-2 flex items-center gap-2 rounded w-[112px]`}>
      {icon}
      {label}
    </Button>
  );
}
