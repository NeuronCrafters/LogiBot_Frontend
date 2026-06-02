import { useAuth } from "@/features/auth/hooks/useAuth";
import { logger } from "@/shared/lib/logger";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EntityCreateForm } from "@/features/admin/components/create/EntityCreateForm";
import { PlusCircle, ShieldOff } from "lucide-react";
import { AppModal } from "@/shared/components/feedback/AppModal";
import { RecentEntityList, RecentItem } from "@/features/admin/components/create/RecentEntityList";
import { academicApi, adminApi } from "@/services/apiClient";
import { AcademicEntityType } from "@/services/api/api_routes";
import { toast } from "@/shared/lib/toast";

interface ApiResponse { id?: string; _id?: string; [key: string]: any; }

export function CreateEntities() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<RecentItem | null>(null);

  const createMutation = useMutation({
    mutationFn: async ({ entity, item }: { entity: string; item: any }) => {
      logger.info("Admin", `Enviando ${entity}.`, item);
      let response: ApiResponse;
      if (entity === "professor") {
        response = await adminApi.createProfessor<ApiResponse>({ name: item.name, email: item.email, password: item.password, school: item.school, courses: item.courses });
      } else if (["university", "course", "class", "discipline"].includes(entity)) {
        response = await academicApi.post<ApiResponse>(entity as AcademicEntityType, item);
      } else {
        throw new Error(`Tipo de entidade desconhecido: ${entity}`);
      }
      return { response, entity, item };
    },
    onSuccess: ({ response, entity, item }) => {
      const newItem: RecentItem = { id: response?.id || response?._id || `temp-${Date.now()}`, name: item.name || "Item sem nome", type: entity, action: "create" };
      setRecentItems((prev) => [newItem, ...prev.slice(0, 19)]);
      queryClient.invalidateQueries({ queryKey: ["recentItems"] });
      queryClient.invalidateQueries({ queryKey: ["academicData"] });
      toast.success("Cadastro realizado com sucesso!");
    },
    onError: (error) => { logger.error("Admin", "Erro ao enviar dados.", error); toast.error("Erro ao cadastrar. Verifique os dados e tente novamente."); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (item: RecentItem) => {
      if (item.type === "professor") await adminApi.deleteProfessor<ApiResponse>(item.id);
      else if (["university", "course", "class", "discipline"].includes(item.type)) await academicApi.delete<ApiResponse>(item.type as AcademicEntityType, item.id);
      else throw new Error(`Tipo de entidade desconhecido: ${item.type}`);
      return item;
    },
    onSuccess: (deletedItem) => { setRecentItems((prev) => prev.filter((i) => i.id !== deletedItem.id)); queryClient.invalidateQueries({ queryKey: ["recentItems"] }); queryClient.invalidateQueries({ queryKey: ["academicData"] }); toast.success("Registro excluído com sucesso."); },
    onError: (error) => { logger.error("Admin", "Erro ao excluir.", error); toast.error("Erro ao excluir registro."); },
    onSettled: () => setConfirmDeleteItem(null),
  });

  if (!user) return null;

  const roles = Array.isArray(user.role) ? user.role : [user.role];
  const isAdmin = roles.includes("admin");
  const isCoordinator = roles.includes("course-coordinator");

  if (!isAdmin && !isCoordinator) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-zinc-600"><ShieldOff className="h-6 w-6" /></div>
        <p className="font-[Poppins] text-sm text-zinc-500">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  const handleSubmit = (entity: string, item: any) => createMutation.mutate({ entity, item });
  const handleEdit = (item: RecentItem) => { const updated: RecentItem = { ...item, action: "update" }; setRecentItems((prev) => [updated, ...prev.filter((i) => i.id !== item.id).slice(0, 19)]); toast("Item movido para edição."); };
  const handleDelete = (item: RecentItem) => setConfirmDeleteItem(item);
  const isLoading = createMutation.isPending || deleteMutation.isPending;

  return (
    <main className="flex-1 overflow-y-auto px-4 py-6 text-white md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <section className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400"><PlusCircle className="h-5 w-5" /></div>
            <div>
              <h1 className="font-[Poppins] text-2xl font-semibold text-white">Criar entidades</h1>
              <p className="mt-1 font-[Poppins] text-sm leading-relaxed text-zinc-400">Cadastre universidades, cursos, turmas, disciplinas e professores.</p>
            </div>
          </div>
        </section>

        <EntityCreateForm onSubmit={handleSubmit} initialData={undefined} animateForm={true} />
        <RecentEntityList items={recentItems} onEdit={handleEdit} onDelete={handleDelete} loading={isLoading} />
      </div>

      <AppModal isOpen={!!confirmDeleteItem} type="delete" title="Confirmar exclusão" description={`Tem certeza que deseja excluir "${confirmDeleteItem?.name}"? Esta ação não pode ser desfeita.`} onConfirm={() => confirmDeleteItem && deleteMutation.mutate(confirmDeleteItem)} onClose={() => setConfirmDeleteItem(null)} disabled={deleteMutation.isPending} />
    </main>
  );
}
