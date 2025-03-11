import { useEffect, useState } from "react";
import api from "@/services/api";

interface FilterFormsProps {
  selectedEntity: string;
  selectedUniversity: string | null;
  setSelectedUniversity: (value: string | null) => void;
  selectedCourse: string | null;
  setSelectedCourse: (value: string | null) => void;
  fetchData: () => void;
}

export function FilterForms({
  selectedEntity,
  selectedUniversity,
  setSelectedUniversity,
  selectedCourse,
  setSelectedCourse,
  fetchData,
}: FilterFormsProps) {
  const [universities, setUniversities] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    fetchUniversities();
  }, []);

  useEffect(() => {
    if (selectedEntity === "course" || selectedEntity === "professor" || selectedEntity === "discipline") {
      fetchCourses();
    }
  }, [selectedEntity, selectedUniversity]);

  const fetchUniversities = async () => {
    try {
      const { data } = await api.get("/academic-institution/university");
      setUniversities(data);
    } catch (error) {
      console.error("Erro ao buscar universidades:", error);
    }
  };

  const fetchCourses = async () => {
    if (!selectedUniversity) return;
    try {
      const { data } = await api.get(`/academic-institution/course/${selectedUniversity}`);
      setCourses(data);
    } catch (error) {
      console.error("Erro ao buscar cursos:", error);
    }
  };

  return (
    <div className="flex gap-4">
      <select
        className="border p-2 rounded w-[280px] bg-[#3a3a3a] text-white"
        value={selectedEntity}
        onChange={(e) => {
          setSelectedUniversity(null);
          setSelectedCourse(null);
          fetchData();
        }}
      >
        <option value="university">Universidades</option>
        <option value="course">Cursos</option>
        <option value="class">Turmas</option>
        <option value="professor">Professores</option>
        <option value="discipline">Disciplinas</option>
      </select>

      {["course", "professor", "discipline"].includes(selectedEntity) && (
        <select
          className="border p-2 rounded w-[280px] bg-[#3a3a3a] text-white"
          value={selectedUniversity || ""}
          onChange={(e) => {
            setSelectedUniversity(e.target.value);
            setSelectedCourse(null);
            fetchCourses();
          }}
        >
          <option value="">Selecione uma Universidade</option>
          {universities.map((uni) => (
            <option key={uni._id} value={uni._id}>
              {uni.name}
            </option>
          ))}
        </select>
      )}

      {selectedEntity === "discipline" && selectedUniversity && (
        <select
          className="border p-2 rounded w-[280px] bg-[#3a3a3a] text-white"
          value={selectedCourse || ""}
          onChange={(e) => {
            setSelectedCourse(e.target.value);
            fetchData();
          }}
        >
          <option value="">Selecione um Curso</option>
          {courses.map((course) => (
            <option key={course._id} value={course._id}>
              {course.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
