import React, { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-Auth";
import { academicFiltersApi } from "@/services/apiClient";
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";
import { University } from "@/services/api/api_academicFilters";

export interface ClassData {
  id?: string | number;
  _id?: string | number;
  name: string;
  courseId: string;
}

export interface ClassFormProps {
  onSubmit: (data: ClassData) => void;
  initialData?: ClassData;
}

function ClassForm({ onSubmit, initialData }: ClassFormProps) {
  const { user } = useAuth();

  // Verificar permissões do usuário
  const roles = Array.isArray(user?.role) ? user.role : [user?.role];
  const isAdmin = roles.includes("admin");
  const isCoordinator = roles.includes("course-coordinator");

  // Query para buscar dados acadêmicos com cache
  const { data: academicData, isLoading: loadingAcademicData } = useQuery({
    queryKey: ['academicData'],
    queryFn: async () => {
      const response = await academicFiltersApi.getAcademicData();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  // Estados do formulário
  const [name, setName] = useState<string>(initialData ? initialData.name : "");
  const [selectedUniversity, setSelectedUniversity] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>(initialData ? initialData.courseId : "");

  // Helper para extrair IDs que podem ser string ou array  
  const getFirstId = (value: string | string[] | undefined): string => {
    if (!value) return "";
    return Array.isArray(value) ? (value[0] || "") : value;
  };

  // Helper para pegar o primeiro curso do coordenador do array courses
  const getCoordinatorCourseId = (user: any): string => {
    if (!user?.courses || !Array.isArray(user.courses)) return "";

    const firstCourse = user.courses[0];

    // Se é ObjectId do MongoDB
    if (firstCourse?.id) return firstCourse.id;

    // Se já é string
    if (typeof firstCourse === 'string') return firstCourse;

    return "";
  };

  // Para coordenadores, filtrar apenas dados do seu curso/universidade
  const filteredUniversities = useMemo(() => {
    if (!academicData?.universities) return [];

    if (isAdmin) {
      return academicData.universities;
    }

    if (isCoordinator && user?.schoolId) {
      // Coordenador só vê sua universidade
      const universityId = getFirstId(user.schoolId);
      return academicData.universities.filter(u => u._id === universityId);
    }

    return [];
  }, [academicData, isAdmin, isCoordinator, user]);

  // Filtrar cursos baseado na universidade selecionada e permissões
  const availableCourses = useMemo(() => {
    if (!academicData || !selectedUniversity) return [];

    const university = academicData.universities.find(u => u._id === selectedUniversity);
    const courses = university?.courses || [];

    if (isAdmin) {
      return courses;
    }

    if (isCoordinator && user?.courses) {
      // Coordenador só vê seu curso (primeiro do array courses)
      const courseId = getCoordinatorCourseId(user);
      const filteredCourses = courses.filter(c => c._id === courseId);

      return filteredCourses;
    }

    return [];
  }, [academicData, selectedUniversity, isAdmin, isCoordinator, user]);

  // Inicializar seleções para coordenador automaticamente
  React.useEffect(() => {
    if (isCoordinator && user?.schoolId && user?.courses && filteredUniversities.length > 0) {
      const universityId = getFirstId(user.schoolId);
      const courseId = getCoordinatorCourseId(user);

      if (!selectedUniversity && universityId) {
        setSelectedUniversity(universityId);
      }
      if (!selectedCourse && courseId) {
        setSelectedCourse(courseId);
      }
    }
  }, [isCoordinator, user, filteredUniversities, selectedUniversity, selectedCourse]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedCourse) return;

    onSubmit({
      name: name.trim(),
      courseId: selectedCourse
    });

    // Reset dos campos
    setName("");
    if (isAdmin) {
      setSelectedUniversity("");
      setSelectedCourse("");
    }
    // Para coordenador, manter os selects com seus valores
  }, [name, selectedCourse, onSubmit, isAdmin]);

  if (loadingAcademicData) {
    return (
      <div className="space-y-4">
        <div className="text-white">Carregando dados acadêmicos...</div>
      </div>
    );
  }

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

      {/* Select de Universidade - Admin vê todas, Coordenador vê só a sua */}
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
          {filteredUniversities.map((uni) => (
            <option key={uni._id} value={uni._id}>{uni.name}</option>
          ))}
        </select>
      </div>

      {/* Select de Curso - Admin vê todos da universidade, Coordenador vê só o seu */}
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