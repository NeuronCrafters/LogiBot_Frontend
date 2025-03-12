import React, { useState } from 'react';
import axios from 'axios';
import { FormsHeader } from '../../components/components/Forms/FormsHeader';
import { FormsFilter } from '../../components/components/Forms/FormsFilter';
import { FormsList } from '../../components/components/Forms/FormsList';
import type { Item } from '../../components/components/Forms/FormsList';
import { FormsCrud } from '../../components/components/Forms/FormsCrud';
import type { FilterData } from '../../components/components/Forms/FormsFilter';

function CRUD() {
  const [items, setItems] = useState<Item[]>([]);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Stub para abrir o modal de criação
  function openCreateModal() {
    console.log('Abrir modal de criação');
    // Implemente a lógica para abrir o modal conforme necessário
  }

  async function handleSearch(filterData: FilterData) {
    try {
      let response;
      switch (filterData.filterType) {
        case 'universities':
          response = await axios.get<Item[]>('http://localhost:3000/public/institutions');
          break;
        case 'courses':
          if (filterData.universityId) {
            response = await axios.get<Item[]>(`http://localhost:3000/public/courses/${filterData.universityId}`);
          }
          break;
        case 'disciplines':
          if (filterData.universityId && filterData.courseId) {
            response = await axios.get<Item[]>(
              `http://localhost:3000/public/disciplines/${filterData.universityId}/${filterData.courseId}`
            );
          }
          break;
        case 'classes':
          if (filterData.universityId && filterData.courseId) {
            response = await axios.get<Item[]>(
              `http://localhost:3000/public/classes/${filterData.universityId}/${filterData.courseId}`
            );
          }
          break;
        case 'professors':
          if (filterData.universityId) {
            if (filterData.courseId) {
              response = await axios.get<Item[]>(
                `http://localhost:3000/public/professors/${filterData.universityId}/${filterData.courseId}`
              );
            } else {
              response = await axios.get<Item[]>(
                `http://localhost:3000/public/professors/${filterData.universityId}`
              );
            }
          }
          break;
        case 'students-discipline':
          if (filterData.universityId && filterData.courseId && filterData.disciplineId) {
            response = await axios.get<Item[]>(
              `http://localhost:3000/public/students/${filterData.universityId}/${filterData.courseId}/${filterData.disciplineId}`
            );
          }
          break;
        case 'students-course':
          if (filterData.universityId && filterData.courseId) {
            response = await axios.get<Item[]>(
              `http://localhost:3000/public/students/${filterData.universityId}/${filterData.courseId}`
            );
          }
          break;
        default:
          console.error("Filtro inválido");
      }
      if (response) {
        setItems(response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
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

  function handleDelete(id: number) {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  }

  return (
    <div className="min-h-screen bg-[#141414] overflow-x-hidden">
      <FormsHeader />
      <div className="px-4 py-4 max-w-screen-xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-white">Sistema de Gerenciamento do SAEL</h1>
        <FormsFilter onSearch={handleSearch} />
        <FormsCrud onSubmit={handleCreateOrUpdate} initialData={editingItem || undefined} />
        <FormsList items={items} onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    </div>
  );
}

export { CRUD };
