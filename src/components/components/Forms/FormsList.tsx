import React from 'react';

export interface Item {
  id: number;
  name: string;
}

interface FormsListProps {
  items: Item[];
  onEdit: (item: Item) => void;
  onDelete: (id: number) => void;
}

function FormsList({ items, onEdit, onDelete }: FormsListProps) {
  return (
    <div className="bg-[#141414] text-white p-4 rounded border border-white">
      <h2 className="text-xl font-semibold mb-4">Entidades Encontradas: </h2>
      <ul>
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center border border-white p-2 rounded mb-2"
          >
            <span className="mb-2 sm:mb-0">{item.name}</span>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(item)}
                className="bg-green-500 text-white px-2 py-1 rounded"
              >
                Editar
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="bg-red-500 text-white px-2 py-1 rounded"
              >
                Deletar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { FormsList };
