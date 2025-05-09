// src/components/components/Forms/FormsList.tsx
import { Button } from "@/components/ui/button";

export interface ListItem {
  id: string;
  name: string;
  code?: string;      // usado para 'discipline' ou email de professor/aluno ou ID nos genéricos
  roles?: string[];   // apenas para professor e student
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

export function FormsList({
  entity,
  items,
  onEdit,
  onDelete,
}: FormsListProps) {
  // Label dinâmico para a terceira coluna
  const thirdHeader =
    entity === "discipline"
      ? "Código"
      : entity === "professor" || entity === "student"
        ? "Email"
        : "ID";

  // Decide se mostra a coluna de Papéis
  const showRoles = entity === "professor" || entity === "student";

  // Quantidade de colunas totais (para colSpan em vazio)
  const totalCols = 3 + (showRoles ? 1 : 0) + 1; // Nª, Nome, 3ª, [Papel], Ações

  return (
    <div className="bg-[#181818] rounded-md overflow-auto">
      <table className="min-w-full text-white border-collapse">
        <thead>
          <tr>
            <th className="px-4 py-2 border border-neutral-700 text-left">Nª</th>
            <th className="px-4 py-2 border border-neutral-700 text-left">Nome</th>
            <th className="px-4 py-2 border border-neutral-700 text-left">{thirdHeader}</th>
            {showRoles && (
              <th className="px-4 py-2 border border-neutral-700 text-left">Papel</th>
            )}
            <th className="px-4 py-2 border border-neutral-700 text-center">Ações</th>
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? (
            items.map((item, idx) => (
              <tr key={item.id}>
                <td className="px-4 py-2 border border-neutral-700">{idx + 1}</td>
                <td className="px-4 py-2 border border-neutral-700">{item.name}</td>
                <td className="px-4 py-2 border border-neutral-700">
                  {item.code ?? item.id}
                </td>
                {showRoles && (
                  <td className="px-4 py-2 border border-neutral-700">
                    {item.roles?.join(", ") ?? "—"}
                  </td>
                )}
                <td className="px-4 py-2 border border-neutral-700 text-center">
                  <div className="inline-flex items-center justify-center gap-2">
                    {entity === "professor" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(item)}
                      >
                        Editar
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(item.id)}
                    >
                      Deletar
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={totalCols}
                className="px-4 py-2 border border-neutral-700 text-center text-gray-500"
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
