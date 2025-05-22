import React, { useState, useMemo, useCallback } from "react";
import { academicFiltersApi } from "@/services/apiClient";
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";
import { University } from "@/services/api/api_academicFilters";

export interface DisciplineData {
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
  const [academicData, setAcademicData] = useState<{
    universities: University[];
  } | null>(null);

  // Estado dos campos do formulário
  const [name, setName] = useState<string>(initialData ? initialData.name : "");
  const [selectedUniversity, setSelectedUniversity] = useState<string>(
    initialData?.courseId ?
      academicData?.universities.find(u =>
        u.courses.some(c => c._id === initialData.courseId)
      )?._id || ""
      : ""
  );
  const [selectedCourse, setSelectedCourse] = useState<string>(initialData ? initialData.courseId : "");
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>(initialData ? initialData.classIds : []);
  const [selectedProfessorIds, setSelectedProfessorIds] = useState<string[]>(initialData ? initialData.professorIds : []);

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

  // Filtrar classes baseado no curso selecionado
  const availableClasses = useMemo(() => {
    if (!academicData || !selectedCourse) return [];

    const university = academicData.universities.find(u =>
      u.courses.some(c => c._id === selectedCourse)
    );

    const course = university?.courses.find(c => c._id === selectedCourse);
    return course?.classes || [];
  }, [academicData, selectedCourse]);

  // Filtrar professores baseado no curso selecionado
  const availableProfessors = useMemo(() => {
    if (!academicData || !selectedCourse) return [];

    const university = academicData.universities.find(u =>
      u.courses.some(c => c._id === selectedCourse)
    );

    const course = university?.courses.find(c => c._id === selectedCourse);
    return course?.professors || [];
  }, [academicData, selectedCourse]);

  // Callback para submit do formulário
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedCourse) return;

    onSubmit({
      name: name.trim(),
      courseId: selectedCourse,
      classIds: selectedClassIds,
      professorIds: selectedProfessorIds
    });

    // Reset dos campos
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

  // Handler para seleção de classes
  const handleClassesChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.options).filter(option => option.selected);
    setSelectedClassIds(options.map(option => option.value));
  }, []);

  // Handler para seleção de professores
  const handleProfessorsChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.options).filter(option => option.selected);
    setSelectedProfessorIds(options.map(option => option.value));
  }, []);

  // Renderização do formulário
  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      {/* Campo de nome da disciplina */}
      <div>
        <label className="block text-white mb-2">Nome da Disciplina:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="p-2 rounded w-full bg-[#141414] text-white"
        />
      </div>

      {/* Seleção de universidade */}
      <div>
        <label className="block text-white mb-2">Universidade:</label>
        <select
          value={selectedUniversity}
          onChange={(e) => {
            setSelectedUniversity(e.target.value);
            setSelectedCourse(""); // Reset curso quando universidade muda
          }}
          required
          className="p-2 rounded w-full bg-[#141414] text-white"
        >
          <option value="">Selecione a universidade</option>
          {academicData?.universities.map(uni => (
            <option key={uni._id} value={uni._id}>{uni.name}</option>
          ))}
        </select>
      </div>

      {/* Seleção de curso */}
      {selectedUniversity && (
        <div>
          <label className="block text-white mb-2">Curso:</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            required
            className="p-2 rounded w-full bg-[#141414] text-white"
          >
            <option value="">Selecione o curso</option>
            {availableCourses.map(course => (
              <option key={course._id} value={course._id}>{course.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Seleção de classes */}
      {selectedCourse && (
        <div>
          <label className="block text-white mb-2">Turmas (Selecione uma ou mais):</label>
          <select
            multiple
            value={selectedClassIds}
            onChange={handleClassesChange}
            className="p-2 rounded w-full bg-[#141414] text-white"
          >
            {availableClasses.map(cls => (
              <option key={cls._id} value={cls._id}>{cls.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Seleção de professores */}
      {selectedCourse && (
        <div>
          <label className="block text-white mt-4 mb-2">Professores (Selecione um ou mais):</label>
          <select
            multiple
            value={selectedProfessorIds}
            onChange={handleProfessorsChange}
            className="p-2 rounded w-full bg-[#141414] text-white"
          >
            {availableProfessors.map(prof => (
              <option key={prof._id} value={prof._id}>{prof.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Botão de submit */}
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