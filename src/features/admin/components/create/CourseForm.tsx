import React, { useCallback, useEffect, useState } from "react";
import { logger } from "@/shared/lib/logger";
import { academicFiltersApi } from "@/services/apiClient";
import { EntityActionButton } from "@/features/admin/components/EntityActionButton";
import { University } from "@/features/academic/api/academicFiltersApi";
import { Select } from "@/components/ui/select";

export interface CourseData {
  id?: string | number;
  name: string;
  universityId: string;
}

export interface CourseFormProps {
  onSubmit: (data: CourseData) => void;
  initialData?: CourseData;
}

const labelCls =
  "block mb-1.5 font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500";
const inputCls =
  "h-11 w-full rounded-xl border border-white/10 bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white outline-none transition-colors focus:border-blue-500/60 placeholder:text-zinc-600";

function CourseForm({ onSubmit, initialData }: CourseFormProps) {
  const [academicData, setAcademicData] = useState<{
    universities: University[];
  } | null>(null);
  const [name, setName] = useState(initialData?.name ?? "");
  const [universityId, setUniversityId] = useState(
    initialData?.universityId ?? "",
  );

  useEffect(() => {
    const fetchAcademicData = async () => {
      try {
        const response = await academicFiltersApi.getAcademicData();
        setAcademicData(response.data);
      } catch (error) {
        logger.error("Admin", "Erro ao carregar dados academicos.", error);
      }
    };
    fetchAcademicData();
  }, []);

  useEffect(() => {
    setName(initialData?.name ?? "");
    setUniversityId(initialData?.universityId ?? "");
  }, [initialData]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim() || !universityId) return;
      onSubmit({ name: name.trim(), universityId });
      if (!initialData) {
        setName("");
        setUniversityId("");
      }
    },
    [name, universityId, onSubmit, initialData],
  );

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <div>
        <label className={labelCls}>Nome do Curso</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Ciencia da Computacao"
          required
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>Universidade</label>
        <Select
          value={universityId}
          onChange={(v) => setUniversityId(v)}
          options={(academicData?.universities ?? []).map((uni) => ({ value: uni._id, label: uni.name }))}
          placeholder="Selecione a universidade"
        />
      </div>
      <div className="pt-1">
        <EntityActionButton
          action={initialData ? "update" : "create"}
          onClick={handleSubmit}
        />
      </div>
    </form>
  );
}

export { CourseForm };
