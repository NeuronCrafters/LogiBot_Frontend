import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";

export interface Item {
  id: number | string;
  name: string;
}

interface FormsListProps {
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
    try {
      let response;
      if (entity === 'university') {
        response = await axios.delete('http://localhost:3000/academic-institution/university', {
          data: { universityId: id }
        });
      } else if (entity === 'course') {
        response = await axios.delete(`http://localhost:3000/academic-institution/course/${id}`);
      } else if (entity === 'discipline') {
        response = await axios.delete(`http://localhost:3000/academic-institution/discipline/${id}`);
      }
      if (response) {
        onDelete(id);
      }
    } catch (error) {
      console.error('Erro ao deletar item:', error);
    }
  };

  return (
    <div className="bg-[#141414] text-white p-4 rounded border border-white">
      <h2 className="text-xl font-semibold mb-4">Entidades Encontradas:</h2>
      <ul>
        {items.map((item) => {
          const id = (item as any).id || (item as any)._id;
          const name = item.name;
          return (
            <li
              key={id}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center border border-white p-2 rounded mb-2"
            >
              <span className="mb-2 sm:mb-0">{name}</span>
              <div className="flex gap-2">
                <ButtonCRUD action="update" onClick={() => onEdit({ id, name })} compact={isMobile} />
                <ButtonCRUD action="delete" onClick={() => handleDelete(id)} compact={isMobile} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export { FormsList };
