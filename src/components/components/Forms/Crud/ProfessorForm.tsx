import React, { useState, useMemo, useCallback } from "react";
import { academicFiltersApi } from "@/services/apiClient";
import type { ProfessorData } from "@/@types/FormsDataTypes";
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";
import { Eye, EyeOff } from "lucide-react";
import { University } from "@/services/api/api_academicFilters";

export interface ProfessorFormProps {
  onSubmit: (data: ProfessorData) => void;
  initialData?: ProfessorData;
}

function ProfessorForm({ onSubmit, initialData }: ProfessorFormProps) {
  const [academicData, setAcademicData] = useState<{
    universities: University[];
  } | null>(null);

  const [name, setName] = useState(initialData?.name ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [password, setPassword] = useState(initialData?.password ?? "");
  const [school, setSchool] = useState(initialData?.school ?? "");
  const [courses, setCourses] = useState<string[]>(initialData?.courses ?? []);
  const [showPassword, setShowPassword] = useState(false);

  // Carregar dados acadêmicos uma única vez
  useMemo(() => {
    const fetchAcademicData = async () => {
      try {
        const response = await academicFiltersApi.getAcademicData();
        setAcademicData(response.data);
      } catch (error) {
        console.error("Erro ao carregar dados acadêmicos:", error);
      }
    };
    fetchAcademicData();
  }, []);

  const availableCourses = useMemo(() => {
    if (!academicData || !school) return [];

    const university = academicData.universities.find(u => u._id === school);
    return university?.courses || [];
  }, [academicData, school]);

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

    setName("");
    setEmail("");
    setPassword("");
    setSchool("");
    setCourses([]);
  }, [name, email, password, school, courses, onSubmit]);

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label className="block text-white mb-2">Nome do Professor:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="p-2 rounded w-full bg-[#141414] text-white"
        />
      </div>

      <div>
        <label className="block text-white mb-2">Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="p-2 rounded w-full bg-[#141414] text-white"
        />
      </div>

      <div>
        <label className="block text-white mb-2">Senha:</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="p-2 pr-10 rounded w-full bg-[#141414] text-white"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex items-center pr-2 text-white"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-white mb-2">Universidade:</label>
        <select
          value={school}
          onChange={(e) => {
            setSchool(e.target.value);
            setCourses([]); // Reset courses quando universidade muda
          }}
          required
          className="p-2 rounded w-full bg-[#141414] text-white"
        >
          <option value="">Selecione a universidade</option>
          {academicData?.universities.map((uni) => (
            <option key={uni._id} value={uni._id}>
              {uni.name}
            </option>
          ))}
        </select>
      </div>

      {school && availableCourses.length > 0 && (
        <div>
          <label className="block text-white mb-2">Curso:</label>
          <select
            value={courses[0] ?? ""}
            onChange={(e) => setCourses([e.target.value])}
            required
            className="p-2 rounded w-full bg-[#141414] text-white"
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