import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { CoordinatorRoleSection } from "@/components/components/Forms/Lists/CoordinatorRoleSection";
import { Skeleton } from "@/components/ui/skeleton";

export interface ListItem {
  id: string;
  name: string;
  code?: string;
  roles?: string[];
  courseId?: string;
  classId?: string;
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
  const queryClient = useQueryClient();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<ListItem | null>(null);
  const [addCoord, setAddCoord] = useState(false);
  const [removeCoord, setRemoveCoord] = useState(false);
  const [newCoordinator, setNewCoordinator] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const {
    data: candidates = [],
    isLoading: loadingCandidates,
    error: candidatesError,
    refetch: refetchCandidates
  } = useQuery({
    queryKey: ['professors', 'candidates', editItem?.courseId],

    queryFn: async () => {

      if (!editItem?.courseId) return [];

      try {

        const result = await adminApi.listProfessorsByCourse<any[]>(editItem.courseId);

        const filtered = result.filter(
          (prof) => prof._id !== editItem.id && !prof.role?.includes("course-coordinator")
        );

        return filtered.map((p) => ({
          id: p._id,
          name: p.name,
          courseId: editItem.courseId
        }));
      } catch (error) {
        console.error("Erro ao carregar candidatos:", error);
        throw new Error("Falha ao carregar candidatos a coordenador");
      }
    },

    enabled: !!editItem?.courseId && removeCoord,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (entity === "student") {
        await adminApi.deleteStudent(id);
      } else if (entity === "professor") {
        await adminApi.deleteProfessor(id);
      }
      return { id };
    },
    onSuccess: (data) => {
      onDelete(data.id);
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['recentItems'] });
      queryClient.invalidateQueries({ queryKey: ['academicData'] });
      queryClient.invalidateQueries({ queryKey: ['searchEntities'] });
    },
    onError: (error) => {
      console.error("Erro ao deletar:", error);
      toast.error("Erro ao deletar registro.");
    }
  });

  const updateCoordinatorMutation = useMutation({
    mutationFn: async ({
      action,
      currentId,
      newCoordinatorId
    }: {
      action: 'add' | 'remove' | 'swap',
      currentId: string,
      newCoordinatorId?: string
    }) => {

      if (action === 'add') {
        return await adminApi.updateProfessorRole(currentId, 'add');
      }

      if (action === 'remove' && !newCoordinatorId) {
        return await adminApi.updateProfessorRole(currentId, 'remove');
      }

      if (action === 'swap' && newCoordinatorId) {
        await adminApi.updateProfessorRole(currentId, 'remove');
        return await adminApi.updateProfessorRole(newCoordinatorId, 'add');
      }

      throw new Error("Ação inválida ou dados incompletos.");
    },
    onSuccess: () => {
      toast.success("Cargo atualizado com sucesso!");
      setEditItem(null);
      resetCoordinatorForm();
      queryClient.invalidateQueries({ queryKey: ['professors'] });
      queryClient.invalidateQueries({ queryKey: ['academicData'] });
      queryClient.invalidateQueries({ queryKey: ['searchEntities'] });
    },
    onError: (error: any) => {
      console.error("Erro ao atualizar coordenador:", error);
      const msg = error?.response?.data?.message || "Erro ao atualizar cargo.";
      toast.error(msg);
    }
  });

  useEffect(() => {
    setLoading(true);
    const delay = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(delay);
  }, [items]);

  useEffect(() => {
    if (candidatesError) {
      toast.error("Erro ao carregar lista de professores");
    }
  }, [candidatesError]);

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
    if (deleteId) deleteMutation.mutate(deleteId);
  };

  const handleCancelDelete = () => {
    setDeleteId(null);
    toast("Ação de deleção cancelada.");
  };

  const handleEdit = (item: ListItem) => {
    console.log("ID da Turma:", item.classId);
    resetCoordinatorForm();
    setEditItem(item);
    onEdit(item);
  };

  const resetCoordinatorForm = () => {
    setAddCoord(false);
    setRemoveCoord(false);
    setNewCoordinator("");
  };

  const handleConfirmCoordinator = () => {
    if (!editItem) return;

    if (addCoord) {
      updateCoordinatorMutation.mutate({
        action: 'add',
        currentId: editItem.id
      });
    } else if (removeCoord && newCoordinator) {
      updateCoordinatorMutation.mutate({
        action: 'swap',
        currentId: editItem.id,
        newCoordinatorId: newCoordinator
      });
    } else if (removeCoord && !newCoordinator) {
      updateCoordinatorMutation.mutate({
        action: 'remove',
        currentId: editItem.id
      });
    }
  };

  const alreadyIsCoordinator = !!editItem?.roles?.some(r => r === "Coordenador de Curso" || r === "course-coordinator");

  const confirmDisabled = (!addCoord && !removeCoord) ||
    (addCoord && alreadyIsCoordinator) ||
    (removeCoord && (!alreadyIsCoordinator || (removeCoord && newCoordinator === "" && false))) || // mude o false para true se obrigar a ter novo coord
    updateCoordinatorMutation.isPending;

  return (
    <motion.div
      className="bg-[#1f1f1f] border border-white/10 rounded-xl p-4 shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-white">Nº</TableHead>
            <TableHead className="text-white">Nome</TableHead>
            <TableHead className="text-white text-ce">{headerLabel}</TableHead>
            {(entity === "professor" || entity === "student") && (
              <TableHead className="text-white">Ocupação</TableHead>
            )}
            {isAdmin && <TableHead className="text-center text-white">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence>
            {loading ? (
              [...Array(3)].map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell colSpan={5}>
                    <Skeleton className="w-full h-10 rounded-md bg-white/10" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length > 0 ? (
              items.map((item, idx) => (
                <motion.tr
                  key={item.id || `row-${idx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="transition-colors duration-200 hover:bg-[#141414]"
                >
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.code ?? item.id}</TableCell>
                  {(entity === "professor" || entity === "student") && (
                    <TableCell>
                      {item.roles?.map(r => r === 'course-coordinator' ? 'Coordenador' : r).join(", ") ?? "—"}
                    </TableCell>
                  )}
                  <TableCell className="text-center">
                    <div className="inline-flex justify-center gap-2">
                      {isAdmin && entity === "professor" && (
                        <ButtonCRUD
                          action="update"
                          onClick={() => handleEdit(item)}
                          compact
                          disabled={updateCoordinatorMutation.isPending}
                        />
                      )}
                      {isAdmin && (
                        <ButtonCRUD
                          action="delete"
                          onClick={() => setDeleteId(item.id)}
                          compact
                          disabled={deleteMutation.isPending}
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
        onClose={() => {
          setEditItem(null);
          resetCoordinatorForm();
        }}
        onConfirm={handleConfirmCoordinator}
        acceptLabel={updateCoordinatorMutation.isPending ? "Salvando..." : "Confirmar"}
        cancelLabel="Cancelar"
        disabled={confirmDisabled}
      >
        <div className="space-y-4">
          {loadingCandidates && removeCoord && (
            <div className="p-3 border rounded-lg bg-blue-600/20 border-blue-600/50">
              <p className="text-sm text-blue-300">Carregando candidatos...</p>
            </div>
          )}

          {candidatesError && removeCoord && (
            <div className="p-3 border rounded-lg bg-red-600/20 border-red-600/50">
              <p className="text-sm text-red-300">Erro ao carregar candidatos.</p>
              <button onClick={() => refetchCandidates()} className="text-red-200 underline">Tentar novamente</button>
            </div>
          )}

          <CoordinatorRoleSection
            alreadyIsCoordinator={!!alreadyIsCoordinator}
            addCoord={addCoord}
            removeCoord={removeCoord}
            newCoordinator={newCoordinator}
            candidates={candidates}
            currentCourseId={editItem?.courseId || (candidates[0] ? candidates[0].courseId : "")}
            onAddChange={setAddCoord}
            onRemoveChange={setRemoveCoord}
            onCoordinatorChange={setNewCoordinator}
          />
        </div>
      </AppModal>
    </motion.div>
  );
}