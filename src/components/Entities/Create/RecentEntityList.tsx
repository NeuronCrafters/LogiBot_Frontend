import { Typograph } from "@/components/Typograph/Typograph";
import { EntityActionButton } from "@/components/Buttons/EntityActionButton";
import { motion } from "framer-motion";
import { AppModal } from "@/components/Modals/AppModal";
import { useState } from "react";

export interface RecentItem {
  id: string;
  name: string;
  type: string;
  action: "create" | "update";
}

interface RecentEntityListProps {
  items: RecentItem[];
  onEdit: (item: RecentItem) => void;
  onDelete?: (item: RecentItem) => void;
  loading?: boolean;
}

export function RecentEntityList({ items, onEdit, loading = false }: RecentEntityListProps) {
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

  const generateUniqueKey = (item: RecentItem, index: number): string => {
    const itemId = item.id || `no-id-${index}`;

    return `${itemId}-${item.action}-${Date.now()}-${index}`;
  };

  return (
    <>
      <motion.div
        key="recent-list"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 sm:p-6"
      >
        <Typograph
          text="Últimos Registros"
          variant="text5"
          fontFamily="poppins"
          weight="semibold"
          colorText="text-white"
        />

        {loading ? (
          <div className="mt-4 h-20 w-full animate-pulse rounded-xl bg-white/10" />
        ) : items.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-neutral-950/60 p-5 text-center text-zinc-500">
            <p className="font-[Poppins] text-sm">Nenhum registro encontrado</p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {items.slice(0, 20).map((item, index) => (
              <li
                key={generateUniqueKey(item, index)}
                className="flex min-h-[60px] items-center justify-between rounded-xl border border-white/10 bg-neutral-950/60 p-3 transition-colors hover:bg-white/5"
              >
                <div className="flex-1 min-w-0 pr-3">
                  <div className="overflow-x-auto overflow-y-hidden" style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(255,255,255,0.1) transparent'
                  }}>
                    <div className="min-w-max">
                      <Typograph
                        text={item.name || "Sem nome"}
                        variant="text5"
                        colorText="text-white"
                        fontFamily="poppins"
                        weight="regular"
                      />
                      <div className="whitespace-nowrap">
                        <span className="text-xs text-slate-400">
                          {item.action === "update" ? "Editado" : "Criado"} - {item.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-shrink-0 gap-2">
                  <EntityActionButton action="update" onClick={() => handleEditClick(item)} compact />
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
              text={`ID: ${selectedItem.id || "Não definido"}`}
              colorText="text-white"
              variant="text6"
              weight="regular"
              fontFamily="poppins"
            />
            <Typograph
              text={`Nome: ${selectedItem.name || "Sem nome"}`}
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
