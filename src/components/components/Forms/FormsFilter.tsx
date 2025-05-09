import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-Auth";
import { publicApi } from "@/services/apiClient";
import type { FilterData, FilterType } from "@/@types/FormsFilterTypes";
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";

interface Institution { _id: string; name: string; }
interface Course { _id: string; name: string; }
interface Discipline { _id: string; name: string; }
interface ClassDataItem { _id: string; name: string; }

const showUniversitySelectFor: FilterType[] = [
  "courses",
  "disciplines",
  "classes",
  "professors",
  "students-course",
  "students-discipline",
];
const showCourseSelectFor: FilterType[] = [
  "disciplines",
  "classes",
  "students-course",
  "students-discipline",
];
const showDisciplineSelectFor: FilterType[] = ["students-discipline"];
const showClassSelectFor: FilterType[] = ["classes"];

function FormsFilter({
  onSearch,
  onReset,
}: {
  onSearch: (data: FilterData) => void;
  onReset: () => void;
}) {
  const { user } = useAuth();
  const isAdmin = user?.role && (Array.isArray(user.role) ? user.role.includes("admin") : user.role === "admin");

  const [filterType, setFilterType] = useState<FilterType | "">("");
  const [universities, setUniversities] = useState<Institution[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState("");
  const [classes, setClasses] = useState<ClassDataItem[]>([]);
  const [selectedClass, setSelectedClass] = useState("");

  useEffect(() => {
    publicApi.getInstitutions<Institution[]>()
      .then(setUniversities)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (
      selectedUniversity &&
      showCourseSelectFor.includes(filterType as FilterType)
    ) {
      publicApi.getCourses<Course[]>(selectedUniversity)
        .then(setCourses)
        .catch(console.error);
    } else {
      setCourses([]);
      setSelectedCourse("");
    }
  }, [selectedUniversity, filterType]);

  useEffect(() => {
    if (
      selectedUniversity &&
      selectedCourse &&
      showDisciplineSelectFor.includes(filterType as FilterType)
    ) {
      publicApi.getDisciplines<Discipline[]>(selectedUniversity, selectedCourse)
        .then(setDisciplines)
        .catch(console.error);
    } else {
      setDisciplines([]);
      setSelectedDiscipline("");
    }
  }, [selectedUniversity, selectedCourse, filterType]);

  useEffect(() => {
    if (
      selectedUniversity &&
      selectedCourse &&
      showClassSelectFor.includes(filterType as FilterType)
    ) {
      publicApi.getClasses<ClassDataItem[]>(selectedUniversity, selectedCourse)
        .then(setClasses)
        .catch(console.error);
    } else {
      setClasses([]);
      setSelectedClass("");
    }
  }, [selectedUniversity, selectedCourse, filterType]);

  function handleSearchClick() {
    onSearch({
      filterType,
      universityId: showUniversitySelectFor.includes(filterType as FilterType)
        ? selectedUniversity || undefined
        : undefined,
      courseId: showCourseSelectFor.includes(filterType as FilterType)
        ? selectedCourse || undefined
        : undefined,
      disciplineId: showDisciplineSelectFor.includes(filterType as FilterType)
        ? selectedDiscipline || undefined
        : undefined,
      classId: showClassSelectFor.includes(filterType as FilterType)
        ? selectedClass || undefined
        : undefined,
    });
  }

  function handleResetFilter() {
    setFilterType("");
    setSelectedUniversity("");
    setCourses([]);
    setSelectedCourse("");
    setDisciplines([]);
    setSelectedDiscipline("");
    setClasses([]);
    setSelectedClass("");
    onReset();
  }

  return (
    <div className="mb-4 p-4 rounded-md bg-[#181818]">
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Tipo de filtro */}
        <div className="flex-1 min-w-[200px]">
          <label className="block mb-1 text-white">Tipo de Filtro:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="w-full p-2 rounded-md bg-[#202020] text-slate-100"
          >
            <option value="">Selecione o tipo de filtro</option>
            <option value="universities">Universidades</option>
            <option value="courses">Cursos</option>
            <option value="disciplines">Disciplinas</option>
            <option value="classes">Turmas</option>
            <option value="professors">Professores</option>
            {isAdmin && <option value="students">Alunos do Sistema</option>}
            <option value="students-course">Alunos por Curso</option>
            <option value="students-discipline">Alunos por Disciplina</option>
          </select>
        </div>

        {/* Universidade */}
        {showUniversitySelectFor.includes(filterType as FilterType) && (
          <div className="flex-1 min-w-[200px]">
            <label className="block mb-1 text-slate-100">Universidade:</label>
            <select
              value={selectedUniversity}
              onChange={(e) => setSelectedUniversity(e.target.value)}
              className="w-full p-2 rounded-md bg-[#202020] text-slate-100"
            >
              <option value="">Selecione a universidade</option>
              {universities.map((uni) => (
                <option key={uni._id} value={uni._id}>
                  {uni.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Curso */}
        {showCourseSelectFor.includes(filterType as FilterType) && (
          <div className="flex-1 min-w-[200px]">
            <label className="block mb-1 text-white">Curso:</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full p-2 rounded-md bg-[#141414] text-white"
            >
              <option value="">Selecione o curso</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Disciplina */}
        {showDisciplineSelectFor.includes(filterType as FilterType) && (
          <div className="flex-1 min-w-[200px]">
            <label className="block mb-1 text-white">Disciplina:</label>
            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="w-full p-2 rounded-md bg-[#141414] text-white"
            >
              <option value="">Selecione a disciplina</option>
              {disciplines.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Turma */}
        {showClassSelectFor.includes(filterType as FilterType) && (
          <div className="flex-1 min-w-[200px]">
            <label className="block mb-1 text-white">Turma:</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full p-2 rounded-md bg-[#141414] text-white"
            >
              <option value="">Selecione a turma</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <ButtonCRUD action="search" onClick={handleSearchClick} />
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

export { FormsFilter };
