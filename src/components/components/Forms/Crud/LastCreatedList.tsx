import { Typograph } from "@/components/components/Typograph/Typograph";
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";
import { motion } from "framer-motion";
import { AppModal } from "@/components/components/Modal/AppModal";
import { useState } from "react";

export interface RecentItem {
  id: string;
  name: string;
  type: string;
  action: "create" | "update";
}

interface LastCreatedListProps {
  items: RecentItem[];
  onEdit: (item: RecentItem) => void;
  onDelete: (item: RecentItem) => void;
  loading?: boolean;
}

export function LastCreatedList({ items, onEdit, onDelete, loading = false }: LastCreatedListProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RecentItem | null>(null);

  const handleEditClick = (item: RecentItem) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedItem(null);
    setModalOpen(false);
  };

  const confirmEdit = () => {
    if (selectedItem) onEdit(selectedItem);
    closeModal();
  };

  return (
    <>
      <motion.div
        key="recent-list"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4 }}
        className="bg-[#1f1f1f] p-4 rounded-xl shadow-lg border border-white/10"
      >
        <Typograph
          text="Últimos Registros"
          variant="text5"
          fontFamily="poppins"
          weight="semibold"
          colorText="text-white"
        />

        {loading ? (
          <div className="mt-4 h-20 w-full rounded-md bg-white/10 animate-pulse" />
        ) : (
          <ul className="mt-4 space-y-3">
            {items.slice(0, 20).map((item) => (
              <li
                key={`${item.id}-${item.action}`}
                className="flex justify-between items-center bg-[#141414] p-3 rounded-xl border border-white/10"
              >
                <div>
                  <Typograph
                    text={item.name}
                    variant="text5"
                    colorText="text-white"
                    fontFamily="poppins"
                    weight="regular"
                  />
                  <span className="text-xs text-slate-400">
                    {item.action === "update" ? "Editado" : "Criado"} - {item.type}
                  </span>
                </div>
                <div className="flex gap-2">
                  <ButtonCRUD action="update" onClick={() => handleEditClick(item)} compact />
                  <ButtonCRUD action="delete" onClick={() => onDelete(item)} compact />
                </div>
              </li>
            ))}
          </ul>
        )}
      </motion.div>

      <AppModal
        isOpen={modalOpen}
        type="update"
        title="Editar Registro"
        description="Você está prestes a editar os dados deste registro. Deseja continuar?"
        acceptLabel="Salvar Alterações"
        cancelLabel="Cancelar"
        onConfirm={confirmEdit}
        onCancel={closeModal}
        onClose={closeModal}
      >
        {selectedItem && (
          <div className="text-left">
            <Typograph
              text={`ID: ${selectedItem.id}`}
              colorText="text-white"
              variant="text6"
              weight="regular"
              fontFamily="poppins"
            />
            <Typograph
              text={`Nome: ${selectedItem.name}`}
              colorText="text-white"
              variant="text6"
              weight="regular"
              fontFamily="poppins"
            />
            <Typograph
              text={`Tipo: ${selectedItem.type}`}
              colorText="text-white"
              variant="text6"
              weight="regular"
              fontFamily="poppins"
            />
          </div>
        )}
      </AppModal>
    </>
  );
}
