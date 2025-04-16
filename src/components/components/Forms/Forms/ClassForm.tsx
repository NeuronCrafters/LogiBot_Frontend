import React, { useState, useEffect } from "react";
import axios from "axios";

export interface ClassData {
  name: string;
  courseId: string;
}

interface University {
  _id: string;
  name: string;
}

interface Course {
  _id: string;
  name: string;
}

interface ClassFormProps {
  onSubmit: (data: ClassData) => void;
  initialData?: ClassData;
}

function ClassForm({ onSubmit, initialData }: ClassFormProps) {
  const [name, setName] = useState<string>(initialData ? initialData.name : "");
  const [selectedUniversity, setSelectedUniversity] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>(initialData ? initialData.courseId : "");
  const [universities, setUniversities] = useState<University[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedCourse) return;
    onSubmit({ name: name.trim(), courseId: selectedCourse });
    setName("");
    setSelectedUniversity("");
    setSelectedCourse("");
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <label className="block text-white mb-2">Nome da Turma:</label>
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
      <button
        type="submit"
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        {initialData ? "Atualizar" : "Cadastrar"}
      </button>
    </form>
  );
}


export { ClassForm };
