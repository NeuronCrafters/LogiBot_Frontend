import React, { useState, useEffect } from "react";
import { publicApi } from "@/services/apiClient";

export interface CourseData {
  id?: string | number;
  name: string;
  universityId: string;
}

interface University {
  _id: string;
  name: string;
}

export interface CourseFormProps {
  onSubmit: (data: CourseData) => void;
  initialData?: CourseData;
}

function CourseForm({ onSubmit, initialData }: CourseFormProps) {
  const [name, setName] = useState<string>(initialData?.name || "");
  const [universityId, setUniversityId] = useState<string>(
    initialData?.universityId || ""
  );
  const [universities, setUniversities] = useState<University[]>([]);

  useEffect(() => {
    publicApi
      .getInstitutions<University[]>()
      .then((data) => setUniversities(data))
      .catch((err) =>
        console.error("Erro ao carregar universidades:", err)
      );
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !universityId) return;
    onSubmit({ name: name.trim(), universityId });
    setName("");
    setUniversityId("");
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <label className="block text-white mb-2">Nome do Curso:</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="p-2 rounded w-full bg-[#202020] text-white"
      />
      <label className="block text-white mt-4 mb-2">Universidade:</label>
      <select
        value={universityId}
        onChange={(e) => setUniversityId(e.target.value)}
        required
        className="p-2 rounded w-full bg-[#202020] text-white"
      >
        <option value="">Selecione a universidade</option>
        {universities.map((uni) => (
          <option key={uni._id} value={uni._id}>
            {uni.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        {initialData ? "Atualizar" : "Cadastrar"}
      </button>
    </form>
  );
}

export { CourseForm };
