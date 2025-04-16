import React, { useState } from "react";
import { FormsHeader } from "../../components/components/Forms/FormsHeader";
import { FormsFilter } from "../../components/components/Forms/FormsFilter";
import { FormsList } from "../../components/components/Forms/FormsList";
import type { Item } from "../../components/components/Forms/FormsList";
import { FormsCrud } from "../../components/components/Forms/FormsCrud";
import type { FilterData } from "../../@types/FormsFilterTypes";
import { publicApi, academicApi } from "@/services/apiClient";
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

// Interface auxiliar para os dados brutos retornados pela API
interface RawItem {
  id?: string | number;
  _id?: string | number;
  name: string;
}

function CRUD() {
  const [items, setItems] = useState<Item[]>([]);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [currentEntity, setCurrentEntity] = useState<Entity>("university");

  async function handleSearch(filterData: FilterData): Promise<void> {
    try {
      let data: RawItem[] = [];
      switch (filterData.filterType) {
        case "universities":
          data = await publicApi.getInstitutions<RawItem[]>();
          setCurrentEntity("university");
          break;
        case "courses":
          if (filterData.universityId) {
            data = await publicApi.getCourses<RawItem[]>(filterData.universityId);
            setCurrentEntity("course");
          }
          break;
        case "disciplines":
          if (filterData.universityId && filterData.courseId) {
            data = await publicApi.getDisciplines<RawItem[]>(
              filterData.universityId,
              filterData.courseId
            );
            setCurrentEntity("discipline");
          }
          break;
        case "classes":
          if (filterData.universityId && filterData.courseId) {
            data = await publicApi.getClasses<RawItem[]>(
              filterData.universityId,
              filterData.courseId
            );
            setCurrentEntity("class");
          }
          break;
        case "professors":
          if (filterData.universityId) {
            if (filterData.courseId) {
              data = await publicApi.getProfessors<RawItem[]>(
                filterData.universityId,
                filterData.courseId
              );
            } else {
              data = await publicApi.getProfessors<RawItem[]>(filterData.universityId);
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
            data = await publicApi.getStudentsByDiscipline<RawItem[]>(
              filterData.universityId,
              filterData.courseId,
              filterData.disciplineId
            );
            setCurrentEntity("student");
          }
          break;
        case "students-course":
          if (filterData.universityId && filterData.courseId) {
            data = await publicApi.getStudentsByCourse<RawItem[]>(
              filterData.universityId,
              filterData.courseId
            );
            setCurrentEntity("student");
          }
          break;
        default:
          console.error("Filtro inválido");
      }
      // Garante que cada objeto tenha a propriedade "id"
      const mappedData: Item[] = data.map((item, index) => ({
        id: item.id ?? item._id ?? index,
        name: item.name,
      }));
      setItems(mappedData);
    } catch (error) {
      console.error("Erro ao buscar itens:", error);
    }
  }

  async function handleCreateOrUpdate(
    item:
      | UniversityData
      | CourseData
      | ProfessorData
      | ClassData
      | DisciplineData
  ): Promise<void> {
    try {
      let response:
        | UniversityData
        | CourseData
        | ProfessorData
        | ClassData
        | DisciplineData;
      switch (currentEntity) {
        case "university":
          response = await academicApi.post<UniversityData>("university", item);
          break;
        case "course":
          response = await academicApi.post<CourseData>("course", item);
          break;
        case "class":
          response = await academicApi.post<ClassData>("class", item);
          break;
        case "discipline":
          response = await academicApi.post<DisciplineData>("discipline", item);
          break;
        case "professor":
          response = await academicApi.post<ProfessorData>("professor", item);
          break;
        default:
          console.error("Entidade não suportada para criação:", currentEntity);
          return;
      }
      // Garante que o objeto retornado possua um id, usando _id se necessário
      const newItem: Item = {
        id: response.id ?? response._id ?? new Date().getTime(),
        name: response.name,
      };
      setItems((prevItems) => [...prevItems, newItem]);
    } catch (error) {
      console.error("Erro ao criar item:", error);
    }
  }

  function handleEdit(item: Item): void {
    setEditingItem(item);
  }

  function handleDelete(id: string | number): void {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  }

  function handleResetList(): void {
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
