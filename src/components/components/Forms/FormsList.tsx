import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-Auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion, AnimatePresence } from "framer-motion";
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";
import { AppModal } from "@/components/components/Modal/AppModal";
import { toast } from "react-hot-toast";
import { adminApi } from "@/services/apiClient";
import { CoordinatorRoleSection } from "@/components/components/Forms/CoordinatorRoleSection";

export interface ListItem {
  id: string;
  name: string;
  code?: string;
  roles?: string[];
  courseId?: string;
}

export type EntityType =
  | "university"
  | "course"
  | "discipline"
  | "class"
  | "professor"
  | "student";

interface FormsListProps {
  entity: EntityType;
  items: ListItem[];
  onEdit: (item: ListItem) => void;
  onDelete: (id: string) => void;
}

export function FormsList({ entity, items, onEdit, onDelete }: FormsListProps) {
  const { user } = useAuth();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<ListItem | null>(null);
  const [addCoord, setAddCoord] = useState(false);
  const [removeCoord, setRemoveCoord] = useState(false);
  const [newCoordinator, setNewCoordinator] = useState<string>("");
  const [candidates, setCandidates] = useState<ListItem[]>([]);

  useEffect(() => {
    const fetchCandidates = async () => {
      if (editItem && editItem.code) {
        try {
          const result = await adminApi.listProfessorsByCourse<any[]>(editItem.code);
          const filtered = result.filter(
            (prof) => prof._id !== editItem.id && !prof.role?.includes("course-coordinator")
          );
          setCandidates(filtered.map((p) => ({ id: p._id, name: p.name })));
        } catch (err) {
          console.error("Erro ao carregar candidatos a coordenador:", err);
        }
      }
    };

    if (removeCoord) {
      fetchCandidates();
    }
  }, [editItem, removeCoord]);

  if (!user) return null;

  const userRoles = Array.isArray(user.role) ? user.role : [user.role];
  const isAdmin = userRoles.includes("admin");

  const headerLabel =
    entity === "discipline"
      ? "Código"
      : entity === "professor" || entity === "student"
        ? "Email"
        : "ID";

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      toast.success("Registro deletado com sucesso!");
      setDeleteId(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteId(null);
    toast("Ação de deleção cancelada.");
  };

  const handleEdit = (item: ListItem) => {
    setAddCoord(false);
    setRemoveCoord(false);
    setNewCoordinator("");
    setEditItem(item);
    onEdit(item);
  };

  const alreadyIsCoordinator = !!editItem?.roles?.includes("Coordenador de Curso");
  const confirmDisabled = (!addCoord && !removeCoord) ||
    (addCoord && alreadyIsCoordinator) ||
    (removeCoord && (!alreadyIsCoordinator || newCoordinator.trim() === ""));

  return (
    <motion.div
      className="bg-[#181818] border border-neutral-700 rounded-2xl p-4 shadow-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-white">Nª</TableHead>
            <TableHead className="text-white">Nome</TableHead>
            <TableHead className="text-white">{headerLabel}</TableHead>
            {(entity === "professor" || entity === "student") && (
              <TableHead className="text-white">Ocupação</TableHead>
            )}
            <TableHead className="text-center text-white">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence>
            {items.length > 0 ? (
              items.map((item, idx) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="transition-colors duration-200 hover:bg-[#2a2a2a]"
                >
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.code ?? item.id}</TableCell>
                  {(entity === "professor" || entity === "student") && (
                    <TableCell>{item.roles?.join(", ") ?? "—"}</TableCell>
                  )}
                  <TableCell className="text-center">
                    <div className="inline-flex gap-2 justify-center">
                      {isAdmin && entity === "professor" && (
                        <ButtonCRUD
                          action="update"
                          onClick={() => handleEdit(item)}
                          compact
                        />
                      )}
                      {isAdmin && (
                        <ButtonCRUD
                          action="delete"
                          onClick={() => setDeleteId(item.id)}
                          compact
                        />
                      )}
                    </div>
                  </TableCell>
                </motion.tr>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={(entity === "professor" || entity === "student") ? 5 : 4}
                  className="text-center text-gray-500"
                >
                  Nenhum {entity} encontrado.
                </TableCell>
              </TableRow>
            )}
          </AnimatePresence>
        </TableBody>
      </Table>

      <AppModal
        isOpen={!!deleteId}
        type="delete"
        title="Confirmar Deleção"
        description="Tem certeza que deseja deletar este registro?"
        onClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />

      <AppModal
        isOpen={!!editItem}
        type="update"
        title="Editar Registro"
        description={`Você está editando: ${editItem?.name}`}
        onClose={() => setEditItem(null)}
        onConfirm={() => {
          setEditItem(null);
          toast.success("Cargo atualizado com sucesso!");
        }}
        acceptLabel="Confirmar"
        cancelLabel="Cancelar"
        disabled={confirmDisabled}
      >
        <CoordinatorRoleSection
          alreadyIsCoordinator={!!alreadyIsCoordinator}
          addCoord={addCoord}
          removeCoord={removeCoord}
          newCoordinator={newCoordinator}
          candidates={candidates}
          currentCourseId={editItem?.courseId ?? ""}
          onAddChange={setAddCoord}
          onRemoveChange={setRemoveCoord}
          onCoordinatorChange={setNewCoordinator}
        />
      </AppModal>
    </motion.div>
  );
}