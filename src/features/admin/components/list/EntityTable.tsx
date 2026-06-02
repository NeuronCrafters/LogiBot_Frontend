import { useEffect, useState } from "react";
import { logger } from "@/shared/lib/logger";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Pencil, Trash2, AlertCircle, RefreshCw } from "lucide-react";
import { AppModal } from "@/shared/components/feedback/AppModal";
import { toast } from "@/shared/lib/toast";
import { adminApi } from "@/services/apiClient";
import { CoordinatorRoleSection } from "./CoordinatorRoleSection";

export interface ListItem {
  id: string;
  name: string;
  code?: string;
  roles?: string[];
  courseId?: string;
  classId?: string;
}

export type EntityType = "university" | "course" | "discipline" | "class" | "professor" | "student";

interface EntityTableProps {
  entity: EntityType;
  items: ListItem[];
  onEdit: (item: ListItem) => void;
  onDelete: (id: string) => void;
}

const ROLE_LABEL: Record<string, string> = { "course-coordinator": "Coordenador", professor: "Professor", student: "Aluno", admin: "Administrador" };
function translateRole(r: string): string { return ROLE_LABEL[r] ?? r; }

function RowSkeleton({ cols }: { cols: number }) {
  const widths = ["w-8", "w-48", "w-40", "w-24", "w-16"];
  return (
    <tr className="border-b border-white/5">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3"><div className={`h-4 animate-pulse rounded-md bg-white/5 ${widths[i] ?? "w-28"}`} /></td>
      ))}
    </tr>
  );
}

export function EntityTable({ entity, items, onEdit, onDelete }: EntityTableProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<ListItem | null>(null);
  const [addCoord, setAddCoord] = useState(false);
  const [removeCoord, setRemoveCoord] = useState(false);
  const [newCoordinator, setNewCoordinator] = useState("");
  const [loading, setLoading] = useState(true);

  const hasPeopleColumns = entity === "professor" || entity === "student";

  const { data: candidates = [], isLoading: loadingCandidates, error: candidatesError, refetch: refetchCandidates } = useQuery({
    queryKey: ["professors", "candidates", editItem?.courseId],
    queryFn: async () => {
      if (!editItem?.courseId) return [];
      const result = await adminApi.listProfessorsByCourse<any[]>(editItem.courseId);
      return result.filter((p) => p._id !== editItem.id && !p.role?.includes("course-coordinator")).map((p) => ({ id: p._id, name: p.name, courseId: editItem.courseId }));
    },
    enabled: !!editItem?.courseId && removeCoord,
    staleTime: 2 * 60 * 1000, retry: 1,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (entity === "student") await adminApi.deleteStudent(id);
      else if (entity === "professor") await adminApi.deleteProfessor(id);
      return { id };
    },
    onSuccess: (data) => { onDelete(data.id); setDeleteId(null); queryClient.invalidateQueries({ queryKey: ["recentItems"] }); queryClient.invalidateQueries({ queryKey: ["academicData"] }); queryClient.invalidateQueries({ queryKey: ["searchEntities"] }); },
    onError: (error) => { logger.error("Admin", "Erro ao deletar.", error); toast.error("Erro ao excluir registro."); },
  });

  const updateCoordinatorMutation = useMutation({
    mutationFn: async ({ action, currentId, newCoordinatorId }: { action: "add" | "remove" | "swap"; currentId: string; newCoordinatorId?: string }) => {
      if (action === "add") return adminApi.updateProfessorRole(currentId, "add");
      if (action === "remove" && !newCoordinatorId) return adminApi.updateProfessorRole(currentId, "remove");
      if (action === "swap" && newCoordinatorId) { await adminApi.updateProfessorRole(currentId, "remove"); return adminApi.updateProfessorRole(newCoordinatorId, "add"); }
      throw new Error("Ação inválida ou dados incompletos.");
    },
    onSuccess: () => { toast.success("Cargo atualizado com sucesso!"); setEditItem(null); resetForm(); queryClient.invalidateQueries({ queryKey: ["professors"] }); queryClient.invalidateQueries({ queryKey: ["academicData"] }); queryClient.invalidateQueries({ queryKey: ["searchEntities"] }); },
    onError: (error: any) => { logger.error("Admin", "Erro ao atualizar coordenador.", error); toast.error(error?.response?.data?.message ?? "Erro ao atualizar cargo."); },
  });

  useEffect(() => { setLoading(true); const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t); }, [items]);
  useEffect(() => { if (candidatesError) toast.error("Erro ao carregar lista de professores."); }, [candidatesError]);

  if (!user) return null;

  const userRoles = Array.isArray(user.role) ? user.role : [user.role];
  const isAdmin = userRoles.includes("admin");
  const colCount = hasPeopleColumns ? (isAdmin ? 5 : 4) : isAdmin ? 4 : 3;
  const headerSecondary = entity === "discipline" ? "Código" : hasPeopleColumns ? "E-mail" : "ID";

  const resetForm = () => { setAddCoord(false); setRemoveCoord(false); setNewCoordinator(""); };
  const handleEdit = (item: ListItem) => { resetForm(); setEditItem(item); onEdit(item); };
  const alreadyIsCoordinator = !!editItem?.roles?.some((r) => r === "Coordenador de Curso" || r === "course-coordinator");
  const confirmDisabled = (!addCoord && !removeCoord) || (addCoord && alreadyIsCoordinator) || (removeCoord && !alreadyIsCoordinator) || updateCoordinatorMutation.isPending;

  const handleConfirmCoordinator = () => {
    if (!editItem) return;
    if (addCoord) updateCoordinatorMutation.mutate({ action: "add", currentId: editItem.id });
    else if (removeCoord && newCoordinator) updateCoordinatorMutation.mutate({ action: "swap", currentId: editItem.id, newCoordinatorId: newCoordinator });
    else if (removeCoord) updateCoordinatorMutation.mutate({ action: "remove", currentId: editItem.id });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1f1f1f] shadow-lg shadow-black/10">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
        <div>
          <p className="font-[Poppins] text-sm font-semibold text-white capitalize">
            {entity === "university" ? "Universidades" : entity === "course" ? "Cursos" : entity === "discipline" ? "Disciplinas" : entity === "class" ? "Turmas" : entity === "professor" ? "Professores" : "Alunos"}
          </p>
          <p className="mt-0.5 font-[Poppins] text-xs text-zinc-600">{items.length} {items.length === 1 ? "registro" : "registros"}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="w-12 px-5 py-3 text-left font-[Poppins] text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Nº</th>
              <th className="px-5 py-3 text-left font-[Poppins] text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Nome</th>
              <th className="px-5 py-3 text-left font-[Poppins] text-[10px] font-semibold uppercase tracking-wider text-zinc-600">{headerSecondary}</th>
              {hasPeopleColumns && <th className="px-5 py-3 text-left font-[Poppins] text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Cargo</th>}
              {isAdmin && <th className="px-5 py-3 text-right font-[Poppins] text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} cols={colCount} />) : (
              items.map((item, idx) => (
                <tr key={item.id || `row-${idx}`} className="group border-b border-white/5 last:border-0 transition-colors hover:bg-white/[0.03]">
                  <td className="px-5 py-3.5 font-[Poppins] text-xs text-zinc-600">{idx + 1}</td>
                  <td className="px-5 py-3.5 font-[Poppins] text-sm font-medium text-zinc-200">{item.name}</td>
                  <td className="max-w-[180px] truncate px-5 py-3.5 font-[Poppins] text-sm text-zinc-500">{item.code ?? item.id}</td>
                  {hasPeopleColumns && (
                    <td className="px-5 py-3.5">
                      {item.roles && item.roles.length > 0 ? (
                        <div className="flex flex-wrap gap-1">{item.roles.map((r) => <span key={r} className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-[Poppins] text-xs text-zinc-400">{translateRole(r)}</span>)}</div>
                      ) : <span className="font-[Poppins] text-sm text-zinc-700">—</span>}
                    </td>
                  )}
                  {isAdmin && (
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                        {entity === "professor" && <button onClick={() => handleEdit(item)} disabled={updateCoordinatorMutation.isPending} title="Editar cargo" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-400 disabled:opacity-40"><Pencil className="h-3.5 w-3.5" /></button>}
                        <button onClick={() => setDeleteId(item.id)} disabled={deleteMutation.isPending} title="Excluir" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AppModal isOpen={!!deleteId} type="delete" title="Confirmar exclusão" description="Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita." onClose={() => setDeleteId(null)} onCancel={() => setDeleteId(null)} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} acceptLabel={deleteMutation.isPending ? "Excluindo..." : "Excluir"} />

      <AppModal isOpen={!!editItem} type="update" title="Gerenciar cargo" description={`Alterar o cargo de coordenador para: ${editItem?.name}`} onClose={() => { setEditItem(null); resetForm(); }} onConfirm={handleConfirmCoordinator} acceptLabel={updateCoordinatorMutation.isPending ? "Salvando..." : "Confirmar"} cancelLabel="Cancelar" disabled={confirmDisabled}>
        <div className="space-y-3">
          {loadingCandidates && removeCoord && <div className="flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3"><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-400/30 border-t-blue-400" /><p className="font-[Poppins] text-sm text-blue-300">Carregando candidatos...</p></div>}
          {candidatesError && removeCoord && (
            <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
              <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-red-400" /><p className="font-[Poppins] text-sm text-red-400">Erro ao carregar candidatos.</p></div>
              <button onClick={() => refetchCandidates()} className="flex items-center gap-1 font-[Poppins] text-xs text-red-300 hover:text-red-200"><RefreshCw className="h-3 w-3" />Tentar</button>
            </div>
          )}
          <CoordinatorRoleSection alreadyIsCoordinator={alreadyIsCoordinator} addCoord={addCoord} removeCoord={removeCoord} newCoordinator={newCoordinator} candidates={candidates} currentCourseId={editItem?.courseId ?? (candidates[0]?.courseId ?? "")} onAddChange={setAddCoord} onRemoveChange={setRemoveCoord} onCoordinatorChange={setNewCoordinator} />
        </div>
      </AppModal>
    </div>
  );
}
