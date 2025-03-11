import { useEffect, useState } from "react";
import { FormsHeader } from "@/components/components/Forms/FormsHeader";
import { FormsTable } from "@/components/components/Forms/FormsTable";
import api from "@/services/api";

export function CRUD() {
  const [selectedEntity, setSelectedEntity] = useState("university");
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [selectedEntity, selectedUniversity, selectedCourse]);

  const fetchData = async () => {
    try {
      let url = `/academic-institution/${selectedEntity}`;
      if (selectedEntity === "discipline" && selectedUniversity && selectedCourse) {
        url = `/academic-institution/discipline/${selectedUniversity}/${selectedCourse}`;
      }
      const { data } = await api.get(url);
      setItems(data);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-[#141414]">
      <FormsHeader
        selectedEntity={selectedEntity}
        setSelectedEntity={setSelectedEntity}
        selectedUniversity={selectedUniversity}
        setSelectedUniversity={setSelectedUniversity}
        selectedCourse={selectedCourse}
        setSelectedCourse={setSelectedCourse}
        fetchData={fetchData}
        openCreateModal={() => console.log("Abrir modal de criação")}
      />
      <FormsTable items={items} selectedEntity={selectedEntity} fetchData={fetchData} />
    </div>
  );
}
