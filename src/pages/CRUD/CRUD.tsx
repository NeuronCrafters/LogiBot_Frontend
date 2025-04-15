import React, { useState } from "react";
import axios from "axios";
import { FormsHeader } from "../../components/components/Forms/FormsHeader";
import { FormsFilter } from "../../components/components/Forms/FormsFilter";
import { FormsList } from "../../components/components/Forms/FormsList";
import type { Item } from "../../components/components/Forms/FormsList";
import { FormsCrud } from "../../components/components/Forms/FormsCrud";
import type { FilterData } from "../../components/components/Forms/FormsFilter";

type Entity = "university" | "course" | "discipline" | "class" | "professor" | "student";

function CRUD() {
  const [items, setItems] = useState<Item[]>([]);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [currentEntity, setCurrentEntity] = useState<Entity>("university");

  async function handleSearch(filterData: FilterData) {
    try {
      let response;
      switch (filterData.filterType) {
        case "universities":
          response = await axios.get<Item[]>("http://localhost:3000/public/institutions");
          setCurrentEntity("university");
          break;
        case "courses":
          if (filterData.universityId) {
            response = await axios.get<Item[]>(`http://localhost:3000/public/courses/${filterData.universityId}`);
            setCurrentEntity("course");
          }
          break;
        case "disciplines":
          if (filterData.universityId && filterData.courseId) {
            response = await axios.get<Item[]>(`http://localhost:3000/public/disciplines/${filterData.universityId}/${filterData.courseId}`);
            setCurrentEntity("discipline");
          }
          break;
        case "classes":
          if (filterData.universityId && filterData.courseId) {
            response = await axios.get<Item[]>(`http://localhost:3000/public/classes/${filterData.universityId}/${filterData.courseId}`);
            setCurrentEntity("class");
          }
          break;
        case "professors":
          if (filterData.universityId) {
            if (filterData.courseId) {
              response = await axios.get<Item[]>(`http://localhost:3000/public/professors/${filterData.universityId}/${filterData.courseId}`);
            } else {
              response = await axios.get<Item[]>(`http://localhost:3000/public/professors/${filterData.universityId}`);
            }
            setCurrentEntity("professor");
          }
          break;
        case "students-discipline":
          if (filterData.universityId && filterData.courseId && filterData.disciplineId) {
            response = await axios.get<Item[]>(
              `http://localhost:3000/public/students/by-discipline/${filterData.universityId}/${filterData.courseId}/${filterData.disciplineId}`
            );
            setCurrentEntity("student");
          }
          break;
        case "students-course":
          if (filterData.universityId && filterData.courseId) {
            response = await axios.get<Item[]>(
              `http://localhost:3000/public/students/by-course/${filterData.universityId}/${filterData.courseId}`
            );
            setCurrentEntity("student");
          }
          break;
        default:
          console.error("Filtro inválido");
      }
      if (response) {
        setItems(response.data);
      }
    } catch (error) {
      console.error("Erro ao buscar itens:", error);
    }
  }

  function handleCreateOrUpdate(item: Item) {
    if (item.id && items.some((it) => it.id === item.id)) {
      setItems((prevItems) =>
        prevItems.map((it) => (it.id === item.id ? { ...it, name: item.name } : it))
      );
      setEditingItem(null);
    } else {
      setItems((prevItems) => [...prevItems, item]);
    }
  }

  function handleEdit(item: Item) {
    setEditingItem(item);
  }

  function handleDelete(id: string | number) {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  }

  // Função para resetar os itens (fazendo com que a listagem desapareça)
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
          {/* Passamos a função handleResetList como onReset */}
          <FormsFilter onSearch={handleSearch} onReset={handleResetList} />
          {currentEntity !== "student" && currentEntity !== "professor" && (
            <FormsCrud onSubmit={handleCreateOrUpdate} initialData={editingItem || undefined} />
          )}
          <FormsList entity={currentEntity} items={items} onEdit={handleEdit} onDelete={handleDelete} />
        </div>
      </div>
    </div>
  );
}

export { CRUD };
