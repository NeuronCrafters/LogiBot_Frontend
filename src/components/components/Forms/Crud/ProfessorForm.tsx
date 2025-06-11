import React, { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { academicFiltersApi } from "@/services/apiClient";
import type { ProfessorData } from "@/@types/FormsDataTypes";
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";
import { Eye, EyeOff } from "lucide-react";

export interface ProfessorFormProps {
  onSubmit: (data: ProfessorData) => void;
  initialData?: ProfessorData;
}

function ProfessorForm({ onSubmit, initialData }: ProfessorFormProps) {
  const { data: academicData, isLoading: loadingAcademicData, error } = useQuery({
    queryKey: ['academicData'],
    queryFn: async () => {
      const response = await academicFiltersApi.getAcademicData();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });

  const [name, setName] = useState(initialData?.name ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [password, setPassword] = useState(initialData?.password ?? "");
  const [school, setSchool] = useState(initialData?.school ?? "");
  const [courses, setCourses] = useState<string[]>(initialData?.courses ?? []);
  const [showPassword, setShowPassword] = useState(false);

  const availableCourses = useMemo(() => {
    if (!academicData?.universities || !school) return [];

    const university = academicData.universities.find(u => u._id === school);
    return university?.courses || [];
  }, [academicData, school]);

  // Handler para submit do formulário
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim() || !school || courses.length === 0) return;

    onSubmit({
      name: name.trim(),
      email: email.trim(),
      password: password.trim(),
      school,
      courses,
    });

    // Reset dos campos após submit
    setName("");
    setEmail("");
    setPassword("");
    setSchool("");
    setCourses([]);
  }, [name, email, password, school, courses, onSubmit]);

  // Handler para mudança de universidade
  const handleUniversityChange = useCallback((universityId: string) => {
    setSchool(universityId);
    setCourses([]); // Reset courses quando universidade muda
  }, []);

  // Estados de loading e erro
  if (loadingAcademicData) {
    return (
      <div className="mt-4 space-y-4">
        <div className="text-white">Carregando dados acadêmicos...</div>
        <div className="space-y-4">
          {/* Skeleton loading */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 rounded bg-white/10 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 mt-4 border rounded-lg bg-red-600/20 border-red-600/50">
        <p className="text-red-300">
          Erro ao carregar dados acadêmicos. Tente novamente.
        </p>
        <p className="mt-1 text-sm text-red-400">
          {error instanceof Error ? error.message : 'Erro desconhecido'}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      {/* Nome do Professor */}
      <div>
        <label className="block mb-2 text-white">Nome do Professor:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="p-2 rounded w-full bg-[#141414] text-white border border-white/10 focus:ring-2 focus:ring-white outline-none"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block mb-2 text-white">Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="p-2 rounded w-full bg-[#141414] text-white border border-white/10 focus:ring-2 focus:ring-white outline-none"
        />
      </div>

      {/* Senha com toggle de visibilidade */}
      <div>
        <label className="block mb-2 text-white">Senha:</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="p-2 pr-10 rounded w-full bg-[#141414] text-white border border-white/10 focus:ring-2 focus:ring-white outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex items-center pr-2 text-white transition-colors hover:text-gray-300"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Universidade */}
      <div>
        <label className="block mb-2 text-white">Universidade:</label>
        <select
          value={school}
          onChange={(e) => handleUniversityChange(e.target.value)}
          required
          className="p-2 rounded w-full bg-[#141414] text-white border border-white/10 focus:ring-2 focus:ring-white outline-none"
        >
          <option value="">Selecione a universidade</option>
          {academicData?.universities.map((uni) => (
            <option key={uni._id} value={uni._id}>
              {uni.name}
            </option>
          ))}
        </select>
      </div>

      {/* Curso (aparece apenas quando universidade selecionada) */}
      {school && availableCourses.length > 0 && (
        <div>
          <label className="block mb-2 text-white">Curso:</label>
          <select
            value={courses[0] ?? ""}
            onChange={(e) => setCourses(e.target.value ? [e.target.value] : [])}
            required
            className="p-2 rounded w-full bg-[#141414] text-white border border-white/10 focus:ring-2 focus:ring-white outline-none"
          >
            <option value="">Selecione o curso</option>
            {availableCourses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Aviso quando não há cursos disponíveis */}
      {school && availableCourses.length === 0 && (
        <div className="p-3 border rounded-lg bg-yellow-600/20 border-yellow-600/50">
          <p className="text-sm text-yellow-300">
            Nenhum curso encontrado para esta universidade.
          </p>
        </div>
      )}

      {/* Botão de submit */}
      <div className="pt-2">
        <ButtonCRUD
          action={initialData ? "update" : "create"}
          onClick={handleSubmit}
        />
      </div>
    </form>
  );
}

export { ProfessorForm };