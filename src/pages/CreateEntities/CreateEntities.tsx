import { useAuth } from "@/hooks/use-Auth";
import { logger } from "@/utils/logger";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EntityCreateForm } from "@/components/Entities/Create/EntityCreateForm";
import { Typograph } from "@/components/Typograph/Typograph";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, PlusCircle } from "lucide-react";
import { AppModal } from "@/components/Modals/AppModal";
import { RecentEntityList, RecentItem } from "@/components/Entities/Create/RecentEntityList";
import { academicApi, adminApi } from "@/services/apiClient";
import { AcademicEntityType } from "@/services/api/api_routes";

interface ApiResponse {
  id?: string;
  _id?: string;
  [key: string]: any;
}

export function CreateEntities() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showToast, setShowToast] = useState<"success" | "error" | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<RecentItem | null>(null);


  const createMutation = useMutation({
    mutationFn: async ({ entity, item }: { entity: string; item: any }) => {
      logger.info("Admin", `Enviando ${entity}.`, item);

      let response: ApiResponse;

      if (entity === "professor") {
        const professorPayload = {
          name: item.name,
          email: item.email,
          password: item.password,
          school: item.school,
          courses: item.courses
        };

        logger.info("Admin", "Professor payload para criação.", professorPayload);
        response = await adminApi.createProfessor<ApiResponse>(professorPayload);
      } else if (["university", "course", "class", "discipline"].includes(entity)) {
        response = await academicApi.post<ApiResponse>(entity as AcademicEntityType, item);
      } else {
        throw new Error(`Tipo de entidade desconhecido: ${entity}`);
      }

      return { response, entity, item };
    },
    onSuccess: ({ response, entity, item }) => {
      logger.info("Admin", "Resposta da API.", response);

      const newItem: RecentItem = {
        id: response?.id || response?._id || `temp-${Date.now()}`,
        name: item.name || "Item sem nome",
        type: entity,
        action: "create"
      };

      setRecentItems((prev) => [newItem, ...prev.slice(0, 19)]);

      queryClient.invalidateQueries({ queryKey: ['recentItems'] });
      queryClient.invalidateQueries({ queryKey: ['academicData'] });

      triggerToast("success", "Cadastro realizado com sucesso!");
    },
    onError: (error) => {
      logger.error("Admin", "Erro ao enviar dados.", error);
      triggerToast("error", "Erro ao cadastrar. Verifique o console para mais detalhes.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (item: RecentItem) => {
      if (item.type === "professor") {
        await adminApi.deleteProfessor<ApiResponse>(item.id);
      } else if (["university", "course", "class", "discipline"].includes(item.type)) {
        await academicApi.delete<ApiResponse>(item.type as AcademicEntityType, item.id);
      } else {
        throw new Error(`Tipo de entidade desconhecido: ${item.type}`);
      }
      return item;
    },
    onSuccess: (deletedItem) => {
      setRecentItems((prev) => prev.filter((item) => item.id !== deletedItem.id));

      queryClient.invalidateQueries({ queryKey: ['recentItems'] });
      queryClient.invalidateQueries({ queryKey: ['academicData'] });

      triggerToast("success", "Registro excluído com sucesso.");
    },
    onError: (error) => {
      logger.error("Admin", "Erro ao excluir.", error);
      triggerToast("error", "Erro ao excluir registro.");
    },
    onSettled: () => {
      setConfirmDeleteItem(null);
    }
  });

  if (!user) return null;

  const roles = Array.isArray(user.role) ? user.role : [user.role];
  const isAdmin = roles.includes("admin");
  const isCoordinator = roles.includes("course-coordinator");

  if (!isAdmin && !isCoordinator) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-white">
        <Typograph text="Você não tem permissão para acessar esta página." variant="text3" colorText="text-white" fontFamily="poppins" weight="medium" />
      </div>
    );
  }

  const handleSubmit = async (entity: string, item: any) => {
    createMutation.mutate({ entity, item });
  };

  const handleEdit = async (item: RecentItem) => {
    try {
      const updated: RecentItem = { ...item, action: "update" as "update" };
      setRecentItems((prev) => [updated, ...prev.filter((i) => i.id !== item.id).slice(0, 19)]);
      triggerToast("success", "Item preparado para edição.");
    } catch (error) {
      logger.error("Admin", "Erro ao preparar item para edição.", error);
      triggerToast("error", "Erro ao preparar edição.");
    }
  };

  const handleDelete = (item: RecentItem) => {
    setConfirmDeleteItem(item);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteItem) return;
    deleteMutation.mutate(confirmDeleteItem);
  };

  const triggerToast = (type: "success" | "error", message: string) => {
    setToastMessage(message);
    setShowToast(type);
    setTimeout(() => setShowToast(null), 3000);
  };

  const isLoading = createMutation.isPending || deleteMutation.isPending;

  return (
    <main className="flex-1 overflow-y-auto px-4 py-6 text-white md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 sm:p-6"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-[Poppins] text-2xl font-semibold text-white">
                Criar entidades
              </h1>
              <p className="mt-2 font-[Poppins] text-sm leading-relaxed text-zinc-400">
                Cadastre entidades acadêmicas e usuários vinculados ao sistema.
              </p>
            </div>
          </div>
        </motion.section>

        <motion.div
          key="crud-section"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
        >
          <EntityCreateForm
            onSubmit={handleSubmit}
            initialData={undefined}
            animateForm={true}
          />
        </motion.div>

        <RecentEntityList
          items={recentItems}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={isLoading}
        />
      </div>

      <AnimatePresence>
        {showToast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.3 }}
            className={`fixed top-6 right-6 px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 ${showToast === "success" ? "bg-green-600" : "bg-red-600"}`}
          >
            {showToast === "error" && <AlertTriangle className="w-5 h-5" />}
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AppModal
        isOpen={!!confirmDeleteItem}
        type="delete"
        title="Confirmar exclusão"
        description="Tem certeza que deseja deletar este item?"
        onConfirm={confirmDelete}
        onClose={() => setConfirmDeleteItem(null)}
      />
    </main>
  );
}
