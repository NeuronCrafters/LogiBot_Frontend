import React, { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
// import { useAuth } from "@/hooks/use-Auth";
import { academicFiltersApi } from "@/services/apiClient";
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";

export interface DisciplineData {
  id?: string | number;
  _id?: string | number;
  name: string;
  courseId: string;
  classIds: string[];
  professorIds: string[];
}

export interface DisciplineFormProps {
  onSubmit: (data: DisciplineData) => void;
  initialData?: DisciplineData;
}

function DisciplineForm({ onSubmit, initialData }: DisciplineFormProps) {
  const { data: academicData, isLoading: loadingAcademicData } = useQuery({
    queryKey: ['academicData'],
    queryFn: async () => {
      const response = await academicFiltersApi.getAcademicData();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const [name, setName] = useState<string>(initialData ? initialData.name : "");
  const [selectedUniversity, setSelectedUniversity] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>(initialData ? initialData.courseId : "");
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>(initialData ? initialData.classIds : []);
  const [selectedProfessorIds, setSelectedProfessorIds] = useState<string[]>(initialData ? initialData.professorIds : []);

  const availableCourses = useMemo(() => {
    if (!academicData || !selectedUniversity) return [];

    const university = academicData.universities.find(u => u._id === selectedUniversity);
    return university?.courses || [];
  }, [academicData, selectedUniversity]);

  const availableClasses = useMemo(() => {
    if (!academicData || !selectedCourse) return [];

    const university = academicData.universities.find(u =>
      u.courses.some(c => c._id === selectedCourse)
    );

    const course = university?.courses.find(c => c._id === selectedCourse);
    return course?.classes || [];
  }, [academicData, selectedCourse]);

  const availableProfessors = useMemo(() => {
    if (!academicData || !selectedCourse) return [];

    const university = academicData.universities.find(u =>
      u.courses.some(c => c._id === selectedCourse)
    );

    const course = university?.courses.find(c => c._id === selectedCourse);
    return course?.professors || [];
  }, [academicData, selectedCourse]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedCourse) return;

    onSubmit({
      name: name.trim(),
      courseId: selectedCourse,
      classIds: selectedClassIds,
      professorIds: selectedProfessorIds
    });

    setName("");
    setSelectedUniversity("");
    setSelectedCourse("");
    setSelectedClassIds([]);
    setSelectedProfessorIds([]);
  }, [
    name,
    selectedCourse,
    selectedClassIds,
    selectedProfessorIds,
    onSubmit
  ]);

  const handleClassesChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.options).filter(option => option.selected);
    setSelectedClassIds(options.map(option => option.value));
  }, []);

  const handleProfessorsChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.options).filter(option => option.selected);
    setSelectedProfessorIds(options.map(option => option.value));
  }, []);

  if (loadingAcademicData) {
    return (
      <div className="mt-4 space-y-4">
        <div className="text-white">Carregando dados acadêmicos...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label className="block mb-2 text-white">Nome da Disciplina:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="p-2 rounded w-full bg-[#141414] text-white border border-white/10 focus:ring-2 focus:ring-white outline-none"
        />
      </div>

      <div>
        <label className="block mb-2 text-white">Universidade:</label>
        <select
          value={selectedUniversity}
          onChange={(e) => {
            setSelectedUniversity(e.target.value);
            setSelectedCourse("");
          }}
          required
          className="p-2 rounded w-full bg-[#141414] text-white border border-white/10 outline-none"
        >
          <option value="">Selecione a universidade</option>
          {academicData?.universities.map(uni => (
            <option key={uni._id} value={uni._id}>{uni.name}</option>
          ))}
        </select>
      </div>

      {selectedUniversity && (
        <div>
          <label className="block mb-2 text-white">Curso:</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            required
            className="p-2 rounded w-full bg-[#141414] text-white border border-white/10 outline-none"
          >
            <option value="">Selecione o curso</option>
            {availableCourses.map(course => (
              <option key={course._id} value={course._id}>{course.name}</option>
            ))}
          </select>
        </div>
      )}

      {selectedCourse && (
        <div>
          <label className="block mb-2 text-white">Turmas (Selecione uma ou mais):</label>
          <select
            multiple
            value={selectedClassIds}
            onChange={handleClassesChange}
            className="p-2 rounded w-full bg-[#141414] text-white border border-white/10 outline-none min-h-[100px]"
          >
            {availableClasses.map(cls => (
              <option key={cls._id} value={cls._id}>{cls.name}</option>
            ))}
          </select>
          <small className="block mt-1 text-gray-400">
            Segure Ctrl (Windows) ou Cmd (Mac) para selecionar múltiplas turmas
          </small>
        </div>
      )}

      {selectedCourse && (
        <div>
          <label className="block mt-4 mb-2 text-white">Professores (Selecione um ou mais):</label>
          <select
            multiple
            value={selectedProfessorIds}
            onChange={handleProfessorsChange}
            className="p-2 rounded w-full bg-[#141414] text-white border border-white/10 outline-none min-h-[100px]"
          >
            {availableProfessors.map(prof => (
              <option key={prof._id} value={prof._id}>{prof.name}</option>
            ))}
          </select>
          <small className="block mt-1 text-gray-400">
            Segure Ctrl (Windows) ou Cmd (Mac) para selecionar múltiplos professores
          </small>
        </div>
      )}

      <div className="pt-2">
        <ButtonCRUD
          action={initialData ? "update" : "create"}
          onClick={handleSubmit}
        />
      </div>
    </form>
  );
}

export { DisciplineForm };