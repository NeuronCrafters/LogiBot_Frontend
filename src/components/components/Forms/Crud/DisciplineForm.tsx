import React, { useState, useEffect } from "react";
import { publicApi } from "@/services/apiClient";
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";

export interface DisciplineData {
  name: string;
  courseId: string;
  classIds: string[];
  professorIds: string[];
}

export interface University {
  _id: string;
  name: string;
}

export interface Course {
  _id: string;
  name: string;
}

export interface ClassItem {
  _id: string;
  name: string;
}

export interface Professor {
  _id: string;
  name: string;
}

export interface DisciplineFormProps {
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

  useEffect(() => {
    if (selectedUniversity && selectedCourse) {
      publicApi.getClasses<ClassItem[]>(selectedUniversity, selectedCourse)
        .then((data) => setClasses(data))
        .catch(err => console.error("Erro ao carregar turmas:", err));
      publicApi.getProfessors<Professor[]>(selectedUniversity, selectedCourse)
        .then((data) => setProfessors(data))
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
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label className="block text-white mb-2">Nome da Disciplina:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="p-2 rounded w-full bg-[#141414] text-white"
        />
      </div>

      <div>
        <label className="block text-white mb-2">Universidade:</label>
        <select
          value={selectedUniversity}
          onChange={(e) => setSelectedUniversity(e.target.value)}
          required
          className="p-2 rounded w-full bg-[#141414] text-white"
        >
          <option value="">Selecione a universidade</option>
          {universities.map(uni => (
            <option key={uni._id} value={uni._id}>{uni.name}</option>
          ))}
        </select>
      </div>

      {selectedUniversity && (
        <div>
          <label className="block text-white mb-2">Curso:</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            required
            className="p-2 rounded w-full bg-[#141414] text-white"
          >
            <option value="">Selecione o curso</option>
            {courses.map(course => (
              <option key={course._id} value={course._id}>{course.name}</option>
            ))}
          </select>
        </div>
      )}

      {selectedCourse && (
        <>
          <div>
            <label className="block text-white mb-2">Turmas (Selecione uma ou mais):</label>
            <select
              multiple
              value={selectedClassIds}
              onChange={handleClassesChange}
              className="p-2 rounded w-full bg-[#141414] text-white"
            >
              {classes.map(cls => (
                <option key={cls._id} value={cls._id}>{cls.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-white mt-4 mb-2">Professores (Selecione um ou mais):</label>
            <select
              multiple
              value={selectedProfessorIds}
              onChange={handleProfessorsChange}
              className="p-2 rounded w-full bg-[#141414] text-white"
            >
              {professors.map(prof => (
                <option key={prof._id} value={prof._id}>{prof.name}</option>
              ))}
            </select>
          </div>
        </>
      )}

      <div className="pt-2">
        <ButtonCRUD
          action={initialData ? "update" : "create"}
          onClick={handleSubmit}
        />
      </div>
    </form>
  );
}

export { DisciplineForm };
