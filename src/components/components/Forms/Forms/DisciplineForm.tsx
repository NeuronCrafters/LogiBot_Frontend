import React, { useState, useEffect } from "react";
import axios from "axios";

export interface DisciplineData {
  name: string;
  courseId: string;
  classIds: string[];
  professorIds: string[];
}

interface University {
  _id: string;
  name: string;
}

interface Course {
  _id: string;
  name: string;
}

interface ClassItem {
  _id: string;
  name: string;
}

interface Professor {
  _id: string;
  name: string;
}

interface DisciplineFormProps {
  onSubmit: (data: DisciplineData) => void;
  initialData?: DisciplineData;
}

function DisciplineForm({ onSubmit, initialData }: DisciplineFormProps) {
  const [name, setName] = useState<string>(initialData ? initialData.name : "");
  const [selectedUniversity, setSelectedUniversity] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>(initialData ? initialData.courseId : "");
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>(initialData ? initialData.classIds : []);
  const [selectedProfessorIds, setSelectedProfessorIds] = useState<string[]>(initialData ? initialData.professorIds : []);

  const [universities, setUniversities] = useState<University[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);

  useEffect(() => {
    axios.get("http://localhost:3000/public/institutions")
      .then(response => {
        const data = response.data.map((uni: any) => ({
          _id: uni._id,
          name: uni.name
        }));
        setUniversities(data);
      })
      .catch(err => console.error("Erro ao carregar universidades:", err));
  }, []);

  useEffect(() => {
    if (selectedUniversity) {
      axios.get(`http://localhost:3000/public/courses/${selectedUniversity}`)
        .then(response => setCourses(response.data))
        .catch(err => console.error("Erro ao carregar cursos:", err));
    } else {
      setCourses([]);
      setSelectedCourse("");
    }
  }, [selectedUniversity]);

  useEffect(() => {
    if (selectedUniversity && selectedCourse) {
      axios.get(`http://localhost:3000/public/classes/${selectedUniversity}/${selectedCourse}`)
        .then(response => setClasses(response.data))
        .catch(err => console.error("Erro ao carregar turmas:", err));

      axios.get(`http://localhost:3000/public/professors/${selectedUniversity}/${selectedCourse}`)
        .then(response => setProfessors(response.data))
        .catch(err => console.error("Erro ao carregar professores:", err));
    } else {
      setClasses([]);
      setProfessors([]);
      setSelectedClassIds([]);
      setSelectedProfessorIds([]);
    }
  }, [selectedUniversity, selectedCourse]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedCourse) return;
    onSubmit({
      name: name.trim(),
      courseId: selectedCourse,
      classIds: selectedClassIds,
      professorIds: selectedProfessorIds
    });
    setName("");
    setSelectedUniversity("");
    setSelectedCourse("");
    setSelectedClassIds([]);
    setSelectedProfessorIds([]);
  };

  const handleClassesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.options).filter(option => option.selected);
    setSelectedClassIds(options.map(option => option.value));
  };

  const handleProfessorsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.options).filter(option => option.selected);
    setSelectedProfessorIds(options.map(option => option.value));
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <label className="block text-white mb-2">Nome da Disciplina:</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="p-2 rounded w-full bg-[#202020] text-white"
      />

      <label className="block text-white mt-4 mb-2">Universidade:</label>
      <select
        value={selectedUniversity}
        onChange={(e) => setSelectedUniversity(e.target.value)}
        required
        className="p-2 rounded w-full bg-[#202020] text-white"
      >
        <option value="">Selecione a universidade</option>
        {universities.map(uni => (
          <option key={uni._id} value={uni._id}>{uni.name}</option>
        ))}
      </select>

      {selectedUniversity && (
        <>
          <label className="block text-white mt-4 mb-2">Curso:</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            required
            className="p-2 rounded w-full bg-[#202020] text-white"
          >
            <option value="">Selecione o curso</option>
            {courses.map(course => (
              <option key={course._id} value={course._id}>{course.name}</option>
            ))}
          </select>
        </>
      )}

      {selectedCourse && (
        <>
          <label className="block text-white mt-4 mb-2">Turmas (Selecione uma ou mais):</label>
          <select
            multiple
            value={selectedClassIds}
            onChange={handleClassesChange}
            className="p-2 rounded w-full bg-[#202020] text-white"
          >
            {classes.map(cls => (
              <option key={cls._id} value={cls._id}>{cls.name}</option>
            ))}
          </select>

          <label className="block text-white mt-4 mb-2">Professores (Selecione um ou mais):</label>
          <select
            multiple
            value={selectedProfessorIds}
            onChange={handleProfessorsChange}
            className="p-2 rounded w-full bg-[#202020] text-white"
          >
            {professors.map(prof => (
              <option key={prof._id} value={prof._id}>{prof.name}</option>
            ))}
          </select>
        </>
      )}

      <button
        type="submit"
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        {initialData ? "Atualizar" : "Cadastrar"}
      </button>
    </form>
  );
}


export { DisciplineForm };
