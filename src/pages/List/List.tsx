import { useState } from "react";
import { TableProperties } from "lucide-react";
import { FormsFilter } from "@/components/components/Forms/FormsFilter";
import { FormsList } from "@/components/components/Forms/FormsList";
import { useAuth } from "@/hooks/use-Auth";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { Header } from "@/components/components/Header/Header";
import { Avatar } from "@/components/components/Avatar/Avatar";
import { Button } from "@/components/ui/button";
import { searchEntitiesByFilter } from "@/utils/searchEntitiesByFilter";
import type { FilterData } from "@/@types/FormsFilterTypes";
import type { ListItem } from "@/components/components/Forms/FormsList";
import { motion, AnimatePresence } from "framer-motion";

type EntityType = "university" | "course" | "discipline" | "class" | "professor" | "student";

export function List() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [items, setItems] = useState<ListItem[]>([]);
  const [entity, setEntity] = useState<EntityType>("university");

  const userRoles = Array.isArray(user?.role) ? user.role : [user?.role];
  const isAdmin = userRoles.includes("admin");
  const isCoordinator = userRoles.includes("course-coordinator");
  const isProfessor = userRoles.includes("professor");

  const handleSearch = async (filterData: FilterData) => {
    const role: "admin" | "course-coordinator" | "professor" =
      isAdmin ? "admin" : isCoordinator ? "course-coordinator" : "professor";

    const { items, entity } = await searchEntitiesByFilter(role, filterData);
    setItems(items);
    setEntity(entity);
  };

  const handleResetList = () => {
    setItems([]); // Trigga animação de saída
  };

  return (
    <main className="min-h-screen bg-[#141414] text-white">
      {/* Topbar */}
      <div className="absolute bg-[#141414] w-full flex items-center gap-4 border-b border-neutral-800 px-8 py-4 z-10">
        <Typograph
          text="Listagem"
          colorText="text-white"
          variant="text2"
          weight="bold"
          fontFamily="poppins"
        />

        {user && (
          <div className="ml-auto">
            <Button onClick={() => setMenuOpen(true)} className="p-0 flex items-center justify-center">
              <div className="rainbow-avatar w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center">
                <Avatar
                  seed={user._id}
                  backgroundColor="#141414"
                  className="w-full h-full rounded-full"
                />
              </div>
            </Button>
          </div>
        )}
      </div>

      {/* Menu Lateral */}
      <Header isOpen={menuOpen} closeMenu={() => setMenuOpen(false)} />

      {/* Conteúdo Central */}
      <div className="w-full flex justify-center pt-24 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-screen-md">
          <div className="flex items-center gap-3 mb-6">
            <TableProperties className="text-3xl text-white" />
            <Typograph
              text="Listagem de Entidades do Sistema"
              colorText="text-white"
              variant="text1"
              weight="bold"
              fontFamily="poppins"
            />
          </div>

          <FormsFilter onSearch={handleSearch} onReset={handleResetList} />

          <AnimatePresence>
            {items.length > 0 && (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="mt-6"
              >
                <FormsList
                  items={items}
                  entity={entity}
                  onEdit={() => { }}
                  onDelete={() => { }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
