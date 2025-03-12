import React, { useState, useEffect } from "react";
import axios from "axios";
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";

interface DisciplineFormProps {
  onSubmit: (item: any) => void;
  initialData?: any;
}

const DisciplineForm: React.FC<DisciplineFormProps> = ({ onSubmit, initialData }) => {
  const [name, setName] = useState(initialData?.name || "");
  const [universities, setUniversities] = useState<{ _id: string; name: string }[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState(initialData?.universityId || "");
  const [courses, setCourses] = useState<{ _id: string; name: string }[]>([]);
  const [selectedCourse, setSelectedCourse] = useState(initialData?.courseId || "");
  const [classes, setClasses] = useState<{ _id: string; name: string }[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>(initialData?.classIds || []);
  const [professors, setProfessors] = useState<{ _id: string; name: string }[]>([]);
  const [selectedProfessorIds, setSelectedProfessorIds] = useState<string[]>(initialData?.professorIds || []);

  // Carregar universidades
  useEffect(() => {
    axios.get("http://localhost:3000/academic-institution/university")
      .then(response => setUniversities(response.data))
      .catch(error => console.error("Erro ao carregar universidades", error));
  }, []);

  // Carregar cursos ao selecionar universidade
  useEffect(() => {
    if (selectedUniversity) {
      axios.get(`http://localhost:3000/academic-institution/course/${selectedUniversity}`)
        .then(response => setCourses(response.data))
        .catch(error => console.error("Erro ao carregar cursos", error));
    } else {
      setCourses([]);
      setSelectedCourse("");
    }
  }, [selectedUniversity]);

  // Carregar turmas e professores ao selecionar curso
  useEffect(() => {
    if (selectedCourse) {
      axios.get(`http://localhost:3000/academic-institution/class/${selectedCourse}`)
        .then(response => setClasses(response.data))
        .catch(error => console.error("Erro ao carregar turmas", error));

      axios.get("http://localhost:3000/admin/professors")
        .then(response => setProfessors(response.data))
        .catch(error => console.error("Erro ao carregar professores", error));
    } else {
      setClasses([]);
      setProfessors([]);
      setSelectedClassIds([]);
      setSelectedProfessorIds([]);
    }
  }, [selectedCourse]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:3000/academic-institution/discipline", {
        name,
        courseId: selectedCourse,
        classIds: selectedClassIds,
        professorIds: selectedProfessorIds,
      });

      setName("");
      setSelectedUniversity("");
      setSelectedCourse("");
      setSelectedClassIds([]);
      setSelectedProfessorIds([]);
      onSubmit(response.data);
    } catch (error) {
      console.error("Erro ao cadastrar disciplina:", error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <input
        type="text"
        placeholder="Nome da Disciplina"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2 rounded w-full bg-[#141414] text-white"
      />

      <label className="block mt-2">Universidade:</label>
      <select value={selectedUniversity} onChange={(e) => setSelectedUniversity(e.target.value)}
        className="border p-2 rounded w-full bg-[#141414] text-white">
        <option value="">Selecione a universidade</option>
        {universities.map(uni => <option key={uni._id} value={uni._id}>{uni.name}</option>)}
      </select>

      <label className="block mt-2">Curso:</label>
      <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}
        className="border p-2 rounded w-full bg-[#141414] text-white" disabled={!selectedUniversity}>
        <option value="">Selecione o curso</option>
        {courses.map(course => <option key={course._id} value={course._id}>{course.name}</option>)}
      </select>

      <label className="block mt-2">Turmas:</label>
      <select multiple value={selectedClassIds} onChange={(e) => setSelectedClassIds([...e.target.selectedOptions].map(o => o.value))}
        className="border p-2 rounded w-full bg-[#141414] text-white">
        {classes.map(cls => <option key={cls._id} value={cls._id}>{cls.name}</option>)}
      </select>

      <label className="block mt-2">Professores:</label>
      <select multiple value={selectedProfessorIds} onChange={(e) => setSelectedProfessorIds([...e.target.selectedOptions].map(o => o.value))}
        className="border p-2 rounded w-full bg-[#141414] text-white">
        {professors.map(prof => <option key={prof._id} value={prof._id}>{prof.name}</option>)}
      </select>

      <ButtonCRUD action="create" onClick={handleSubmit} />
    </form>
  );
};

export { DisciplineForm };
