import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";

export interface Item {
  id: number | string;
  name: string;
}

export interface FormsListProps {
  items: Item[];
  entity: 'university' | 'course' | 'discipline';
  onEdit: (item: Item) => void;
  onDelete: (id: number | string) => void;
}

function FormsList({ items, entity, onEdit, onDelete }: FormsListProps) {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDelete = async (id: number | string) => {
    const confirmed = window.confirm("Tem certeza que deseja deletar?");
    if (!confirmed) return;

    let deletePromise;
    if (entity === 'university') {
      // Rota para deletar universidade: DELETE com payload, enviando o id no campo "universityId"
      deletePromise = axios.delete('http://localhost:3000/academic-institution/university', {
        data: { universityId: id }
      });
    } else if (entity === 'course') {
      // Rota para deletar curso: DELETE passando o id na URL
      deletePromise = axios.delete(`http://localhost:3000/academic-institution/course/${id}`);
    } else if (entity === 'discipline') {
      // Rota para deletar disciplina: DELETE passando o id na URL
      deletePromise = axios.delete(`http://localhost:3000/academic-institution/discipline/${id}`);
    }

    if (deletePromise) {
      toast.promise(deletePromise, {
        loading: 'Deletando...',
        success: 'Item deletado!',
        error: 'Erro ao deletar item.'
      }).then(() => {
        onDelete(id);
      });
    }
  };

  return (
    <div className="bg-[#181818] text-white p-4 rounded-md">
      <h2 className="text-xl font-semibold mb-4">{entity} encontradas:</h2>
      <ul>
        {items.map((item) => {
          const id = (item as any).id || (item as any)._id;
          const name = item.name;
          return (
            <li
              key={id}
              className="bg-[#202020] flex flex-col sm:flex-row justify-between items-start sm:items-center rounded-md p-2  mb-2"
            >
              <span className="mb-2 sm:mb-0">{name}</span>
              <div className="flex gap-2">
                <ButtonCRUD
                  action="update"
                  onClick={() => onEdit({ id, name })}
                  compact={isMobile}
                  
                />
                <ButtonCRUD
                  action="delete"
                  onClick={() => handleDelete(id)}
                  compact={isMobile}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export { FormsList };
