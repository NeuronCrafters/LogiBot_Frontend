// src/components/components/Forms/FormsFilter.tsx
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-Auth";
import { publicApi } from "@/services/apiClient";
import type { FilterData, FilterType } from "@/@types/FormsFilterTypes";
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";

interface Institution { _id: string; name: string; }
interface Course { _id: string; name: string; }
interface Discipline { _id: string; name: string; }
interface ClassDataItem { _id: string; name: string; }

export function FormsFilter({
  onSearch,
  onReset,
}: {
  onSearch: (data: FilterData) => void;
  onReset: () => void;
}) {
  const { user } = useAuth();
  if (!user) return null;

  const userRoles = Array.isArray(user.role) ? user.role : [user.role];
  const isAdmin = userRoles.includes("admin");
  const isCoordinator = userRoles.includes("course-coordinator");
  const isProfessor = userRoles.includes("professor");

  const fixedUniversity = String(user.school);
  const fixedCourse = String(user.course);

  const allowedFilters: FilterType[] = isAdmin
    ? ["universities", "courses", "disciplines", "classes", "professors", "students", "students-course", "students-discipline"]
    : isCoordinator
      ? ["professors", "students-course", "students-discipline"]
      : isProfessor
        ? ["students-discipline"]
        : [];

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
  const [classes, setClasses] = useState<ClassDataItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");

  useEffect(() => {
    if (isAdmin) {
      publicApi.getInstitutions<Institution[]>()
        .then(setUniversities)
        .catch(console.error);
    }
  }, [isAdmin]);

  useEffect(() => {
    if ((isAdmin || isCoordinator) && filterType === "courses" && selectedUniversity) {
      publicApi.getCourses<Course[]>(selectedUniversity)
        .then(setCourses)
        .catch(console.error);
    } else {
      setCourses([]);
      if (isAdmin) setSelectedCourse("");
    }
  }, [filterType, selectedUniversity, isAdmin, isCoordinator]);

  useEffect(() => {
    if (
      ((filterType === "disciplines" && (isAdmin || isCoordinator)) ||
        (filterType === "students-discipline")) &&
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
  }, [filterType, selectedUniversity, selectedCourse, isAdmin, isCoordinator]);

  useEffect(() => {
    if (
      filterType === "classes" &&
      (isAdmin || isCoordinator) &&
      selectedUniversity &&
      selectedCourse
    ) {
      publicApi.getClasses<ClassDataItem[]>(selectedUniversity, selectedCourse)
        .then(setClasses)
        .catch(console.error);
    } else {
      setClasses([]);
      setSelectedClass("");
    }
  }, [filterType, selectedUniversity, selectedCourse, isAdmin, isCoordinator]);

  function handleSearchClick() {
    if (!filterType) return;
    onSearch({
      filterType,
      universityId:
        isCoordinator || isProfessor
          ? fixedUniversity
          : ["courses", "disciplines", "classes", "professors", "students-course", "students-discipline"].includes(filterType)
            ? selectedUniversity || undefined
            : undefined,
      courseId:
        isCoordinator || isProfessor
          ? fixedCourse
          : ["disciplines", "classes", "students-course", "students-discipline"].includes(filterType)
            ? selectedCourse || undefined
            : undefined,
      disciplineId:
        filterType === "students-discipline"
          ? selectedDiscipline || undefined
          : undefined,
      classId:
        filterType === "classes"
          ? selectedClass || undefined
          : undefined,
    });
  }

  function handleResetFilter() {
    setFilterType("");
    if (isAdmin) {
      setSelectedUniversity("");
      setSelectedCourse("");
      setSelectedDiscipline("");
      setSelectedClass("");
      setCourses([]);
      setDisciplines([]);
      setClasses([]);
    }
    onReset();
  }

  return (
    <div className="mb-4 p-4 rounded-md bg-[#181818]">
      <div className="flex flex-wrap gap-2 mb-4">
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
                {{
                  universities: "Universidades",
                  courses: "Cursos",
                  disciplines: "Disciplinas",
                  classes: "Turmas",
                  professors: "Professores",
                  students: "Alunos do Sistema",
                  "students-course": "Alunos por Curso",
                  "students-discipline": "Alunos por Disciplina",
                }[ft]}
              </option>
            ))}
          </select>
        </div>

        {isAdmin && filterType && (
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

        {isAdmin && filterType === "courses" && (
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


        {((filterType === "disciplines" && (isAdmin || isCoordinator)) ||
          filterType === "students-discipline") && (
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


        {filterType === "classes" && isAdmin && (
          <div className="flex-1 min-w-[200px]">
            <label className="block mb-1 text-white">Turma:</label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="w-full p-2 rounded-md bg-[#141414] text-white"
            >
              <option value="">Selecione a turma</option>
              {classes.map(cl => (
                <option key={cl._id} value={cl._id}>{cl.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <ButtonCRUD
          action="search"
          onClick={handleSearchClick}
          disabled={!filterType}
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
