import { Button } from "@/components/ui/button";
import { Plus, Trash, List, Search, Pencil, Eye } from "lucide-react";

interface ButtonCRUDProps {
  action: "create" | "delete" | "list" | "search" | "update" | "details";
  onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  compact?: boolean;
  disabled?: boolean;
}

const actionConfig = {
  create: { label: "Criar", icon: <Plus className="w-5 h-5" />, color: "bg-blue-500" },
  delete: { label: "Deletar", icon: <Trash className="w-5 h-5" />, color: "bg-red-500" },
  list: { label: "Listar", icon: <List className="w-5 h-5" />, color: "bg-gray-500" },
  search: { label: "Pesquisar", icon: <Search className="w-5 h-5" />, color: "bg-blue-700" },
  update: { label: "Atualizar", icon: <Pencil className="w-5 h-5 rounded-md" />, color: "bg-yellow-600" },
  details: { label: "Detalhes", icon: <Eye className="w-5 h-5" />, color: "bg-purple-500" },
};

export function ButtonCRUD({
  action,
  onClick,
  compact = false,
  disabled = false,
}: ButtonCRUDProps) {
  const { label, icon, color } = actionConfig[action];

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${color} text-white 
        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:brightness-90"} 
        px-4 py-2 flex items-center gap-2 rounded 
        ${compact ? "w-10 h-10 justify-center" : "w-[112px]"}
      `}
    >
      {icon}
      {!compact && label}
    </Button>
  );
}
