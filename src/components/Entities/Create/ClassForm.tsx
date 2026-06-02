import React, { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-Auth";
import { Loader2 } from "lucide-react";
import { academicFiltersApi } from "@/services/apiClient";
import { EntityActionButton } from "@/components/Buttons/EntityActionButton";

export interface ClassData {
  id?: string | number;
  _id?: string | number;
  name: string;
  courseId: string;
}

export interface ClassFormProps {
  onSubmit: (data: ClassData) => void;
  initialData?: ClassData;
}

const labelCls =
  "block mb-1.5 font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500";
const inputCls =
  "h-11 w-full rounded-xl border border-white/10 bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white outline-none transition-colors focus:border-blue-500/60 placeholder:text-zinc-600";
const selectCls =
  "h-11 w-full rounded-xl border border-white/10 bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white outline-none transition-colors focus:border-blue-500/60";

function ClassForm({ onSubmit, initialData }: ClassFormProps) {
  const { user } = useAuth();

  const roles = Array.isArray(user?.role) ? user.role : [user?.role];
  const isAdmin = roles.includes("admin");
  const isCoordinator = roles.includes("course-coordinator");

  const { data: academicData, isLoading } = useQuery({
    queryKey: ["academicData"],
    queryFn: async () => {
      const response = await academicFiltersApi.getAcademicData();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const [name, setName] = useState(initialData?.name ?? "");
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(initialData?.courseId ?? "");

  const getFirstId = (value: string | string[] | undefined): string => {
    if (!value) return "";
    return Array.isArray(value) ? value[0] ?? "" : value;
  };

  const getCoordinatorCourseId = (u: any): string => {
    if (!u?.courses || !Array.isArray(u.courses)) return "";
    const first = u.courses[0];
    if (first?.id) return first.id;
    if (typeof first === "string") return first;
    return "";
  };

  const filteredUniversities = useMemo(() => {
    if (!academicData?.universities) return [];
    if (isAdmin) return academicData.universities;
    if (isCoordinator && user?.schoolId) {
      const id = getFirstId(user.schoolId);
      return academicData.universities.filter((u) => u._id === id);
    }
    return [];
  }, [academicData, isAdmin, isCoordinator, user]);

  const availableCourses = useMemo(() => {
    if (!academicData || !selectedUniversity) return [];
    const uni = academicData.universities.find((u) => u._id === selectedUniversity);
    const courses = uni?.courses ?? [];
    if (isAdmin) return courses;
    if (isCoordinator && user?.courses) {
      const courseId = getCoordinatorCourseId(user);
      return courses.filter((c) => c._id === courseId);
    }
    return [];
  }, [academicData, selectedUniversity, isAdmin, isCoordinator, user]);

  React.useEffect(() => {
    if (isCoordinator && user?.schoolId && user?.courses && filteredUniversities.length > 0) {
      const uniId = getFirstId(user.schoolId);
      const courseId = getCoordinatorCourseId(user);
      if (!selectedUniversity && uniId) setSelectedUniversity(uniId);
      if (!selectedCourse && courseId) setSelectedCourse(courseId);
    }
  }, [isCoordinator, user, filteredUniversities, selectedUniversity, selectedCourse]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim() || !selectedCourse) return;
      onSubmit({ name: name.trim(), courseId: selectedCourse });
      setName("");
      if (isAdmin) {
        setSelectedUniversity("");
        setSelectedCourse("");
      }
    },
    [name, selectedCourse, onSubmit, isAdmin]
  );

  if (isLoading) {
    return (
      <div className="mt-5 flex items-center gap-2 text-zinc-500 font-[Poppins] text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Carregando dados acadêmicos...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <div>
        <label className={labelCls}>Nome da Turma</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Turma A — 2024"
          required
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Universidade</label>
        <select
          value={selectedUniversity}
          onChange={(e) => {
            setSelectedUniversity(e.target.value);
            setSelectedCourse("");
          }}
          required
          className={selectCls}
        >
          <option value="">Selecione a universidade</option>
          {filteredUniversities.map((uni) => (
            <option key={uni._id} value={uni._id}>
              {uni.name}
            </option>
          ))}
        </select>
      </div>

      {selectedUniversity && (
        <div>
          <label className={labelCls}>Curso</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            required
            className={selectCls}
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

      <div className="pt-1">
        <EntityActionButton
          action={initialData ? "update" : "create"}
          onClick={handleSubmit}
        />
      </div>
    </form>
  );
}

export { ClassForm };
