import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Trash } from "lucide-react";

interface CRUDModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "create" | "update" | "delete";
  title: string;
  children?: React.ReactNode;
  onConfirm?: () => void;
}

export function CRUDModal({ isOpen, onClose, type, title, children, onConfirm }: CRUDModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[672px] h-[450px] bg-[#2a2a2a] text-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <DialogTitle className="text-lg font-bold">
            {type === "create" && "Criar Novo Item"}
            {type === "update" && "Atualizar Item"}
            {type === "delete" && "Confirmar Exclusão"}
          </DialogTitle>
          <DialogClose asChild>
            <Button onClick={onClose} className="text-white">
              <X className="w-5 h-5" />
            </Button>
          </DialogClose>
        </div>

        <DialogDescription className="mt-4">
          {type === "delete" ? (
            <div className="text-center">
              <Trash className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-lg">Tem certeza que deseja excluir este item?</p>
            </div>
          ) : (
            children
          )}
        </DialogDescription>

        {type === "delete" && (
          <div className="flex justify-end gap-4 mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={onConfirm}>
              Excluir
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
