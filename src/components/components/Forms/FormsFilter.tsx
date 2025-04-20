import { useState, useEffect } from "react";
import { publicApi } from "@/services/apiClient";
import type { FilterData, FilterType } from "@/@types/FormsFilterTypes";
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";

interface Institution {
  _id: string;
  name: string;
}

interface Course {
  _id: string;
  name: string;
}

interface Discipline {
  _id: string;
  name: string;
}

interface ClassDataItem {
  _id: string;
  name: string;
}

function FormsFilter({ onSearch, onReset }: { onSearch: (data: FilterData) => void; onReset: () => void; }) {
  const [filterType, setFilterType] = useState<FilterType | "">("");
  const [universities, setUniversities] = useState<Institution[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<string>("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("");
  const [classes, setClasses] = useState<ClassDataItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");

  useEffect(() => {
    publicApi
      .getInstitutions<Institution[]>()
      .then((data) => setUniversities(data))
      .catch((error) => console.error("Erro ao carregar universidades", error));
  }, []);

  useEffect(() => {
    if (
      selectedUniversity &&
      filterType &&
      ["courses", "disciplines", "classes", "students-discipline", "students-course"].includes(filterType)
    ) {
      publicApi
        .getCourses<Course[]>(selectedUniversity)
        .then((data) => setCourses(data))
        .catch((error) => console.error("Erro ao carregar cursos", error));
    } else {
      setCourses([]);
      setSelectedCourse("");
    }
  }, [selectedUniversity, filterType]);

  useEffect(() => {
    if (
      selectedUniversity &&
      selectedCourse &&
      filterType &&
      ["disciplines", "classes", "students-discipline"].includes(filterType)
    ) {
      publicApi
        .getDisciplines<Discipline[]>(selectedUniversity, selectedCourse)
        .then((data) => setDisciplines(data))
        .catch((error) => console.error("Erro ao carregar disciplinas", error));
    } else {
      setDisciplines([]);
      setSelectedDiscipline("");
    }
  }, [selectedUniversity, selectedCourse, filterType]);

  useEffect(() => {
    if (selectedUniversity && selectedCourse && filterType === "classes") {
      publicApi
        .getClasses<ClassDataItem[]>(selectedUniversity, selectedCourse)
        .then((data) => setClasses(data))
        .catch((error) => console.error("Erro ao carregar turmas", error));
    } else {
      setClasses([]);
      setSelectedClass("");
    }
  }, [selectedUniversity, selectedCourse, filterType]);

  function handleSearchClick() {
    const filterData: FilterData = {
      filterType,
      universityId: selectedUniversity || undefined,
      courseId: selectedCourse || undefined,
      disciplineId: selectedDiscipline || undefined,
      classId: selectedClass || undefined,
    };
    onSearch(filterData);
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
        <div className="flex-1 min-w-[200px]">
          <label className="block mb-1 text-white">Tipo de Filtro:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="font-Montserrat font-medium p-2 rounded-md w-full bg-[#202020] text-slate-100"
          >
            <option value="">Selecione o tipo de filtro</option>
            <option value="universities">Universidades</option>
            <option value="courses">Cursos da Universidade</option>
            <option value="disciplines">Disciplinas do Curso</option>
            <option value="classes">Turmas do Curso</option>
            <option value="professors">Professores da Universidade</option>
            <option value="students-discipline">Alunos da Disciplina</option>
            <option value="students-course">Alunos do Curso</option>
          </select>
        </div>

        {filterType && (
          <div className="flex-1 min-w-[200px]">
            <label className="block mb-1 text-slate-100">Universidade:</label>
            <select
              value={selectedUniversity}
              onChange={(e) => setSelectedUniversity(e.target.value)}
              className="p-2 rounded-md w-full bg-[#202020] text-slate-100 font-Montserrat font-medium"
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

        {filterType && ["courses", "disciplines", "classes", "students-discipline", "students-course"].includes(filterType) && (
          <div className="flex-1 min-w-[200px]">
            <label className="block mb-1 text-white">Curso:</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="border border-white p-2 rounded w-full bg-[#141414] text-white"
            >
              <option value="">Selecione o curso</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {filterType && ["disciplines", "classes", "students-discipline"].includes(filterType) && (
          <div className="flex-1 min-w-[200px]">
            <label className="block mb-1 text-white">Disciplina:</label>
            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="border border-white p-2 rounded w-full bg-[#141414] text-white"
            >
              <option value="">Selecione a disciplina</option>
              {disciplines.map((disc) => (
                <option key={disc._id} value={disc._id}>
                  {disc.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {filterType === "classes" && (
          <div className="flex-1 min-w-[200px]">
            <label className="block mb-1 text-white">Turma:</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="border border-white p-2 rounded w-full bg-[#141414] text-white"
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
