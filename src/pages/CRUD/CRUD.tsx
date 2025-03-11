import { useEffect, useState } from "react";
import { FormsHeader } from "@/components/components/Forms/FormsHeader";
import { FormsSectionFilter } from "@/components/components/Forms/FormsSectionFilter";
import { FormsTable } from "@/components/components/Forms/FormsTable";
import axios from "axios";

interface Filters {
  university?: string;
  course?: string;
  discipline?: string;
  class?: string;
  professor?: string;
  student?: string;
}

export function CRUD() {
  const [items, setItems] = useState<any[]>([]);
  const [filters, setFilters] = useState<Filters>({});
  const [selectedEntity, setSelectedEntity] = useState<string>("");

  useEffect(() => {
    fetchData(filters);
  }, [filters]);

  const fetchData = async (filters?: Filters) => {
    try {
      let url = "/academic-institution";

      if (filters?.university) {
        url = `/courses/${filters.university}`;
        setSelectedEntity("courses");
      }
      if (filters?.course) {
        url = `/disciplines/${filters.university}/${filters.course}`;
        setSelectedEntity("disciplines");
      }
      if (filters?.discipline) {
        url = `/classes/${filters.university}/${filters.course}`;
        setSelectedEntity("classes");
      }
      if (filters?.class) {
        url = `/students/${filters.university}/${filters.course}/${filters.class}`;
        setSelectedEntity("students");
      }
      if (filters?.professor) {
        url = `/professors/${filters.university}`;
        setSelectedEntity("professors");
      }
      if (filters?.student) {
        url = `/students/${filters.university}/${filters.course}`;
        setSelectedEntity("students");
      }

      const { data } = await axios.get(url);
      setItems(data);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-[#141414]">
      {/* Cabeçalho */}
      <FormsHeader openCreateModal={() => console.log("Abrir modal de criação")} />

      {/* Filtros */}
      {/* <FormsSectionFilter fetchData={setFilters} /> */}

      {/* Tabela de Resultados */}
      {/* <FormsTable items={items} fetchData={() => fetchData(filters)} selectedEntity={selectedEntity} /> */}
    </div>
  );
}