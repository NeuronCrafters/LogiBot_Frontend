// src/components/components/Forms/FormsFilter.tsx
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-Auth";
import { publicApi } from "@/services/apiClient";
import type { FilterData, FilterType } from "@/@types/FormsFilterTypes";
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";

interface Institution { _id: string; name: string; }
interface Course { _id: string; name: string; }
interface Discipline { _id: string; name: string; }

export function FormsFilter({
  onSearch,
  onReset,
}: {
  onSearch: (data: FilterData) => void;
  onReset: () => void;
}) {
  const { user } = useAuth();
  if (!user) return null; // garante que user existe

  // roles do usuário
  const userRoles = Array.isArray(user.role) ? user.role : [user.role];
  const isAdmin = userRoles.includes("admin");
  const isCoordinator = userRoles.includes("course-coordinator");
  const isProfessor = userRoles.includes("professor");

  // IDs fixos para coordenador/professor
  const fixedUniversity = String(user.school);
  const fixedCourse = String(user.course);

  // filtros permitidos por papel
  const allowedFilters: FilterType[] = isAdmin
    ? ["universities", "courses", "disciplines", "classes", "professors", "students", "students-course", "students-discipline"]
    : isCoordinator
      ? ["professors", "students-course", "students-discipline"]
      : isProfessor
        ? ["students-discipline"]
        : [];

  // estados dos selects
  const [filterType, setFilterType] = useState<FilterType | "">("");
  const [universities, setUniversities] = useState<Institution[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<string>(
    isCoordinator || isProfessor ? fixedUniversity : ""
  );
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>(
    isCoordinator || isProfessor ? fixedCourse : ""
  );
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("");

  // define quais selects aparecem
  const showUniversitySelect = isAdmin && [
    "courses", "disciplines", "classes", "professors", "students-course", "students-discipline"
  ].includes(filterType as FilterType);

  const showCourseSelect = isAdmin && [
    "disciplines",
    "classes",
    "students-course",
    // Adicionado para alunos por disciplina
    "students-discipline",
  ].includes(filterType as FilterType);

  const showDisciplineSelect = filterType === "students-discipline";

  // habilita botão "Pesquisar" apenas quando todos os selects visíveis estiverem preenchidos
  const canSearch =
    !!filterType &&
    (!showUniversitySelect || !!selectedUniversity) &&
    (!showCourseSelect || !!selectedCourse) &&
    (!showDisciplineSelect || !!selectedDiscipline);

  // carrega universidades (só admin)
  useEffect(() => {
    if (isAdmin) {
      publicApi.getInstitutions<Institution[]>()
        .then(setUniversities)
        .catch(console.error);
    }
  }, [isAdmin]);

  // carrega cursos quando necessário
  useEffect(() => {
    if (showCourseSelect && selectedUniversity) {
      publicApi.getCourses<Course[]>(selectedUniversity)
        .then(setCourses)
        .catch(console.error);
    } else {
      setCourses([]);
      if (isAdmin) setSelectedCourse("");
    }
  }, [showCourseSelect, selectedUniversity, isAdmin]);

  // carrega disciplinas (só para students-discipline)
  useEffect(() => {
    if (
      showDisciplineSelect &&
      selectedUniversity &&
      selectedCourse
    ) {
      publicApi.getDisciplines<Discipline[]>(selectedUniversity, selectedCourse)
        .then(setDisciplines)
        .catch(console.error);
    } else {
      setDisciplines([]);
      setSelectedDiscipline("");
    }
  }, [showDisciplineSelect, selectedUniversity, selectedCourse]);

  function handleSearchClick() {
    if (!canSearch) return;
    onSearch({
      filterType,
      universityId:
        isCoordinator || isProfessor
          ? fixedUniversity
          : showUniversitySelect
            ? selectedUniversity
            : undefined,
      courseId:
        isCoordinator || isProfessor
          ? fixedCourse
          : showCourseSelect
            ? selectedCourse
            : undefined,
      disciplineId:
        showDisciplineSelect
          ? selectedDiscipline
          : undefined,
      classId: undefined, // sem filtro de turma
    });
  }

  function handleResetFilter() {
    setFilterType("");
    if (isAdmin) {
      setSelectedUniversity("");
      setSelectedCourse("");
      setSelectedDiscipline("");
      setCourses([]);
      setDisciplines([]);
    }
    onReset();
  }

  return (
    <div className="mb-4 p-4 rounded-md bg-[#181818]">
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Tipo de Filtro */}
        <div className="flex-1 min-w-[200px]">
          <label className="block mb-1 text-white">Tipo de Filtro:</label>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as FilterType)}
            className="w-full p-2 rounded-md bg-[#202020] text-slate-100"
          >
            <option value="">Selecione</option>
            {allowedFilters.map(ft => (
              <option key={ft} value={ft}>
                {({
                  universities: "Universidades",
                  courses: "Cursos",
                  disciplines: "Disciplinas",
                  classes: "Turmas",
                  professors: "Professores",
                  students: "Alunos do Sistema",
                  "students-course": "Alunos por Curso",
                  "students-discipline": "Alunos por Disciplina",
                } as Record<FilterType, string>)[ft]}
              </option>
            ))}
          </select>
        </div>

        {/* Universidade */}
        {showUniversitySelect && (
          <div className="flex-1 min-w-[200px]">
            <label className="block mb-1 text-slate-100">Universidade:</label>
            <select
              value={selectedUniversity}
              onChange={e => setSelectedUniversity(e.target.value)}
              className="w-full p-2 rounded-md bg-[#202020] text-slate-100"
            >
              <option value="">Selecione a universidade</option>
              {universities.map(u => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Curso */}
        {showCourseSelect && (
          <div className="flex-1 min-w-[200px]">
            <label className="block mb-1 text-white">Curso:</label>
            <select
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
              className="w-full p-2 rounded-md bg-[#141414] text-white"
            >
              <option value="">Selecione o curso</option>
              {courses.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Disciplina (apenas para alunos por disciplina) */}
        {showDisciplineSelect && (
          <div className="flex-1 min-w-[200px]">
            <label className="block mb-1 text-white">Disciplina:</label>
            <select
              value={selectedDiscipline}
              onChange={e => setSelectedDiscipline(e.target.value)}
              className="w-full p-2 rounded-md bg-[#141414] text-white"
            >
              <option value="">Selecione a disciplina</option>
              {disciplines.map(d => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <ButtonCRUD
          action="search"
          onClick={handleSearchClick}
          disabled={!canSearch}
        />
        <button
          onClick={handleResetFilter}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Recarregar
        </button>
      </div>
    </div>
  );
}
