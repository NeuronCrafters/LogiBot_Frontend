import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash,
  List,
  Search,
  Pencil,
  Eye,
  RotateCcw,
} from "lucide-react";

interface EntityActionButtonProps {
  action: "create" | "delete" | "list" | "search" | "update" | "details" | "reload";
  onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  compact?: boolean;
  disabled?: boolean;
}

const actionConfig = {
  create: {
    label: "Criar",
    icon: <Plus className="w-5 h-5" />,
    color: "bg-blue-600 hover:bg-blue-700 border-blue-400/40 shadow-blue-900/30",
  },
  delete: {
    label: "Deletar",
    icon: <Trash className="w-5 h-5" />,
    color: "bg-red-600 hover:bg-red-700 border-red-400/40 shadow-red-900/30",
  },
  list: {
    label: "Listar",
    icon: <List className="w-5 h-5" />,
    color: "bg-white/5 hover:bg-white/10 border-white/10",
  },
  search: {
    label: "Pesquisar",
    icon: <Search className="w-5 h-5" />,
    color: "bg-blue-600 hover:bg-blue-700 border-blue-400/40 shadow-blue-900/30",
  },
  update: {
    label: "Atualizar",
    icon: <Pencil className="w-5 h-5 rounded-md" />,
    color: "bg-amber-600 hover:bg-amber-700 border-amber-400/40 shadow-amber-900/30",
  },
  details: {
    label: "Detalhes",
    icon: <Eye className="w-5 h-5" />,
    color: "bg-indigo-600 hover:bg-indigo-700 border-indigo-400/40 shadow-indigo-900/30",
  },
  reload: {
    label: "Recarregar",
    icon: <RotateCcw className="w-5 h-5" />,
    color: "bg-white/5 hover:bg-white/10 border-white/10",
  },
} as const;

export function EntityActionButton({
  action,
  onClick,
  compact = false,
  disabled = false,
}: EntityActionButtonProps) {
  const { label, icon, color } = actionConfig[action];

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${color} text-white border shadow-md
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        px-4 py-2 flex items-center gap-2 rounded-lg font-[Poppins] text-sm font-semibold transition-colors
        ${compact ? "w-10 h-10 justify-center" : "w-[128px]"}
      `}
    >
      {icon}
      {!compact && label}
    </Button>
  );
}
