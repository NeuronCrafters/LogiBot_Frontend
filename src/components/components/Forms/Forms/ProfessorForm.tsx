import React, { useState, useEffect } from "react";
import axios from "axios";

export interface ProfessorData {
  name: string;
  email: string;
  password: string;
  universityId: string;
  courseId?: string;
}

interface University {
  _id: string;
  name: string;
}

interface Course {
  _id: string;
  name: string;
}

interface ProfessorFormProps {
  onSubmit: (data: ProfessorData) => void;
  initialData?: ProfessorData;
}

function ProfessorForm({ onSubmit, initialData }: ProfessorFormProps) {
  const [name, setName] = useState<string>(initialData ? initialData.name : "");
  const [email, setEmail] = useState<string>(initialData ? initialData.email : "");
  const [password, setPassword] = useState<string>(initialData ? initialData.password || "" : "");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [universityId, setUniversityId] = useState<string>(initialData ? initialData.universityId : "");
  const [courseId, setCourseId] = useState<string>(initialData ? (initialData.courseId || "") : "");
  const [universities, setUniversities] = useState<University[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    axios
      .get("http://localhost:3000/public/institutions")
      .then((response) => {
        const data = response.data.map((uni: any) => ({
          _id: uni._id,
          name: uni.name,
        }));
        setUniversities(data);
      })
      .catch((err) => console.error("Erro ao carregar universidades:", err));
  }, []);

  useEffect(() => {
    if (universityId) {
      axios
        .get(`http://localhost:3000/public/courses/${universityId}`)
        .then((response) => setCourses(response.data))
        .catch((err) => console.error("Erro ao carregar cursos:", err));
    } else {
      setCourses([]);
      setCourseId("");
    }
  }, [universityId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim() || !universityId) return;
    onSubmit({
      name: name.trim(),
      email: email.trim(),
      password: password.trim(),
      universityId,
      courseId: courseId || undefined,
    });
    setName("");
    setEmail("");
    setPassword("");
    setUniversityId("");
    setCourseId("");
  };

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
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
      <label className="block text-white mt-4 mb-2">Email do Professor:</label>
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
          onClick={toggleShowPassword}
          className="absolute inset-y-0 right-0 flex items-center pr-2 text-sm text-gray-300"
        >
          {showPassword ? "Ocultar" : "Mostrar"}
        </button>
      </div>
      <label className="block text-white mt-4 mb-2">Universidade:</label>
      <select
        value={universityId}
        onChange={(e) => setUniversityId(e.target.value)}
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
      {universityId && courses.length > 0 && (
        <>
          <label className="block text-white mt-4 mb-2">Curso (opcional):</label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="p-2 rounded w-full bg-[#202020] text-white"
          >
            <option value="">Selecione o curso (opcional)</option>
            {courses.map((course) => (
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
