import { useState } from "react";
import { FormsHeader } from "../../components/components/Forms/FormsHeader";
import { FormsFilter } from "../../components/components/Forms/FormsFilter";
import { FormsList } from "../../components/components/Forms/FormsList";
import type { Item } from "../../components/components/Forms/FormsList";
import { FormsCrud } from "../../components/components/Forms/FormsCrud";
import type { FilterData } from "../../@types/FormsFilterTypes";
import { publicApi } from "@/services/apiClient";
import {
  UniversityData,
  CourseData,
  ProfessorData,
  ClassData,
  DisciplineData,
} from "@/@types/FormsDataTypes";

type Entity =
  | "university"
  | "course"
  | "discipline"
  | "class"
  | "professor"
  | "student";

function CRUD() {
  const [items, setItems] = useState<Item[]>([]);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [currentEntity, setCurrentEntity] = useState<Entity>("university");

  async function handleSearch(filterData: FilterData) {
    try {
      let data: Item[] = [];
      switch (filterData.filterType) {
        case "universities":
          data = await publicApi.getInstitutions<Item[]>();
          setCurrentEntity("university");
          break;
        case "courses":
          if (filterData.universityId) {
            data = await publicApi.getCourses<Item[]>(filterData.universityId);
            setCurrentEntity("course");
          }
          break;
        case "disciplines":
          if (filterData.universityId && filterData.courseId) {
            data = await publicApi.getDisciplines<Item[]>(
              filterData.universityId,
              filterData.courseId
            );
            setCurrentEntity("discipline");
          }
          break;
        case "classes":
          if (filterData.universityId && filterData.courseId) {
            data = await publicApi.getClasses<Item[]>(
              filterData.universityId,
              filterData.courseId
            );
            setCurrentEntity("class");
          }
          break;
        case "professors":
          if (filterData.universityId) {
            if (filterData.courseId) {
              data = await publicApi.getProfessors<Item[]>(
                filterData.universityId,
                filterData.courseId
              );
            } else {
              data = await publicApi.getProfessors<Item[]>(filterData.universityId);
            }
            setCurrentEntity("professor");
          }
          break;
        case "students-discipline":
          if (
            filterData.universityId &&
            filterData.courseId &&
            filterData.disciplineId
          ) {
            data = await publicApi.getStudentsByDiscipline<Item[]>(
              filterData.universityId,
              filterData.courseId,
              filterData.disciplineId
            );
            setCurrentEntity("student");
          }
          break;
        case "students-course":
          if (filterData.universityId && filterData.courseId) {
            data = await publicApi.getStudentsByCourse<Item[]>(
              filterData.universityId,
              filterData.courseId
            );
            setCurrentEntity("student");
          }
          break;
        default:
          console.error("Filtro inválido");
      }
      setItems(data);
    } catch (error) {
      console.error("Erro ao buscar itens:", error);
    }
  }

  function handleCreateOrUpdate(
    item:
      | UniversityData
      | CourseData
      | ProfessorData
      | ClassData
      | DisciplineData
  ) {
    const newId = item.id !== undefined ? item.id : new Date().getTime();
    const newItem: Item = { id: newId, name: item.name };
    if (items.some((it) => it.id === newItem.id)) {
      setItems((prevItems) =>
        prevItems.map((it) => (it.id === newItem.id ? { ...it, name: newItem.name } : it))
      );
      setEditingItem(null);
    } else {
      setItems((prevItems) => [...prevItems, newItem]);
    }
  }

  function handleEdit(item: Item) {
    setEditingItem(item);
  }

  function handleDelete(id: string | number) {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  }

  function handleResetList() {
    setItems([]);
  }

  return (
    <div className="min-h-screen bg-[#141414] overflow-x-hidden">
      <FormsHeader />
      <div className="bg-[#141414]">
        <div className="px-4 py-8 max-w-screen-xl mx-auto">
          <h1 className="text-2xl font-bold mb-4 text-white font-Montserrat">
            Sistema de Gerenciamento do SAEL
          </h1>
          <FormsFilter onSearch={handleSearch} onReset={handleResetList} />
          {currentEntity !== "student" && currentEntity !== "professor" && (
            <FormsCrud
              onSubmit={handleCreateOrUpdate}
              initialData={editingItem || undefined}
            />
          )}
          <FormsList
            entity={currentEntity}
            items={items}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}

export { CRUD };
