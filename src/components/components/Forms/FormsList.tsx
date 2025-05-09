import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-Auth";

export interface ListItem {
  id: string;
  name: string;
  code?: string;
  roles?: string[];
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
  if (!user) return null;

  const userRoles = Array.isArray(user.role) ? user.role : [user.role];
  const isAdmin = userRoles.includes("admin");

  const headerLabel =
    entity === "discipline"
      ? "Código"
      : entity === "professor" || entity === "student"
        ? "Email"
        : "ID";

  return (
    <div className="bg-[#181818] rounded-md mt-4 overflow-auto">
      <table className="table-auto w-full text-white border-collapse">
        <thead>
          <tr>
            <th className="border border-neutral-700 px-4 py-2">Nª</th>
            <th className="border border-neutral-700 px-4 py-2">Nome</th>
            <th className="border border-neutral-700 px-4 py-2">
              {headerLabel}
            </th>
            {(entity === "professor" || entity === "student") && (
              <th className="border border-neutral-700 px-4 py-2">Papéis</th>
            )}
            <th className="border border-neutral-700 px-4 py-2 text-center">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? (
            items.map((item, idx) => (
              <tr key={item.id}>
                <td className="border border-neutral-700 px-4 py-2">
                  {idx + 1}
                </td>
                <td className="border border-neutral-700 px-4 py-2">
                  {item.name}
                </td>
                <td className="border border-neutral-700 px-4 py-2">
                  {item.code ?? item.id}
                </td>
                {(entity === "professor" || entity === "student") && (
                  <td className="border border-neutral-700 px-4 py-2">
                    {item.roles?.join(", ") ?? "—"}
                  </td>
                )}
                <td className="border border-neutral-700 px-4 py-2 text-center">
                  <div className="inline-flex gap-2 justify-center">
                    {isAdmin && entity === "professor" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(item)}
                      >
                        Editar
                      </Button>
                    )}
                    {isAdmin && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete(item.id)}
                      >
                        Deletar
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={(entity === "professor" || entity === "student") ? 5 : 4}
                className="border border-neutral-700 px-4 py-2 text-center text-gray-500"
              >
                Nenhum {entity} encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
