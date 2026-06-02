import React, { useState, useMemo, useCallback } from "react";
import { logger } from "@/utils/logger";
import { academicFiltersApi } from "@/services/apiClient";
import { EntityActionButton } from "@/components/Buttons/EntityActionButton";
import { University } from "@/services/api/api_academicFilters";

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
const selectCls =
  "h-11 w-full rounded-xl border border-white/10 bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white outline-none transition-colors focus:border-blue-500/60";

function CourseForm({ onSubmit, initialData }: CourseFormProps) {
  const [academicData, setAcademicData] = useState<{
    universities: University[];
  } | null>(null);

  const [name, setName] = useState(initialData?.name ?? "");
  const [universityId, setUniversityId] = useState(initialData?.universityId ?? "");

  useMemo(() => {
    const fetchAcademicData = async () => {
      try {
        const response = await academicFiltersApi.getAcademicData();
        setAcademicData(response.data);
      } catch (error) {
        logger.error("Admin", "Erro ao carregar dados acadêmicos.", error);
      }
    };
    fetchAcademicData();
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim() || !universityId) return;
      onSubmit({ name: name.trim(), universityId });
      setName("");
      setUniversityId("");
    },
    [name, universityId, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <div>
        <label className={labelCls}>Nome do Curso</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Ciência da Computação"
          required
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Universidade</label>
        <select
          value={universityId}
          onChange={(e) => setUniversityId(e.target.value)}
          required
          className={selectCls}
        >
          <option value="">Selecione a universidade</option>
          {academicData?.universities.map((uni) => (
            <option key={uni._id} value={uni._id}>
              {uni.name}
            </option>
          ))}
        </select>
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
