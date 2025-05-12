import React, { useState, useEffect } from "react";
import { publicApi } from "@/services/apiClient";
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";

export interface ClassData {
  name: string;
  courseId: string;
}

export interface University {
  _id: string;
  name: string;
}

export interface Course {
  _id: string;
  name: string;
}

export interface ClassFormProps {
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
    publicApi.getInstitutions<University[]>()
      .then((data) => setUniversities(data))
      .catch(err => console.error("Erro ao carregar universidades:", err));
  }, []);

  useEffect(() => {
    if (selectedUniversity) {
      publicApi.getCourses<Course[]>(selectedUniversity)
        .then((data) => setCourses(data))
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white mb-1">Nome da Turma:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-md bg-[#141414] text-white px-3 py-2 outline-none border border-white/10 focus:ring-2 focus:ring-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-1">Universidade:</label>
        <select
          value={selectedUniversity}
          onChange={(e) => setSelectedUniversity(e.target.value)}
          required
          className="w-full rounded-md bg-[#141414] text-white px-3 py-2 outline-none border border-white/10"
        >
          <option value="">Selecione a universidade</option>
          {universities.map((uni) => (
            <option key={uni._id} value={uni._id}>{uni.name}</option>
          ))}
        </select>
      </div>

      {selectedUniversity && (
        <div>
          <label className="block text-sm font-medium text-white mb-1">Curso:</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            required
            className="w-full rounded-md bg-[#141414] text-white px-3 py-2 outline-none border border-white/10"
          >
            <option value="">Selecione o curso</option>
            {courses.map(course => (
              <option key={course._id} value={course._id}>{course.name}</option>
            ))}
          </select>
        </div>
      )}

      <ButtonCRUD action={initialData ? "update" : "create"} onClick={handleSubmit} />
    </form>
  );
}

export { ClassForm };
