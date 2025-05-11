import { useAuth } from "@/hooks/use-Auth";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion, AnimatePresence } from "framer-motion";

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
    <motion.div
      className="bg-[#181818] border border-neutral-700 rounded-md p-4 shadow-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-white">Nª</TableHead>
            <TableHead className="text-white">Nome</TableHead>
            <TableHead className="text-white">{headerLabel}</TableHead>
            {(entity === "professor" || entity === "student") && (
              <TableHead className="text-white">Ocupação</TableHead>
            )}
            <TableHead className="text-center text-white">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence>
            {items.length > 0 ? (
              items.map((item, idx) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="transition-colors duration-200 hover:bg-[#2a2a2a]"
                >
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.code ?? item.id}</TableCell>
                  {(entity === "professor" || entity === "student") && (
                    <TableCell>{item.roles?.join(", ") ?? "—"}</TableCell>
                  )}
                  <TableCell className="text-center">
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
                  </TableCell>
                </motion.tr>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={(entity === "professor" || entity === "student") ? 5 : 4}
                  className="text-center text-gray-500"
                >
                  Nenhum {entity} encontrado.
                </TableCell>
              </TableRow>
            )}
          </AnimatePresence>
        </TableBody>
      </Table>
    </motion.div>
  );
}