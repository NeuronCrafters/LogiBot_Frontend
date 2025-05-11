import { useState } from "react";
import { TableProperties } from "lucide-react";
import { FormsFilter } from "@/components/components/Forms/FormsFilter";
import { FormsList } from "@/components/components/Forms/FormsList";
import { useAuth } from "@/hooks/use-Auth";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { Header } from "@/components/components/Header/Header";
import { Avatar } from "@/components/components/Avatar/Avatar";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { coordinatorApi, professorApi, publicApi } from "@/services/apiClient";
import type { FilterData } from "@/@types/FormsFilterTypes";
import type { ListItem } from "@/components/components/Forms/FormsList";

type Institution = { _id: string; name: string };
type Discipline = { _id: string; name: string };
type Student = { _id: string; name: string; email: string };

export function List() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [items, setItems] = useState<ListItem[]>([]);
  const [entity, setEntity] = useState<
    "university" | "course" | "discipline" | "class" | "professor" | "student"
  >("university");

  const userRoles = Array.isArray(user?.role) ? user.role : [user?.role];
  const isAdmin = userRoles.includes("admin");
  const isCoordinator = userRoles.includes("course-coordinator");
  const isProfessor = userRoles.includes("professor");

  const handleSearch = async (filterData: FilterData) => {
    try {
      let fetched: ListItem[] = [];

      if (isAdmin && filterData.filterType === "universities") {
        const res = (await publicApi.getInstitutions()) as Institution[];
        fetched = res.map((i) => ({ id: i._id, name: i.name }));
        setEntity("university");
      }

      if (isCoordinator && filterData.filterType === "disciplines") {
        const res = (await coordinatorApi.listDisciplines()) as Discipline[];
        fetched = res.map((d) => ({ id: d._id, name: d.name }));
        setEntity("discipline");
      }

      if (isProfessor && filterData.filterType === "students-discipline") {
        const res = (await professorApi.listMyStudents()) as Student[];
        fetched = res.map((s) => ({ id: s._id, name: s.name, code: s.email }));
        setEntity("student");
      }

      setItems(fetched);
    } catch (err) {
      toast.error("Erro ao buscar dados");
    }
  };

  return (
    <main className="min-h-screen bg-[#141414] text-white">
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

      {/* Menu lateral */}
      <Header isOpen={menuOpen} closeMenu={() => setMenuOpen(false)} />

      {/* Conteúdo centralizado */}
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

          <FormsFilter onSearch={handleSearch} onReset={() => setItems([])} />

          <div className="mt-6">
            <FormsList
              items={items}
              entity={entity}
              onEdit={() => { }}
              onDelete={() => { }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
