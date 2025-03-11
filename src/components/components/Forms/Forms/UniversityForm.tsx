import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import api from "@/services/api";
import { BackButton } from "@/components/components/Button/BackButton";
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";
import toast from "react-hot-toast";

// Definição dos tipos
interface University {
  _id: string;
  name: string;
}

interface Course {
  _id: string;
  name: string;
  university: string;
}

interface Discipline {
  _id: string;
  name: string;
  course: string;
}

// Definição do tipo para os dados do formulário
interface UniversityFormData {
  name: string;
}

function UniversityForm() {
  const { register, handleSubmit, reset } = useForm<UniversityFormData>(); // Definição do tipo
  const [universities, setUniversities] = useState<University[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);

  useEffect(() => {
    fetchUniversities();
  }, []);

  useEffect(() => {
    if (selectedUniversity) fetchCourses(selectedUniversity);
  }, [selectedUniversity]);

  useEffect(() => {
    if (selectedUniversity && selectedCourse) fetchDisciplines(selectedUniversity, selectedCourse);
  }, [selectedUniversity, selectedCourse]);

  // 🔹 Busca todas as universidades
  const fetchUniversities = async () => {
    try {
      const response = await api.get<University[]>("/academic-institution/university");
      setUniversities(response.data);
    } catch (error) {
      console.error("Erro ao buscar universidades:", error);
      toast.error("Erro ao buscar universidades.");
    }
  };

  // 🔹 Busca os cursos de uma universidade específica
  const fetchCourses = async (universityId: string) => {
    try {
      const response = await api.get<Course[]>(`/academic-filtered/courses/${universityId}`);
      setCourses(response.data);
    } catch (error) {
      console.error("Erro ao buscar cursos:", error);
      toast.error("Erro ao buscar cursos.");
    }
  };

  // 🔹 Busca as disciplinas de um curso específico
  const fetchDisciplines = async (universityId: string, courseId: string) => {
    try {
      const response = await api.get<Discipline[]>(`/academic-filtered/disciplines/${universityId}/${courseId}`);
      setDisciplines(response.data);
    } catch (error) {
      console.error("Erro ao buscar disciplinas:", error);
      toast.error("Erro ao buscar disciplinas.");
    }
  };

  // 🔹 Função para enviar o formulário (agora tipada corretamente)
  const onSubmit: SubmitHandler<UniversityFormData> = async (data) => {
    try {
      await api.post("/academic-institution/university", data);
      toast.success("Universidade criada com sucesso!");
      reset();
      fetchUniversities(); // Atualiza a lista após criar
    } catch (error) {
      console.error("Erro ao criar universidade:", error);
      toast.error("Erro ao criar universidade.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-[#2a2a2a] p-6 rounded-lg shadow-md">
      {/* Campo de Nome da Universidade */}
      <input
        {...register("name")}
        placeholder="Nome da Universidade"
        className="border p-2 rounded w-full bg-[#3a3a3a] text-white placeholder-gray-400"
      />

      {/* Select de Universidade */}
      <select
        className="border p-2 rounded w-full bg-[#3a3a3a] text-white"
        value={selectedUniversity}
        onChange={(e) => setSelectedUniversity(e.target.value)}
      >
        <option value="">Selecione uma Universidade</option>
        {universities.map((uni) => (
          <option key={uni._id} value={uni._id}>{uni.name}</option>
        ))}
      </select>

      {/* Select de Curso (Aparece apenas se uma universidade for selecionada) */}
      {selectedUniversity && (
        <select
          className="border p-2 rounded w-full bg-[#3a3a3a] text-white"
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
        >
          <option value="">Selecione um Curso</option>
          {courses.map((course) => (
            <option key={course._id} value={course._id}>{course.name}</option>
          ))}
        </select>
      )}

      {/* Select de Disciplina (Aparece apenas se um curso for selecionado) */}
      {selectedCourse && (
        <select className="border p-2 rounded w-full bg-[#3a3a3a] text-white">
          <option value="">Selecione uma Disciplina</option>
          {disciplines.map((discipline) => (
            <option key={discipline._id} value={discipline._id}>{discipline.name}</option>
          ))}
        </select>
      )}

      {/* Botões de Ação */}
      <div className="flex justify-between">
        <BackButton />
        <ButtonCRUD action="create" onClick={handleSubmit(onSubmit)} />
      </div>
    </form>
  );
}

export default UniversityForm;
