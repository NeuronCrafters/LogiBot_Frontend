import React, { useState, useEffect } from "react";
import axios from "axios";
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";

interface ClassFormProps {
  onSubmit: (item: any) => void;
  initialData?: any;
}

const ClassForm: React.FC<ClassFormProps> = ({ onSubmit, initialData }) => {
  const [name, setName] = useState(initialData?.name || "");
  const [universities, setUniversities] = useState<{ _id: string; name: string }[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState(initialData?.universityId || "");
  const [courses, setCourses] = useState<{ _id: string; name: string }[]>([]);
  const [selectedCourse, setSelectedCourse] = useState(initialData?.courseId || "");

  useEffect(() => {
    axios.get("http://localhost:3000/academic-institution/university")
      .then(response => setUniversities(response.data))
      .catch(error => console.error("Erro ao carregar universidades", error));
  }, []);

  useEffect(() => {
    if (selectedUniversity) {
      axios.get(`http://localhost:3000/academic-institution/course/${selectedUniversity}`)
        .then(response => setCourses(response.data))
        .catch(error => console.error("Erro ao carregar cursos", error));
    }
  }, [selectedUniversity]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:3000/academic-institution/class", { name, courseId: selectedCourse });
      setName("");
      setSelectedUniversity("");
      setSelectedCourse("");
      onSubmit(response.data);
    } catch (error) {
      console.error("Erro ao cadastrar turma:", error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <input type="text" placeholder="Nome da Turma" value={name} onChange={(e) => setName(e.target.value)}
        className="border p-2 rounded w-full bg-[#141414] text-white" />

      <label className="block mt-2">Universidade:</label>
      <select value={selectedUniversity} onChange={(e) => setSelectedUniversity(e.target.value)}
        className="border p-2 rounded w-full bg-[#141414] text-white">
        <option value="">Selecione a universidade</option>
        {universities.map((uni) => (
          <option key={uni._id} value={uni._id}>{uni.name}</option>
        ))}
      </select>

      <label className="block mt-2">Curso:</label>
      <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}
        className="border p-2 rounded w-full bg-[#141414] text-white" disabled={!selectedUniversity}>
        <option value="">Selecione o curso</option>
        {courses.map((course) => (
          <option key={course._id} value={course._id}>{course.name}</option>
        ))}
      </select>

      <ButtonCRUD action="create" onClick={handleSubmit} />
    </form>
  );
};

export { ClassForm };
