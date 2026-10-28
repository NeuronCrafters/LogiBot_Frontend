import { t, useLocale } from "@/i18n";
import React, { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { academicFiltersApi } from "@/services/apiClient";
import { EntityActionButton } from "@/features/admin/components/EntityActionButton";
import { Select } from "@/components/ui/select";

export interface DisciplineData {
  id?: string | number;
  _id?: string | number;
  name: string;
  universityId?: string;
  courseId: string;
  classIds: string[];
  professorIds: string[];
}

export interface DisciplineFormProps {
  onSubmit: (data: DisciplineData) => void;
  initialData?: DisciplineData;
}

const labelCls =
  "block mb-1.5 font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500";
const inputCls =
  "h-11 w-full rounded-xl border border-white/10 bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white outline-none transition-colors focus:border-blue-500/60 placeholder:text-zinc-600";

function CheckboxList({
  items,
  selected,
  onToggle,
  emptyText,
}: {
  items: { _id: string; name: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  emptyText: string;
}) {
  useLocale();

  if (items.length === 0)
    return (
      <p className="px-3 py-2 text-sm text-zinc-600 font-[Poppins]">
        {emptyText}
      </p>
    );
  return (
    <div className="max-h-36 overflow-y-auto rounded-xl border border-white/10 bg-neutral-950/60 p-1.5 space-y-0.5">
      {items.map((item) => (
        <label
          key={item._id}
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
        >
          <input
            type="checkbox"
            checked={selected.includes(item._id)}
            onChange={() => onToggle(item._id)}
            className="accent-blue-500 w-3.5 h-3.5 shrink-0"
          />
          <span className="text-sm text-zinc-300 font-[Poppins] leading-snug">
            {item.name}
          </span>
        </label>
      ))}
    </div>
  );
}

function DisciplineForm({ onSubmit, initialData }: DisciplineFormProps) {
  const locale = useLocale();

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
  const [selectedCourse, setSelectedCourse] = useState(
    initialData?.courseId ?? "",
  );
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>(
    initialData?.classIds ?? [],
  );
  const [selectedProfessorIds, setSelectedProfessorIds] = useState<string[]>(
    initialData?.professorIds ?? [],
  );

  React.useEffect(() => {
    if (!initialData) return;
    setName(initialData.name ?? "");
    setSelectedUniversity(initialData.universityId ?? "");
    setSelectedCourse(initialData.courseId ?? "");
    setSelectedClassIds(initialData.classIds ?? []);
    setSelectedProfessorIds(initialData.professorIds ?? []);
  }, [initialData]);

  const availableCourses = useMemo(() => {
    if (!academicData || !selectedUniversity) return [];
    const uni = academicData.universities.find(
      (u) => u._id === selectedUniversity,
    );
    return uni?.courses ?? [];
  }, [academicData, selectedUniversity]);

  const availableClasses = useMemo(() => {
    if (!academicData || !selectedCourse) return [];
    const uni = academicData.universities.find((u) =>
      u.courses.some((c) => c._id === selectedCourse),
    );
    return uni?.courses.find((c) => c._id === selectedCourse)?.classes ?? [];
  }, [academicData, selectedCourse]);

  const availableProfessors = useMemo(() => {
    if (!academicData || !selectedCourse) return [];
    const uni = academicData.universities.find((u) =>
      u.courses.some((c) => c._id === selectedCourse),
    );
    return uni?.courses.find((c) => c._id === selectedCourse)?.professors ?? [];
  }, [academicData, selectedCourse]);

  const toggleClass = useCallback(
    (id: string) =>
      setSelectedClassIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      ),
    [],
  );
  const toggleProfessor = useCallback(
    (id: string) =>
      setSelectedProfessorIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      ),
    [],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim() || !selectedCourse) return;
      onSubmit({
        name: name.trim(),
        courseId: selectedCourse,
        classIds: selectedClassIds,
        professorIds: selectedProfessorIds,
      });
      if (!initialData) {
        setName("");
        setSelectedUniversity("");
        setSelectedCourse("");
        setSelectedClassIds([]);
        setSelectedProfessorIds([]);
      }
    },
    [
      name,
      selectedCourse,
      selectedClassIds,
      selectedProfessorIds,
      onSubmit,
      initialData,],
  );

  if (isLoading)
    return (
      <div className="flex items-center gap-2 text-zinc-500 font-[Poppins] text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t("common.carregandoDadosAcademicos", {}, locale)}</div>
    );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>{t("admin.nomeDaDisciplina", {}, locale)}</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("admin.exAlgoritmosEProgramacao", {}, locale)}
          required
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>{t("common.universidade", {}, locale)}</label>
        <Select
          value={selectedUniversity}
          onChange={(v) => {
            setSelectedUniversity(v);
            setSelectedCourse("");
            setSelectedClassIds([]);
            setSelectedProfessorIds([]);
          }}
          options={(academicData?.universities ?? []).map((uni) => ({ value: uni._id, label: uni.name }))}
          placeholder={t("common.selecioneAUniversidade", {}, locale)}
        />
      </div>
      {selectedUniversity && (
        <div>
          <label className={labelCls}>{t("common.curso", {}, locale)}</label>
          <Select
            value={selectedCourse}
            onChange={(v) => {
              setSelectedCourse(v);
              setSelectedClassIds([]);
              setSelectedProfessorIds([]);
            }}
            options={availableCourses.map((course) => ({ value: course._id, label: course.name }))}
            placeholder={t("common.selecioneOCurso", {}, locale)}
          />
        </div>
      )}
      {selectedCourse && (
        <>
          <div>
            <label className={labelCls}>
              {t("common.turmas", {}, locale)}{" "}
              {selectedClassIds.length > 0 && (
                <span className="normal-case tracking-normal text-blue-400 ml-1">
                  ({t("common.selected", { count: selectedClassIds.length })})
                </span>
              )}
            </label>
            <CheckboxList
              items={availableClasses}
              selected={selectedClassIds}
              onToggle={toggleClass}
              emptyText={t("admin.noClassesForProgram")}
            />
          </div>
          <div>
            <label className={labelCls}>
              {t("common.professores", {}, locale)}{" "}
              {selectedProfessorIds.length > 0 && (
                <span className="normal-case tracking-normal text-blue-400 ml-1">
                  ({t("common.selectedMale", { count: selectedProfessorIds.length })})
                </span>
              )}
            </label>
            <CheckboxList
              items={availableProfessors}
              selected={selectedProfessorIds}
              onToggle={toggleProfessor}
              emptyText={t("admin.noInstructorsForProgram")}
            />
          </div>
        </>
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

export { DisciplineForm };
