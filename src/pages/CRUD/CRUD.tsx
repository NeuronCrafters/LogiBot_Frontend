import { useAuth } from "@/hooks/use-Auth";
import { useState } from "react";
import { FormsCrud } from "@/components/components/Forms/Crud/FormsCrud";
import { Header } from "@/components/components/Header/Header";
import { Avatar } from "@/components/components/Avatar/Avatar";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { AppModal } from "@/components/components/Modal/AppModal";
import { LastCreatedList, RecentItem } from "@/components/components/Forms/Crud/LastCreatedList";
import { academicApi, adminApi } from "@/services/apiClient";
import { AcademicEntityType } from "@/services/api/api_routes";

interface ApiResponse {
  id?: string;
  _id?: string;
  [key: string]: any;
}

export function CRUD() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showToast, setShowToast] = useState<"success" | "error" | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<RecentItem | null>(null);

  if (!user) return null;

  const roles = Array.isArray(user.role) ? user.role : [user.role];
  const isAdmin = roles.includes("admin");
  const isCoordinator = roles.includes("course-coordinator");

  if (!isAdmin && !isCoordinator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#141414] text-white">
        <Typograph text="Você não tem permissão para acessar esta página." variant="text3" colorText="text-white" fontFamily="poppins" weight="medium" />
      </div>
    );
  }

  const handleSubmit = async (entity: string, item: any) => {
    setLoading(true);
    try {
      console.log(`Enviando ${entity}:`, item);

      let response: ApiResponse;

      if (entity === "professor") {
        response = await adminApi.createProfessor<ApiResponse>(item);
      } else if (["university", "course", "class", "discipline"].includes(entity)) {
        response = await academicApi.post<ApiResponse>(entity as AcademicEntityType, item);
      } else {
        throw new Error(`Tipo de entidade desconhecido: ${entity}`);
      }

      console.log("Resposta da API:", response);

      const newItem: RecentItem = {
        id: response?.id || response?._id || `temp-${Date.now()}`,
        name: item.name || "Item sem nome",
        type: entity,
        action: "create"
      };

      setRecentItems((prev) => [newItem, ...prev.slice(0, 19)]);
      triggerToast("success", "Cadastro realizado com sucesso!");

    } catch (error) {
      console.error("Erro ao enviar dados:", error);
      triggerToast("error", "Erro ao cadastrar. Verifique o console para mais detalhes.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (item: RecentItem) => {
    try {
      const updated: RecentItem = { ...item, action: "update" as "update" };
      setRecentItems((prev) => [updated, ...prev.filter((i) => i.id !== item.id).slice(0, 19)]);
      triggerToast("success", "Item preparado para edição.");
    } catch (error) {
      console.error("Erro ao preparar item para edição:", error);
      triggerToast("error", "Erro ao preparar edição.");
    }
  };

  const handleDelete = (item: RecentItem) => {
    setConfirmDeleteItem(item);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteItem) return;

    setLoading(true);
    try {
      if (confirmDeleteItem.type === "professor") {
        await adminApi.deleteProfessor<ApiResponse>(confirmDeleteItem.id);
      } else if (["university", "course", "class", "discipline"].includes(confirmDeleteItem.type)) {
        await academicApi.delete<ApiResponse>(confirmDeleteItem.type as AcademicEntityType, confirmDeleteItem.id);
      } else {
        throw new Error(`Tipo de entidade desconhecido: ${confirmDeleteItem.type}`);
      }

      setRecentItems((prev) => prev.filter((item) => item.id !== confirmDeleteItem.id));
      triggerToast("success", "Registro excluído com sucesso.");
    } catch (error) {
      console.error("Erro ao excluir:", error);
      triggerToast("error", "Erro ao excluir registro.");
    } finally {
      setConfirmDeleteItem(null);
      setLoading(false);
    }
  };

  const triggerToast = (type: "success" | "error", message: string) => {
    setToastMessage(message);
    setShowToast(type);
    setTimeout(() => setShowToast(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white relative">
      <div className="absolute bg-[#141414] w-full flex items-center gap-4 border-b border-neutral-800 px-8 py-4 z-10">
        <Typograph text="Cadastro" colorText="text-white" variant="text2" weight="bold" fontFamily="poppins" />
        {user && (
          <div className="ml-auto">
            <Button onClick={() => setMenuOpen(true)} className="p-0 flex items-center justify-center">
              <div className="rainbow-avatar w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center">
                <Avatar seed={user._id} backgroundColor="#141414" className="w-full h-full rounded-full" />
              </div>
            </Button>
          </div>
        )}
      </div>

      <Header isOpen={menuOpen} closeMenu={() => setMenuOpen(false)} />

      <div className="w-full flex flex-col pt-24 px-4 sm:px-6 lg:px-8 gap-6 max-w-screen-md mx-auto">
        <motion.div
          key="crud-section"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
        >
          <FormsCrud
            onSubmit={handleSubmit}
            initialData={undefined}
            animateForm={true}
          />
        </motion.div>

        <LastCreatedList
          items={recentItems}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
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
    </div>
  );
}