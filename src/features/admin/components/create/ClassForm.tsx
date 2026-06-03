import React, { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { academicFiltersApi } from "@/services/apiClient";
import { EntityActionButton } from "@/features/admin/components/EntityActionButton";

export interface ClassData {
  id?: string | number;
  _id?: string | number;
  name: string;
  courseId: string;
  disciplineIds?: string[];
}

export interface ClassFormProps {
  onSubmit: (data: ClassData) => void;
  initialData?: ClassData;
}

const labelCls = "block mb-1.5 font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500";
const inputCls = "h-11 w-full rounded-xl border border-white/10 bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white outline-none transition-colors focus:border-blue-500/60 placeholder:text-zinc-600";
const selectCls = "h-11 w-full rounded-xl border border-white/10 bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white outline-none transition-colors focus:border-blue-500/60";

function CheckboxList({ items, selected, onToggle, emptyText }: { items: { _id: string; name: string }[]; selected: string[]; onToggle: (id: string) => void; emptyText: string }) {
  if (items.length === 0) return <p className="px-3 py-2 text-sm text-zinc-600 font-[Poppins]">{emptyText}</p>;
  return (
    <div className="max-h-36 overflow-y-auto rounded-xl border border-white/10 bg-neutral-950/60 p-1.5 space-y-0.5">
      {items.map((item) => (
        <label key={item._id} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
          <input type="checkbox" checked={selected.includes(item._id)} onChange={() => onToggle(item._id)} className="accent-blue-500 w-3.5 h-3.5 shrink-0" />
          <span className="text-sm text-zinc-300 font-[Poppins] leading-snug">{item.name}</span>
        </label>
      ))}
    </div>
  );
}

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
  const [selectedDisciplineIds, setSelectedDisciplineIds] = useState<string[]>(initialData?.disciplineIds ?? []);

  const getFirstId = (value: string | string[] | undefined): string => {
    if (!value) return "";
    return Array.isArray(value) ? value[0] ?? "" : value;
  };

  const getCoordinatorCourseIds = (u: any): string[] => {
    if (!u?.courses || !Array.isArray(u.courses)) return [];
    return u.courses.map((course: any) => typeof course === "string" ? course : course?.id).filter(Boolean);
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
      const courseIds = getCoordinatorCourseIds(user);
      return courses.filter((c) => courseIds.includes(c._id));
    }
    return [];
  }, [academicData, selectedUniversity, isAdmin, isCoordinator, user]);

  const availableDisciplines = useMemo(() => {
    if (!academicData || !selectedCourse) return [];
    const uni = academicData.universities.find((u) => u.courses.some((c) => c._id === selectedCourse));
    return uni?.courses.find((c) => c._id === selectedCourse)?.disciplines ?? [];
  }, [academicData, selectedCourse]);

  React.useEffect(() => {
    if (isCoordinator && user?.schoolId && user?.courses && filteredUniversities.length > 0) {
      const uniId = getFirstId(user.schoolId);
      const courseId = getCoordinatorCourseIds(user)[0] || "";
      if (!selectedUniversity && uniId) setSelectedUniversity(uniId);
      if (!selectedCourse && courseId) setSelectedCourse(courseId);
    }
  }, [isCoordinator, user, filteredUniversities, selectedUniversity, selectedCourse]);

  const toggleDiscipline = useCallback((id: string) => setSelectedDisciplineIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]), []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedCourse) return;
    onSubmit({ name: name.trim(), courseId: selectedCourse, disciplineIds: selectedDisciplineIds });
    setName("");
    setSelectedDisciplineIds([]);
    if (isAdmin) { setSelectedUniversity(""); setSelectedCourse(""); }
  }, [name, selectedCourse, selectedDisciplineIds, onSubmit, isAdmin]);

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
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Turma A — 2024" required className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Universidade</label>
        <select value={selectedUniversity} onChange={(e) => { setSelectedUniversity(e.target.value); setSelectedCourse(""); setSelectedDisciplineIds([]); }} required className={selectCls}>
          <option value="">Selecione a universidade</option>
          {filteredUniversities.map((uni) => <option key={uni._id} value={uni._id}>{uni.name}</option>)}
        </select>
      </div>
      {selectedUniversity && (
        <div>
          <label className={labelCls}>Curso</label>
          <select value={selectedCourse} onChange={(e) => { setSelectedCourse(e.target.value); setSelectedDisciplineIds([]); }} required className={selectCls}>
            <option value="">Selecione o curso</option>
            {availableCourses.map((course) => <option key={course._id} value={course._id}>{course.name}</option>)}
          </select>
        </div>
      )}
      {selectedCourse && (
        <div>
          <label className={labelCls}>Disciplinas vinculadas {selectedDisciplineIds.length > 0 && <span className="normal-case tracking-normal text-blue-400 ml-1">({selectedDisciplineIds.length} selecionada{selectedDisciplineIds.length !== 1 ? "s" : ""})</span>}</label>
          <CheckboxList items={availableDisciplines} selected={selectedDisciplineIds} onToggle={toggleDiscipline} emptyText="Nenhuma disciplina disponível para este curso. Você pode criar a turma sem disciplinas e vincular depois." />
          <p className="mt-1.5 font-[Poppins] text-xs text-zinc-600">Cada disciplina selecionada gera um código de cadastro para alunos desta turma.</p>
        </div>
      )}
      <div className="pt-1">
        <EntityActionButton action={initialData ? "update" : "create"} onClick={handleSubmit} />
      </div>
    </form>
  );
}

export { ClassForm };
