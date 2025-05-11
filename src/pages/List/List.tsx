import { useState } from "react";
import { TbListSearch } from "react-icons/tb";
import { FormsFilter } from "@/components/components/Forms/FormsFilter";
import { FormsList } from "@/components/components/Forms/FormsList";
import { useAuth } from "@/hooks/use-Auth";
import type { FilterData } from "@/@types/FormsFilterTypes";
import type { ListItem } from "@/components/components/Forms/FormsList";
import { Typograph } from "@/components/components/Typograph/Typograph";
import toast from "react-hot-toast";
import {
  adminApi,
  coordinatorApi,
  professorApi,
  publicApi,
} from "@/services/apiClient";

export function List() {
  const { user } = useAuth();
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

      if (isAdmin) {
        if (filterData.filterType === "universities") {
          const res = await publicApi.getInstitutions();
          fetched = res.map((i) => ({ id: i._id, name: i.name }));
          setEntity("university");
        }
        // Adicione outros casos conforme necessário
      }

      if (isCoordinator) {
        if (filterData.filterType === "disciplines") {
          const res = await coordinatorApi.listDisciplines();
          fetched = res.map((d) => ({ id: d._id, name: d.name }));
          setEntity("discipline");
        }
        // Outros casos aqui
      }

      if (isProfessor) {
        if (filterData.filterType === "students-discipline") {
          const res = await professorApi.listMyStudents();
          fetched = res.map((s) => ({ id: s._id, name: s.name, code: s.email }));
          setEntity("student");
        }
      }

      setItems(fetched);
    } catch (err) {
      toast.error("Erro ao buscar dados");
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white px-4 py-8 max-w-screen-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <TbListSearch className="text-3xl text-white" />
        <Typograph
          text="Listagem de Registros"
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
  );
}
