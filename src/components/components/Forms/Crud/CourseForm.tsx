import React, { useState, useMemo, useCallback } from "react";
import { academicFiltersApi } from "@/services/apiClient";
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";
import { University } from "@/services/api/api_academicFilters";

export interface CourseData {
  id?: string | number;
  name: string;
  universityId: string;
}

export interface CourseFormProps {
  onSubmit: (data: CourseData) => void;
  initialData?: CourseData;
}

function CourseForm({ onSubmit, initialData }: CourseFormProps) {
  const [academicData, setAcademicData] = useState<{
    universities: University[];
  } | null>(null);

  const [name, setName] = useState<string>(initialData?.name || "");
  const [universityId, setUniversityId] = useState<string>(
    initialData?.universityId || ""
  );

  useMemo(() => {
    const fetchAcademicData = async () => {
      try {
        const response = await academicFiltersApi.getAcademicData();
        setAcademicData(response.data);
      } catch (error) {
        console.error("Erro ao carregar dados acadêmicos:", error);
      }
    };
    fetchAcademicData();
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !universityId) return;

    onSubmit({
      name: name.trim(),
      universityId
    });

    setName("");
    setUniversityId("");
  }, [name, universityId, onSubmit]);

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label className="block text-white mb-2">Nome do Curso:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="p-2 rounded w-full bg-[#141414] text-white"
        />
      </div>

      <div>
        <label className="block text-white mb-2">Universidade:</label>
        <select
          value={universityId}
          onChange={(e) => setUniversityId(e.target.value)}
          required
          className="p-2 rounded w-full bg-[#141414] text-white"
        >
          <option value="">Selecione a universidade</option>
          {academicData?.universities.map((uni) => (
            <option key={uni._id} value={uni._id}>
              {uni.name}
            </option>
          ))}
        </select>
      </div>

      <div className="pt-2">
        <ButtonCRUD
          action={initialData ? "update" : "create"}
          onClick={handleSubmit}
        />
      </div>
    </form>
  );
}

export { CourseForm };