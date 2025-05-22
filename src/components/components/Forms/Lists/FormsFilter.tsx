import { useState, useEffect, useMemo } from "react";
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

export function FormsFilter({
  onSearch,
  onReset,
}: {
  onSearch: (data: FilterData) => void;
  onReset: () => void;
}) {
  const { user } = useAuth();
  if (!user) return null;

  const roles = Array.isArray(user.role) ? user.role : [user.role];
  const isAdmin = roles.includes("admin");
  const isCoordinator = roles.includes("course-coordinator");
  const isProfessor = roles.includes("professor");

  const fixedUniversity = String(user.school);
  const fixedCourse = Array.isArray(user.courses) && user.courses.length > 0
    ? user.courses[0]
    : "";

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

  const [filterType, setFilterType] = useState<FilterType | "">("");
  const [selectedUniversity, setSelectedUniversity] = useState<string>(
    isCoordinator || isProfessor ? fixedUniversity : ""
  );
  const [selectedCourse, setSelectedCourse] = useState<string>(
    isCoordinator || isProfessor ? fixedCourse : ""
  );
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("");
  const [academicData, setAcademicData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  let canSearch =
    !!filterType &&
    (!showUniversitySelect || !!selectedUniversity) &&
    (!showCourseSelect || !!selectedCourse) &&
    (!showStudentDisciplineSelect || !!selectedDiscipline);

  if (coordinatorNoSelect) canSearch = true;

  useEffect(() => {
    const fetchAcademicData = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await academicFiltersApi.getAcademicData();
        setAcademicData(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados acadêmicos');
        console.error('Erro ao carregar dados acadêmicos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAcademicData();
  }, []); // ← UMA VEZ SÓ!

  // 2️⃣ useMemo para filtros locais (SUBSTITUEM as requisições)
  const universities: Institution[] = useMemo(() => {
    return academicData?.data.universities || [];
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

  // 3️⃣ useEffects simples para reset (OPCIONAL)
  useEffect(() => {
    // Reset curso quando não precisa mostrar o select
    if (!showCourseSelect && isAdmin) {
      setSelectedCourse("");
    }
  }, [showCourseSelect, isAdmin]);

  useEffect(() => {
    // Reset disciplina quando não precisa mostrar o select
    if (!showStudentDisciplineSelect) {
      setSelectedDiscipline("");
    }
  }, [showStudentDisciplineSelect]);


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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="mb-4 p-4 rounded-xl bg-[#1f1f1f] border border-white/10 shadow-lg"
    >
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block mb-1 text-white">Tipo de Filtro:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="w-full p-2 rounded-md bg-[#141414] text-white"
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
            <label className="block mb-1 text-white">Universidade:</label>
            <select
              value={selectedUniversity}
              onChange={(e) => setSelectedUniversity(e.target.value)}
              className="w-full p-2 rounded-md bg-[#141414] text-white"
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
            <label className="block mb-1 text-white">Curso:</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full p-2 rounded-md bg-[#141414] text-white"
              disabled={loading || (!selectedUniversity && isAdmin)}
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
            <label className="block mb-1 text-white">Disciplina:</label>
            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="w-full p-2 rounded-md bg-[#141414] text-white"
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
