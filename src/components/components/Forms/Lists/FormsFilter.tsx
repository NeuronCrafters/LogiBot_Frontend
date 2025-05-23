import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-Auth";
import { academicFiltersApi } from "@/services/apiClient";
import type { FilterData, FilterType } from "@/@types/ChartsType";
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";
import { motion } from "framer-motion";

interface Institution {
  _id: string;
  name: string;
  courses: Course[];
}

interface Course {
  _id: string;
  name: string;
  disciplines: Discipline[];
}

interface Discipline {
  _id: string;
  name: string;
  code: string;
}

interface FormsFilterProps {
  onSearch: (data: FilterData) => void;
  onReset: () => void;
}

export function FormsFilter({ onSearch, onReset }: FormsFilterProps) {
  const { user } = useAuth();

  if (!user) return null;

  const roles = Array.isArray(user.role) ? user.role : [user.role];
  const isAdmin = roles.includes("admin");
  const isCoordinator = roles.includes("course-coordinator");
  const isProfessor = roles.includes("professor");

  // Helper para extrair IDs do usuário
  const getFirstId = (value: string | string[] | undefined): string => {
    if (!value) return "";
    return Array.isArray(value) ? (value[0] || "") : value;
  };

  const fixedUniversity = getFirstId(user.schoolId) || String(user.school || "");
  const fixedCourse = getFirstId(user.courseId) || (
    Array.isArray(user.courses) && user.courses.length > 0
      ? user.courses[0]
      : ""
  );

  const allowedFilters: FilterType[] = isAdmin
    ? [
      "universities", "courses", "disciplines", "classes",
      "professors", "students", "students-course", "students-discipline",
    ]
    : isCoordinator
      ? [
        "professors", "disciplines", "classes",
        "students-course", "students-discipline",
      ]
      : isProfessor
        ? ["students-discipline"]
        : [];

  // Estados do formulário
  const [filterType, setFilterType] = useState<FilterType | "">("");
  const [selectedUniversity, setSelectedUniversity] = useState<string>(
    isCoordinator || isProfessor ? fixedUniversity : ""
  );
  const [selectedCourse, setSelectedCourse] = useState<string>(
    isCoordinator || isProfessor ? fixedCourse : ""
  );
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("");

  // Query para buscar dados acadêmicos com cache
  const {
    data: academicData,
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: ['academicData'],
    queryFn: async () => {
      const response = await academicFiltersApi.getAcademicData();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000,   // 10 minutos
    retry: 2,
    retryDelay: 1000,
  });

  // Lógica de exibição dos selects
  const showUniversitySelect =
    isAdmin &&
    [
      "courses", "disciplines", "classes",
      "professors", "students-course", "students-discipline",
    ].includes(filterType as FilterType);

  const showCourseSelect =
    isAdmin &&
    [
      "disciplines", "classes",
      "students-course", "students-discipline",
    ].includes(filterType as FilterType);

  const showStudentDisciplineSelect =
    filterType === "students-discipline" &&
    (isAdmin || isCoordinator || isProfessor);

  const coordinatorNoSelect =
    isCoordinator &&
    ["professors", "disciplines", "classes"].includes(filterType as FilterType);

  // Validação para habilitar busca
  let canSearch =
    !!filterType &&
    (!showUniversitySelect || !!selectedUniversity) &&
    (!showCourseSelect || !!selectedCourse) &&
    (!showStudentDisciplineSelect || !!selectedDiscipline);

  if (coordinatorNoSelect) canSearch = true;

  // Filtros computados com useMemo
  const universities: Institution[] = useMemo(() => {
    return academicData?.universities || [];
  }, [academicData]);

  const courses: Course[] = useMemo(() => {
    if (!selectedUniversity || !universities.length) return [];

    const university = universities.find(u => u._id === selectedUniversity);
    return university?.courses || [];
  }, [universities, selectedUniversity]);

  const disciplines: Discipline[] = useMemo(() => {
    if (!selectedCourse || !courses.length) return [];

    const course = courses.find(c => c._id === selectedCourse);
    return course?.disciplines || [];
  }, [courses, selectedCourse]);

  // Effects para reset de campos
  useEffect(() => {
    if (!showCourseSelect && isAdmin) {
      setSelectedCourse("");
    }
  }, [showCourseSelect, isAdmin]);

  useEffect(() => {
    if (!showStudentDisciplineSelect) {
      setSelectedDiscipline("");
    }
  }, [showStudentDisciplineSelect]);

  // Handlers
  function handleSearchClick() {
    if (!canSearch) return;

    onSearch({
      filterType,
      universityId: isCoordinator || isProfessor ? fixedUniversity : showUniversitySelect ? selectedUniversity : undefined,
      courseId: isCoordinator || isProfessor ? fixedCourse : showCourseSelect ? selectedCourse : undefined,
      disciplineId: showStudentDisciplineSelect ? selectedDiscipline : undefined,
      classId: undefined,
    });
  }

  function handleResetFilter() {
    setFilterType("");
    if (isAdmin) {
      setSelectedUniversity("");
      setSelectedCourse("");
      setSelectedDiscipline("");
    }
    onReset();
  }

  // Estados de loading e erro
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 p-4 rounded-xl bg-red-600/20 border border-red-600/50"
      >
        <p className="text-red-300 mb-2">Erro ao carregar filtros</p>
        <button
          onClick={() => refetch()}
          className="text-red-200 underline text-sm hover:text-red-100"
        >
          Tentar novamente
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="mb-4 p-4 rounded-xl bg-[#1f1f1f] border border-white/10 shadow-lg"
    >
      {loading && (
        <div className="mb-4 p-3 bg-blue-600/20 border border-blue-600/50 rounded-lg">
          <p className="text-blue-300 text-sm">Carregando filtros...</p>
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-4">
        {/* Tipo de Filtro */}
        <div className="flex-1 min-w-[200px]">
          <label className="block mb-1 text-white text-sm font-medium">Tipo de Filtro:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="w-full p-2 rounded-md bg-[#141414] text-white border border-white/10 focus:ring-2 focus:ring-white outline-none"
            disabled={loading}
          >
            <option value="">Selecione</option>
            {allowedFilters.map((ft) => (
              <option key={ft} value={ft}>
                {{
                  universities: "Universidades",
                  courses: "Cursos",
                  disciplines: "Disciplinas",
                  classes: "Turmas",
                  professors: "Professores",
                  students: "Alunos do Sistema",
                  "students-course": "Alunos por Curso",
                  "students-discipline": "Alunos por Disciplina",
                  "students-class": "Alunos por Turma",
                }[ft] || ft}
              </option>
            ))}
          </select>
        </div>

        {/* Select de Universidade */}
        {showUniversitySelect && (
          <div className="flex-1 min-w-[200px]">
            <label className="block mb-1 text-white text-sm font-medium">Universidade:</label>
            <select
              value={selectedUniversity}
              onChange={(e) => {
                setSelectedUniversity(e.target.value);
                setSelectedCourse(""); // Reset curso
                setSelectedDiscipline(""); // Reset disciplina
              }}
              className="w-full p-2 rounded-md bg-[#141414] text-white border border-white/10 focus:ring-2 focus:ring-white outline-none"
              disabled={loading}
            >
              <option value="">Selecione a universidade</option>
              {universities.map((u) => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Select de Curso */}
        {showCourseSelect && (
          <div className="flex-1 min-w-[200px]">
            <label className="block mb-1 text-white text-sm font-medium">Curso:</label>
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setSelectedDiscipline(""); // Reset disciplina
              }}
              className="w-full p-2 rounded-md bg-[#141414] text-white border border-white/10 focus:ring-2 focus:ring-white outline-none"
              disabled={loading || (!selectedUniversity && isAdmin)}
            >
              <option value="">Selecione o curso</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Select de Disciplina */}
        {showStudentDisciplineSelect && (
          <div className="flex-1 min-w-[200px]">
            <label className="block mb-1 text-white text-sm font-medium">Disciplina:</label>
            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="w-full p-2 rounded-md bg-[#141414] text-white border border-white/10 focus:ring-2 focus:ring-white outline-none"
              disabled={loading || (!selectedCourse && (isAdmin || isCoordinator))}
            >
              <option value="">Selecione a disciplina</option>
              {disciplines.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} {d.code && `(${d.code})`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Aviso para coordenadores */}
      {(isCoordinator || isProfessor) && filterType && (
        <div className="mb-4 p-3 bg-yellow-600/20 border border-yellow-600/50 rounded-lg">
          <p className="text-yellow-300 text-sm">
            {isCoordinator
              ? "Você está restrito aos dados do seu curso"
              : "Você está restrito às suas disciplinas"}
          </p>
        </div>
      )}

      {/* Botões de ação */}
      <div className="flex gap-2">
        <ButtonCRUD
          action="search"
          onClick={handleSearchClick}
          disabled={!canSearch || loading}
        />
        <ButtonCRUD
          action="reload"
          onClick={handleResetFilter}
          disabled={loading}
        />
      </div>
    </motion.div>
  );
}