import React, { useState } from "react";
import axios from "axios";
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";

interface UniversityFormProps {
  onSubmit: (item: any) => void;
  initialData?: any;
}

const UniversityForm: React.FC<UniversityFormProps> = ({ onSubmit, initialData }) => {
  const [name, setName] = useState(initialData?.name || "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:3000/academic-institution/university", { name });
      setName("");
      onSubmit(response.data);
    } catch (error) {
      console.error("Erro ao cadastrar universidade:", error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <input type="text" placeholder="Nome da Universidade" value={name} onChange={(e) => setName(e.target.value)}
        className="border p-2 rounded w-full bg-[#141414] text-white" />
      <ButtonCRUD action="create" onClick={handleSubmit} />
    </form>
  );
};

export { UniversityForm };
