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
  classes: Class[];
}

interface Discipline {
  _id: string;
  name: string;
  code: string;
}

interface Class {
  _id: string;
  name: string;
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

  const getFirstId = (value: string | string[] | undefined): string => {
    if (!value) return "";
    return Array.isArray(value) ? (value[0] || "") : value;
  };

  const fixedUniversity = getFirstId(user.schoolId) || String(user.school || "");

  const allowedFilters: FilterType[] = isAdmin
    ? [
      "universities", "courses", "disciplines", "classes",
      "professors", "students", "students-course", "students-discipline", "students-class",
    ]
    : isCoordinator
      ? [
        "professors", "disciplines", "classes", "students-discipline", "students-class",
      ]
      : isProfessor
        ? ["students-discipline", "students-class"]
        : [];

  const [filterType, setFilterType] = useState<FilterType | "">("");
  const [selectedUniversity, setSelectedUniversity] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");

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
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });

  const showUniversitySelect =
    isAdmin &&
    [
      "courses", "disciplines", "classes",
      "professors", "students-course", "students-discipline", "students-class",
    ].includes(filterType as FilterType);

  const showCourseSelect =
    (isAdmin || isCoordinator) &&
    [
      "disciplines", "classes",
      "students-course", "students-discipline", "students-class",
    ].includes(filterType as FilterType);

  const showStudentDisciplineSelect =
    (filterType === "students-discipline" || filterType === "students-class") &&
    (isAdmin || isCoordinator || isProfessor);

  const showStudentClassSelect =
    filterType === "students-class" &&
    (isAdmin || isCoordinator || isProfessor);

  const coordinatorNoSelect =
    isCoordinator &&
    ["professors"].includes(filterType as FilterType);

  let canSearch =
    !!filterType &&
    (!showUniversitySelect || !!selectedUniversity) &&
    (!showCourseSelect || !!selectedCourse) &&
    (!showStudentDisciplineSelect || !!selectedDiscipline) &&
    (!showStudentClassSelect || !!selectedClass);

  if (coordinatorNoSelect) canSearch = true;

  const universities: Institution[] = useMemo(() => {
    return academicData?.universities || [];
  }, [academicData]);

  const courses: Course[] = useMemo(() => {
    if (isAdmin && selectedUniversity && universities.length) {
      const university = universities.find(u => u._id === selectedUniversity);
      return university?.courses || [];
    }

    if ((isCoordinator || isProfessor) && fixedUniversity && universities.length) {
      const university = universities.find(u => u._id === fixedUniversity);
      return university?.courses || [];
    }

    return [];
  }, [universities, selectedUniversity, fixedUniversity, isAdmin, isCoordinator, isProfessor]);

  const disciplines: Discipline[] = useMemo(() => {
    if (selectedCourse) {
      const found = courses.find((c) => c._id === selectedCourse);
      return found?.disciplines || [];
    }

    return courses.flatMap((c) => c.disciplines || []);
  }, [courses, selectedCourse]);

  const classes = useMemo(() => {
    if (selectedCourse) {
      const found = courses.find((c) => c._id === selectedCourse);
      return found?.classes || [];
    }

    return courses.flatMap((c) => c.classes || []);
  }, [courses, selectedCourse]);

  useEffect(() => {
    if (!showCourseSelect) {
      setSelectedCourse("");
      setSelectedDiscipline("");
      setSelectedClass("");
    }
  }, [showCourseSelect]);

  useEffect(() => {
    if (!showStudentDisciplineSelect) {
      setSelectedDiscipline("");
    }
  }, [showStudentDisciplineSelect]);

  useEffect(() => {
    if (!showStudentClassSelect) {
      setSelectedClass("");
    }
  }, [showStudentClassSelect]);

  useEffect(() => {
    if ((isCoordinator || isProfessor) && fixedUniversity && !selectedUniversity) {
      setSelectedUniversity(fixedUniversity);
    }
  }, [isCoordinator, isProfessor, fixedUniversity, selectedUniversity]);

  function handleSearchClick() {
    if (!canSearch) return;

    const universityId = (isCoordinator || isProfessor)
      ? fixedUniversity
      : (showUniversitySelect ? selectedUniversity : undefined);

    console.log("vai buscar:", {
      filterType,
      universityId,
      courseId: showCourseSelect ? selectedCourse : undefined,
      disciplineId: showStudentDisciplineSelect ? selectedDiscipline : undefined,
      classId: showStudentClassSelect ? selectedClass : undefined,
    });

    onSearch({
      filterType,
      universityId: showUniversitySelect ? selectedUniversity : undefined,
      courseId: showCourseSelect ? selectedCourse : undefined,
      disciplineId: showStudentDisciplineSelect ? selectedDiscipline : undefined,
      classId: showStudentClassSelect ? selectedClass : undefined,
    });
  }


  function handleResetFilter() {
    setFilterType("");
    setSelectedCourse("");
    setSelectedDiscipline("");
    setSelectedClass("");
    if (isAdmin) {
      setSelectedUniversity("");
    }
    onReset();
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 mb-4 border rounded-xl bg-red-600/20 border-red-600/50"
      >
        <p className="mb-2 text-red-300">Erro ao carregar filtros</p>
        <button
          onClick={() => refetch()}
          className="text-sm text-red-200 underline hover:text-red-100"
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
        <div className="p-3 mb-4 border rounded-lg bg-blue-600/20 border-blue-600/50">
          <p className="text-sm text-blue-300">Carregando filtros...</p>
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block mb-1 text-sm font-medium text-white">Tipo de Filtro:</label>
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

        {showUniversitySelect && (
          <div className="flex-1 min-w-[200px]">
            <label className="block mb-1 text-sm font-medium text-white">Universidade:</label>
            <select
              value={selectedUniversity}
              onChange={(e) => {
                setSelectedUniversity(e.target.value);
                setSelectedCourse("");
                setSelectedDiscipline("");
                setSelectedClass("");
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

        {showCourseSelect && (
          <div className="flex-1 min-w-[200px]">
            <label className="block mb-1 text-sm font-medium text-white">Curso:</label>
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setSelectedDiscipline("");
                setSelectedClass("");
              }}
              className="w-full p-2 rounded-md bg-[#141414] text-white border border-white/10 focus:ring-2 focus:ring-white outline-none"
              disabled={loading || courses.length === 0}
            >
              <option value="">Selecione o curso</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {showStudentDisciplineSelect && (
          <div className="flex-1 min-w-[200px]">
            <label className="block mb-1 text-sm font-medium text-white">Disciplina:</label>
            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="w-full p-2 rounded-md bg-[#141414] text-white border border-white/10 focus:ring-2 focus:ring-white outline-none"
              disabled={loading || disciplines.length === 0}
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

        {showStudentClassSelect && (
          <div className="flex-1 min-w-[200px]">
            <label className="block mb-1 text-sm font-medium text-white">Turma:</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full p-2 rounded-md bg-[#141414] text-white border border-white/10 focus:ring-2 focus:ring-white outline-none"
              disabled={loading || classes.length === 0}
            >
              <option value="">Selecione a turma</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

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