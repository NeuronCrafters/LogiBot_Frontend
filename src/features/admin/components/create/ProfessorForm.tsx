import { t, useLocale } from "@/i18n";
﻿import React, { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { academicFiltersApi } from "@/services/apiClient";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { ProfessorData } from "@/features/admin/types";
import { EntityActionButton } from "@/features/admin/components/EntityActionButton";
import { Select } from "@/components/ui/select";

export interface ProfessorFormProps {
  onSubmit: (data: ProfessorData) => void;
  initialData?: ProfessorData;
}

const labelCls =
  "block mb-1.5 font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500";
const inputCls =
  "h-11 w-full rounded-xl border border-control bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white outline-none transition-colors focus:border-blue-500/60 placeholder:text-zinc-600";

function ProfessorForm({ onSubmit, initialData }: ProfessorFormProps) {
  const locale = useLocale();

  const { user } = useAuth();
  const roles = Array.isArray(user?.role) ? user.role : [user?.role];
  const isCoordinator =
    roles.includes("course-coordinator") && !roles.includes("admin");

  const {
    data: academicData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["academicData"],
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

  const getFirstId = (value: string | string[] | undefined): string => {
    if (!value) return "";
    return Array.isArray(value) ? (value[0] ?? "") : value;
  };

  const availableCourses = useMemo(() => {
    if (!academicData?.universities || !school) return [];
    const universityCourses =
      academicData.universities.find((u) => u._id === school)?.courses ?? [];
    if (!isCoordinator) return universityCourses;
    const rawCourses = Array.isArray(user?.courses)
      ? user.courses
      : user?.courses
        ? [user.courses]
        : [];
    const allowedCourseIds = rawCourses
      .map((c: any) => (typeof c === "string" ? c : (c?.id ?? c?._id ?? "")))
      .filter(Boolean);
    return universityCourses.filter((course) =>
      allowedCourseIds.includes(course._id),
    );
  }, [academicData, school, isCoordinator, user]);

  const handleUniversityChange = useCallback((universityId: string) => {
    setSchool(universityId);
    setCourses([]);
  }, []);

  React.useEffect(() => {
    if (!isCoordinator || school) return;
    const coordinatorSchool = getFirstId(user?.schoolId) || user?.school || "";
    if (coordinatorSchool) setSchool(coordinatorSchool);
  }, [isCoordinator, school, user]);

  React.useEffect(() => {
    if (!initialData) return;
    setName(initialData.name ?? "");
    setEmail(initialData.email ?? "");
    setPassword("");
    setSchool(initialData.school ?? "");
    setCourses(initialData.courses ?? []);
  }, [initialData]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (
        !name.trim() ||
        !email.trim() ||
        (!initialData && !password.trim()) ||
        !school ||
        courses.length === 0
      )
        return;
      onSubmit({
        name: name.trim(),
        email: email.trim(),
        password: password.trim() || undefined,
        school,
        courses,
      });
      if (!initialData) {
        setName("");
        setEmail("");
        setPassword("");
        if (!isCoordinator) setSchool("");
        setCourses([]);
      }
    },
    [
      name,
      email,
      password,
      school,
      courses,
      onSubmit,
      isCoordinator,
      initialData,],
  );

  if (isLoading)
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-zinc-500 font-[Poppins] text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t("common.carregandoDadosAcademicos", {}, locale)}</div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-11 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );

  if (error)
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
        <p className="font-[Poppins] text-sm text-red-400">
          {t("admin.erroAoCarregarDadosAcademicosTenteNovamente", {}, locale)}</p>
      </div>
    );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>{t("common.nomeCompleto", {}, locale)}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("admin.exJoaoDaSilva", {}, locale)}
            required
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>{t("common.email", {}, locale)}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("admin.professorEmailExample")}
            required
            className={inputCls}
          />
        </div>
      </div>
      <div>
        <label className={labelCls}>{t("common.senhaDeAcesso", {}, locale)}</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={
              initialData
                ? t("admin.deixeEmBrancoParaManterASenha", {}, locale)
                : t("admin.minimo6Caracteres", {}, locale)
            }
            required={!initialData}
            className={`${inputCls} pr-11`}
          />
          <button
            aria-label={t(showPassword ? "auth.ocultarSenha" : "auth.mostrarSenha")}
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      <div>
        <label className={labelCls}>{t("common.universidade", {}, locale)}</label>
        <Select
          value={school}
          onChange={(v) => handleUniversityChange(v)}
          options={(academicData?.universities ?? []).map((uni) => ({ value: uni._id, label: uni.name }))}
          placeholder={t("common.selecioneAUniversidade", {}, locale)}
          disabled={isCoordinator}
        />
      </div>
      {school && availableCourses.length > 0 && (
        <div>
          <label className={labelCls}>{t("common.curso", {}, locale)}</label>
          <Select
            value={courses[0] ?? ""}
            onChange={(v) => setCourses(v ? [v] : [])}
            options={availableCourses.map((course) => ({ value: course._id, label: course.name }))}
            placeholder={t("common.selecioneOCurso", {}, locale)}
          />
        </div>
      )}
      {school && availableCourses.length === 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
          <p className="font-[Poppins] text-sm text-amber-400">
            {t("admin.nenhumCursoEncontradoParaEstaUniversidade", {}, locale)}</p>
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

export { ProfessorForm };
