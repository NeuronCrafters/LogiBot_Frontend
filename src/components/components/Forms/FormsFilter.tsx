import React, { useState, useEffect } from 'react';
import axios from 'axios';
import type { FilterData, FilterType } from './FormsFilterTypes';
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";

interface FormsFilterProps {
  onSearch: (filterData: FilterData) => void;
}

function FormsFilter({ onSearch }: FormsFilterProps) {
  const [filterType, setFilterType] = useState<FilterType | ''>('');
  const [universities, setUniversities] = useState<{ _id: string; name: string }[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<string>('');
  const [courses, setCourses] = useState<{ _id: string; name: string }[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [disciplines, setDisciplines] = useState<{ _id: string; name: string }[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('');
  const [classes, setClasses] = useState<{ _id: string; name: string }[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');

  useEffect(() => {
    axios.get('http://localhost:3000/public/institutions')
      .then(response => {
        const unis = response.data.map((uni: any) => ({
          _id: uni._id,
          name: uni.name,
        }));
        setUniversities(unis);
      })
      .catch(error => console.error('Erro ao carregar universidades', error));
  }, []);

  useEffect(() => {
    if (
      selectedUniversity &&
      filterType &&
      ['courses', 'disciplines', 'classes', 'students-discipline', 'students-course'].includes(filterType)
    ) {
      axios.get(`http://localhost:3000/public/courses/${selectedUniversity}`)
        .then(response => setCourses(response.data))
        .catch(error => console.error('Erro ao carregar cursos', error));
    } else {
      setCourses([]);
      setSelectedCourse('');
    }
  }, [selectedUniversity, filterType]);

  useEffect(() => {
    if (
      selectedUniversity &&
      selectedCourse &&
      filterType &&
      ['disciplines', 'classes', 'students-discipline'].includes(filterType)
    ) {
      axios.get(`http://localhost:3000/public/disciplines/${selectedUniversity}/${selectedCourse}`)
        .then(response => setDisciplines(response.data))
        .catch(error => console.error('Erro ao carregar disciplinas', error));
    } else {
      setDisciplines([]);
      setSelectedDiscipline('');
    }
  }, [selectedUniversity, selectedCourse, filterType]);

  useEffect(() => {
    if (selectedUniversity && selectedCourse && filterType === 'classes') {
      axios.get(`http://localhost:3000/public/classes/${selectedUniversity}/${selectedCourse}`)
        .then(response => setClasses(response.data))
        .catch(error => console.error('Erro ao carregar turmas', error));
    } else {
      setClasses([]);
      setSelectedClass('');
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

  return (
    <div className="mb-4 p-4 border border-white rounded bg-[#141414]">
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block mb-1 text-white">Tipo de Filtro:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="border border-white p-2 rounded w-full bg-[#2a2a2a] text-white"
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
            <label className="block mb-1 text-white">Universidade:</label>
            <select
              value={selectedUniversity}
              onChange={(e) => setSelectedUniversity(e.target.value)}
              className="border border-white p-2 rounded w-full bg-[#2a2a2a] text-white"
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

        {filterType && ['courses', 'disciplines', 'classes', 'students-discipline', 'students-course'].includes(filterType) && (
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

        {filterType && ['disciplines', 'classes', 'students-discipline'].includes(filterType) && (
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

        {filterType === 'classes' && (
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

      <ButtonCRUD action="search" onClick={handleSearchClick} />
    </div>
  );
}

export { FormsFilter };
