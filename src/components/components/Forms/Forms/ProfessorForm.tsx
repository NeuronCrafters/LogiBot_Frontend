import React, { useState, useEffect } from "react";
import { publicApi } from "@/services/apiClient";
import type { ProfessorData } from "@/@types/FormsDataTypes";

export interface University {
  _id: string;
  name: string;
}

export interface Course {
  _id: string;
  name: string;
}

export interface ProfessorFormProps {
  onSubmit: (data: ProfessorData) => void;
  initialData?: ProfessorData;
}

function ProfessorForm({ onSubmit, initialData }: ProfessorFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [password, setPassword] = useState(initialData?.password ?? "");
  const [school, setSchool] = useState(initialData?.school ?? "");
  const [courses, setCourses] = useState<string[]>(initialData?.courses ?? []);
  const [universities, setUniversities] = useState<University[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    publicApi.getInstitutions<University[]>()
      .then((data) => setUniversities(data))
      .catch((err) => console.error("Erro ao carregar universidades:", err));
  }, []);

  useEffect(() => {
    if (school) {
      publicApi.getCourses<Course[]>(school)
        .then((data) => setAvailableCourses(data))
        .catch((err) => console.error("Erro ao carregar cursos:", err));
    } else {
      setAvailableCourses([]);
      setCourses([]);
    }
  }, [school]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim() || !school || courses.length === 0) return;

    onSubmit({
      name: name.trim(),
      email: email.trim(),
      password: password.trim(),
      school,
      courses,
    });

    setName("");
    setEmail("");
    setPassword("");
    setSchool("");
    setCourses([]);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <label className="block text-white mb-2">Nome do Professor:</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="p-2 rounded w-full bg-[#202020] text-white"
      />

      <label className="block text-white mt-4 mb-2">Email:</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="p-2 rounded w-full bg-[#202020] text-white"
      />

      <label className="block text-white mt-4 mb-2">Senha:</label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="p-2 pr-10 rounded w-full bg-[#202020] text-white"
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute inset-y-0 right-0 flex items-center pr-2 text-sm text-gray-300"
        >
          {showPassword ? "Ocultar" : "Mostrar"}
        </button>
      </div>

      <label className="block text-white mt-4 mb-2">Universidade:</label>
      <select
        value={school}
        onChange={(e) => setSchool(e.target.value)}
        required
        className="p-2 rounded w-full bg-[#202020] text-white"
      >
        <option value="">Selecione a universidade</option>
        {universities.map((uni) => (
          <option key={uni._id} value={uni._id}>
            {uni.name}
          </option>
        ))}
      </select>

      {school && availableCourses.length > 0 && (
        <>
          <label className="block text-white mt-4 mb-2">Curso:</label>
          <select
            value={courses[0] ?? ""}
            onChange={(e) => setCourses([e.target.value])}
            required
            className="p-2 rounded w-full bg-[#202020] text-white"
          >
            <option value="">Selecione o curso</option>
            {availableCourses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.name}
              </option>
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

export { ProfessorForm };
