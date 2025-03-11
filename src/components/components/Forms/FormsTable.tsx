import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";
import toast from "react-hot-toast";
import axios from "axios";

interface Filters {
  university?: string;
  course?: string;
  discipline?: string;
  class?: string;
  professor?: string;
  student?: string;
}

interface FormsTableProps {
  items: any[];
  selectedEntity: string;
  fetchData: (filters?: Filters) => Promise<void>;
}

export function FormsTable({ items, selectedEntity, fetchData }: FormsTableProps) {
  const handleDelete = async (id: string) => {
    const confirmDelete = await new Promise<boolean>((resolve) => {
      toast((t) => (
        <div>
          <p>Tem certeza que deseja excluir?</p>
          <div className="flex justify-between mt-2">
            <ButtonCRUD action="delete" onClick={() => resolve(true)} />
            <ButtonCRUD action="list" onClick={() => { toast.dismiss(t.id); resolve(false); }} />
          </div>
        </div>
      ));
    });

    if (confirmDelete) {
      try {
        await axios.delete(`/academic-institution/${selectedEntity}/${id}`);
        toast.success("Item excluído com sucesso!");
        await fetchData();
      } catch (error) {
        toast.error("Erro ao excluir item!");
      }
    }
  };

  return (
    <div className="flex-1 overflow-auto p-8">
      <ul className="bg-[#3a3a3a] p-6 rounded-lg h-full">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <svg className="w-32 h-32 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h11M9 21V3m0 18l6-6m0 0l-6-6m6 6H3" />
            </svg>
          </div>
        ) : (
          items.map((item) => (
            <li key={item.id} className="flex justify-between items-center text-white p-3 border-b border-gray-600">
              <span>{item.name}</span>
              <div className="flex gap-2">
                <ButtonCRUD action="update" onClick={() => console.log("Editar")} />
                <ButtonCRUD action="delete" onClick={() => handleDelete(item.id)} />
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
