import React, { useState, useMemo, useCallback } from "react";
import { academicFiltersApi } from "@/services/apiClient";
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";
import { University } from "@/services/api/api_academicFilters";

export interface ClassData {
  name: string;
  courseId: string;
}

export interface ClassFormProps {
  onSubmit: (data: ClassData) => void;
  initialData?: ClassData;
}

function ClassForm({ onSubmit, initialData }: ClassFormProps) {
  const [academicData, setAcademicData] = useState<{
    universities: University[];
  } | null>(null);

  const [name, setName] = useState<string>(initialData ? initialData.name : "");
  const [selectedUniversity, setSelectedUniversity] = useState<string>(
    initialData?.courseId ?
      academicData?.universities.find(u =>
        u.courses.some(c => c._id === initialData.courseId)
      )?._id || ""
      : ""
  );
  const [selectedCourse, setSelectedCourse] = useState<string>(
    initialData ? initialData.courseId : ""
  );

  // Carregar dados acadêmicos uma única vez
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

  // Filtrar cursos baseado na universidade selecionada
  const availableCourses = useMemo(() => {
    if (!academicData || !selectedUniversity) return [];

    const university = academicData.universities.find(u => u._id === selectedUniversity);
    return university?.courses || [];
  }, [academicData, selectedUniversity]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedCourse) return;

    onSubmit({
      name: name.trim(),
      courseId: selectedCourse
    });

    setName("");
    setSelectedUniversity("");
    setSelectedCourse("");
  }, [name, selectedCourse, onSubmit]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white mb-1">Nome da Turma:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-md bg-[#141414] text-white px-3 py-2 outline-none border border-white/10 focus:ring-2 focus:ring-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-1">Universidade:</label>
        <select
          value={selectedUniversity}
          onChange={(e) => {
            setSelectedUniversity(e.target.value);
            setSelectedCourse(""); // Reset curso quando universidade muda
          }}
          required
          className="w-full rounded-md bg-[#141414] text-white px-3 py-2 outline-none border border-white/10"
        >
          <option value="">Selecione a universidade</option>
          {academicData?.universities.map((uni) => (
            <option key={uni._id} value={uni._id}>{uni.name}</option>
          ))}
        </select>
      </div>

      {selectedUniversity && (
        <div>
          <label className="block text-sm font-medium text-white mb-1">Curso:</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            required
            className="w-full rounded-md bg-[#141414] text-white px-3 py-2 outline-none border border-white/10"
          >
            <option value="">Selecione o curso</option>
            {availableCourses.map(course => (
              <option key={course._id} value={course._id}>{course.name}</option>
            ))}
          </select>
        </div>
      )}

      <ButtonCRUD
        action={initialData ? "update" : "create"}
        onClick={handleSubmit}
      />
    </form>
  );
}

export { ClassForm };