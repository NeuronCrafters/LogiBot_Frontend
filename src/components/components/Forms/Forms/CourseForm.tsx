import React, { useState, useEffect } from "react";
import axios from "axios";
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";

interface CourseFormProps {
  onSubmit: (item: any) => void;
  initialData?: any;
}

const CourseForm: React.FC<CourseFormProps> = ({ onSubmit, initialData }) => {
  const [name, setName] = useState(initialData?.name || "");
  const [universities, setUniversities] = useState<{ _id: string; name: string }[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState(initialData?.universityId || "");

  useEffect(() => {
    axios.get("http://localhost:3000/academic-institution/university")
      .then(response => setUniversities(response.data))
      .catch(error => console.error("Erro ao carregar universidades", error));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:3000/academic-institution/course", { name, universityId: selectedUniversity });
      setName("");
      setSelectedUniversity("");
      onSubmit(response.data);
    } catch (error) {
      console.error("Erro ao cadastrar curso:", error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <input type="text" placeholder="Nome do Curso" value={name} onChange={(e) => setName(e.target.value)}
        className="border p-2 rounded w-full bg-[#141414] text-white" />

      <label className="block mt-2">Universidade:</label>
      <select value={selectedUniversity} onChange={(e) => setSelectedUniversity(e.target.value)}
        className="border p-2 rounded w-full bg-[#141414] text-white">
        <option value="">Selecione a universidade</option>
        {universities.map((uni) => (
          <option key={uni._id} value={uni._id}>{uni.name}</option>
        ))}
      </select>

      <ButtonCRUD action="create" onClick={handleSubmit} />
    </form>
  );
};

export { CourseForm };
