import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { AppModal } from "@/shared/components/feedback/AppModal";
import { useAuth } from "@/features/auth/hooks/useAuth";

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

interface EntityTableProps {
  entity: EntityType;
  items: ListItem[];
  onEdit: (item: ListItem) => void;
  onDelete: (id: string) => void;
}

const ROLE_LABEL: Record<string, string> = {
  "course-coordinator": "Coordenador",
  professor: "Professor",
  student: "Aluno",
  admin: "Administrador",
};
function translateRole(r: string): string {
  return ROLE_LABEL[r] ?? r;
}

function RowSkeleton({ cols }: { cols: number }) {
  const widths = ["w-8", "w-48", "w-40", "w-24", "w-16"];
  return (
    <tr className="border-b border-white/5">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className={`h-4 animate-pulse rounded-md bg-white/5 ${widths[i] ?? "w-28"}`}
          />
        </td>
      ))}
    </tr>
  );
}

export function EntityTable({
  entity,
  items,
  onEdit,
  onDelete,
}: EntityTableProps) {
  const { user } = useAuth();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timeout);
  }, [items]);

  if (!user) return null;

  const userRoles = Array.isArray(user.role) ? user.role : [user.role];
  const isAdmin = userRoles.includes("admin");
  const isCoordinator = userRoles.includes("course-coordinator");
  const hasPeopleColumns = entity === "professor" || entity === "student";
  const canEdit =
    entity !== "student" &&
    (isAdmin ||
      (isCoordinator && ["class", "discipline", "professor"].includes(entity)));
  const canDelete = isAdmin;
  const showActions = canEdit || canDelete;
  const colCount = hasPeopleColumns
    ? showActions
      ? 5
      : 4
    : showActions
      ? 4
      : 3;
  const headerSecondary = hasPeopleColumns ? "E-mail" : "ID";

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1f1f1f] shadow-lg shadow-black/10">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
        <div>
          <p className="font-[Poppins] text-sm font-semibold text-white capitalize">
            {entity === "university"
              ? "Universidades"
              : entity === "course"
                ? "Cursos"
                : entity === "discipline"
                  ? "Disciplinas"
                  : entity === "class"
                    ? "Turmas"
                    : entity === "professor"
                      ? "Professores"
                      : "Alunos"}
          </p>
          <p className="mt-0.5 font-[Poppins] text-xs text-zinc-600">
            {items.length} {items.length === 1 ? "registro" : "registros"}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="w-12 px-5 py-3 text-left font-[Poppins] text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                Nº
              </th>
              <th className="px-5 py-3 text-left font-[Poppins] text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                Nome
              </th>
              <th className="px-5 py-3 text-left font-[Poppins] text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                {headerSecondary}
              </th>
              {hasPeopleColumns && (
                <th className="px-5 py-3 text-left font-[Poppins] text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  Cargo
                </th>
              )}
              {showActions && (
                <th className="px-5 py-3 text-right font-[Poppins] text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <RowSkeleton key={i} cols={colCount} />
                ))
              : items.map((item, idx) => (
                  <tr
                    key={item.id || `row-${idx}`}
                    className="group border-b border-white/5 last:border-0 transition-colors hover:bg-white/[0.03]"
                  >
                    <td className="px-5 py-3.5 font-[Poppins] text-xs text-zinc-600">
                      {idx + 1}
                    </td>
                    <td className="px-5 py-3.5 font-[Poppins] text-sm font-medium text-zinc-200">
                      {item.name}
                    </td>
                    <td className="max-w-[180px] truncate px-5 py-3.5 font-[Poppins] text-sm text-zinc-500">
                      {item.code ?? item.id}
                    </td>
                    {hasPeopleColumns && (
                      <td className="px-5 py-3.5">
                        {item.roles && item.roles.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.roles.map((r) => (
                              <span
                                key={r}
                                className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-[Poppins] text-xs text-zinc-400"
                              >
                                {translateRole(r)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="font-[Poppins] text-sm text-zinc-700">
                            -
                          </span>
                        )}
                      </td>
                    )}
                    {showActions && (
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                          {canEdit && (
                            <button
                              onClick={() => onEdit(item)}
                              title="Editar registro"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-400"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setDeleteId(item.id)}
                              title="Excluir"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <AppModal
        isOpen={!!deleteId}
        type="delete"
        title="Confirmar exclusao"
        description="Tem certeza que deseja excluir este registro? Esta acao nao pode ser desfeita."
        onClose={() => setDeleteId(null)}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) onDelete(deleteId);
          setDeleteId(null);
        }}
        acceptLabel="Excluir"
      />
    </div>
  );
}
