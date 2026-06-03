import { AppModal } from "@/shared/components/feedback/AppModal";
import { useState } from "react";
import { BookOpen, GraduationCap, Library, Pencil, School, Users } from "lucide-react";

export interface RecentItem {
  id: string;
  name: string;
  type: string;
  action: "create" | "update";
  registrationCode?: string;
}

interface RecentEntityListProps {
  items: RecentItem[];
  onEdit: (item: RecentItem) => void;
  onDelete?: (item: RecentItem) => void;
  loading?: boolean;
}

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  university: { label: "Universidade", icon: <School className="h-3.5 w-3.5" />, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  course: { label: "Curso", icon: <BookOpen className="h-3.5 w-3.5" />, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  class: { label: "Turma", icon: <Users className="h-3.5 w-3.5" />, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
  discipline: { label: "Disciplina", icon: <Library className="h-3.5 w-3.5" />, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  professor: { label: "Professor", icon: <GraduationCap className="h-3.5 w-3.5" />, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
};

function TypeBadge({ type }: { type: string }) {
  const meta = TYPE_META[type];
  if (!meta) return <span className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-[Poppins] text-[10px] text-zinc-500">{type}</span>;
  return <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-[Poppins] text-[10px] font-medium ${meta.color}`}>{meta.icon}{meta.label}</span>;
}

export function RecentEntityList({ items, onEdit, loading = false }: RecentEntityListProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RecentItem | null>(null);

  const handleEditClick = (item: RecentItem) => { setSelectedItem(item); setModalOpen(true); };
  const closeModal = () => { setSelectedItem(null); setModalOpen(false); };
  const confirmEdit = () => { if (selectedItem) onEdit(selectedItem); closeModal(); };

  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-[#1f1f1f] shadow-lg shadow-black/10">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <div>
            <p className="font-[Poppins] text-sm font-semibold text-white">Registros recentes</p>
            <p className="mt-0.5 font-[Poppins] text-xs text-zinc-600">Últimos cadastros realizados nesta sessão</p>
          </div>
          {items.length > 0 && <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-[Poppins] text-xs text-zinc-400">{items.length}</span>}
        </div>

        <div className="p-5">
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-white/5 bg-neutral-950/40 p-3">
                  <div className="h-8 w-8 animate-pulse rounded-lg bg-white/5" />
                  <div className="flex-1 space-y-1.5"><div className="h-3.5 w-40 animate-pulse rounded-md bg-white/5" /><div className="h-3 w-20 animate-pulse rounded-md bg-white/5" /></div>
                </div>
              ))}
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-dashed border-white/10 text-zinc-700"><Library className="h-5 w-5" /></div>
              <div className="text-center"><p className="font-[Poppins] text-sm font-medium text-zinc-500">Nenhum cadastro ainda</p><p className="mt-0.5 font-[Poppins] text-xs text-zinc-700">Os registros criados aparecerão aqui.</p></div>
            </div>
          )}

          {!loading && items.length > 0 && (
            <ul className="space-y-2">
              {items.slice(0, 20).map((item, index) => (
                <li key={`${item.id}-${item.action}-${index}`} className="group flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-neutral-950/40 px-4 py-3 transition-colors hover:border-white/10 hover:bg-white/[0.03]">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${TYPE_META[item.type]?.color ?? "border-white/10 bg-white/5 text-zinc-500"}`}>
                      {TYPE_META[item.type]?.icon ?? <Library className="h-3.5 w-3.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-[Poppins] text-sm font-medium text-zinc-200">{item.name || "Sem nome"}</p>
                      <div className="mt-1 flex items-center gap-2"><TypeBadge type={item.type} /><span className="font-[Poppins] text-[10px] text-zinc-700">{item.action === "update" ? "Editado" : "Criado"}</span></div>
                      {item.registrationCode ? (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="font-[Poppins] text-[10px] text-zinc-600">Codigo da turma</span>
                          <span className="rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 font-mono text-[11px] text-blue-300">
                            {item.registrationCode}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <button onClick={() => handleEditClick(item)} title="Editar" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-500 opacity-0 transition-all hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-400 group-hover:opacity-100">
                    <Pencil className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <AppModal isOpen={modalOpen} type="update" title="Confirmar edição" description={`Você está prestes a editar "${selectedItem?.name}". Deseja continuar?`} acceptLabel="Sim, editar" cancelLabel="Cancelar" onConfirm={confirmEdit} onCancel={closeModal} onClose={closeModal}>
        {selectedItem && (
          <div className="space-y-2">
            <div className="rounded-xl border border-white/5 bg-neutral-950/60 px-4 py-3"><p className="font-[Poppins] text-xs text-zinc-500">Tipo</p><div className="mt-1"><TypeBadge type={selectedItem.type} /></div></div>
            <div className="rounded-xl border border-white/5 bg-neutral-950/60 px-4 py-3"><p className="font-[Poppins] text-xs text-zinc-500">Nome</p><p className="mt-0.5 font-[Poppins] text-sm text-white">{selectedItem.name || "—"}</p></div>
          </div>
        )}
      </AppModal>
    </>
  );
}
