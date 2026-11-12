import { t, useLocale } from "@/i18n";
﻿import { useState, useEffect, useMemo } from "react";
import { logger } from "@/shared/lib/logger";
import { Select } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { academicFiltersApi } from "@/services/apiClient";
import type { FilterData, FilterType } from "@/features/dashboard/filterTypes";
import { EntityActionButton } from "@/features/admin/components/EntityActionButton";

interface Institution {
  _id: string;
  name: string;
  courses: Course[];
}
interface Course {
  _id: string;
  name: string;
  disciplines: Discipline[];
  classes: Class[];
}
interface Discipline {
  _id: string;
  name: string;
}
interface Class {
  _id: string;
  name: string;
}

interface EntityListFilterProps {
  onSearch: (data: FilterData) => void;
  onReset: () => void;
}

function EntityListFilterContent({ onSearch, onReset }: EntityListFilterProps) {
  const locale = useLocale();

  const { user } = useAuth();

  const roles = Array.isArray(user.role) ? user.role : [user.role];
  const isAdmin = roles.includes("admin");
  const isCoordinator = roles.includes("course-coordinator");
  const isProfessor = roles.includes("professor");

  const getFirstId = (value: string | string[] | undefined): string => {
    if (!value) return "";
    return Array.isArray(value) ? value[0] || "" : value;
  };

  const fixedUniversity =
    getFirstId(user.schoolId) || String(user.school || "");

  const allowedFilters: FilterType[] = isAdmin
    ? [
        "universities",
        "courses",
        "disciplines",
        "classes",
        "professors",
        "students",
        "students-course",
        "students-discipline",
        "students-class",
      ]
    : isCoordinator
      ? [
          "professors",
          "disciplines",
          "classes",
          "students-discipline",
          "students-class",
        ]
      : isProfessor
        ? ["students-discipline", "students-class"]
        : [];

  const [filterType, setFilterType] = useState<FilterType | "">("");
  const [selectedUniversity, setSelectedUniversity] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");

  const {
    data: academicData,
    isLoading: loading,
    error,
    refetch,
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

  const showUniversitySelect =
    isAdmin &&
    [
      "courses",
      "disciplines",
      "classes",
      "professors",
      "students-course",
      "students-discipline",
      "students-class",
    ].includes(filterType as FilterType);
  const showCourseSelect =
    (isAdmin || isCoordinator) &&
    [
      "disciplines",
      "classes",
      "students-course",
      "students-discipline",
      "students-class",
    ].includes(filterType as FilterType);
  const showStudentDisciplineSelect =
    (filterType === "students-discipline" || filterType === "students-class") &&
    (isAdmin || isCoordinator || isProfessor);
  const showStudentClassSelect =
    filterType === "students-class" &&
    (isAdmin || isCoordinator || isProfessor);
  const coordinatorNoSelect =
    isCoordinator && ["professors"].includes(filterType as FilterType);

  let canSearch =
    !!filterType &&
    (!showUniversitySelect || !!selectedUniversity) &&
    (!showCourseSelect || !!selectedCourse) &&
    (!showStudentDisciplineSelect || !!selectedDiscipline) &&
    (!showStudentClassSelect || !!selectedClass);
  if (coordinatorNoSelect) canSearch = true;

  const universities: Institution[] = useMemo(
    () => academicData?.universities || [],
    [academicData],
  );
  const courses: Course[] = useMemo(() => {
    if (isAdmin && selectedUniversity && universities.length)
      return (
        universities.find((u) => u._id === selectedUniversity)?.courses || []
      );
    if (
      (isCoordinator || isProfessor) &&
      fixedUniversity &&
      universities.length
    )
      return universities.find((u) => u._id === fixedUniversity)?.courses || [];
    return [];
  }, [
    universities,
    selectedUniversity,
    fixedUniversity,
    isAdmin,
    isCoordinator,
    isProfessor,]);

  const disciplines: Discipline[] = useMemo(() => {
    if (selectedCourse)
      return courses.find((c) => c._id === selectedCourse)?.disciplines || [];
    return courses.flatMap((c) => c.disciplines || []);
  }, [courses, selectedCourse]);

  const classes = useMemo(() => {
    if (selectedCourse)
      return courses.find((c) => c._id === selectedCourse)?.classes || [];
    return courses.flatMap((c) => c.classes || []);
  }, [courses, selectedCourse]);

  useEffect(() => {
    if (!showCourseSelect) {
      setSelectedCourse("");
      setSelectedDiscipline("");
      setSelectedClass("");
    }
  }, [showCourseSelect]);
  useEffect(() => {
    if (!showStudentDisciplineSelect) setSelectedDiscipline("");
  }, [showStudentDisciplineSelect]);
  useEffect(() => {
    if (!showStudentClassSelect) setSelectedClass("");
  }, [showStudentClassSelect]);
  useEffect(() => {
    if (
      (isCoordinator || isProfessor) &&
      fixedUniversity &&
      !selectedUniversity
    )
      setSelectedUniversity(fixedUniversity);
  }, [isCoordinator, isProfessor, fixedUniversity, selectedUniversity]);

  function handleSearchClick() {
    if (!canSearch) return;
    const universityId =
      isCoordinator || isProfessor
        ? fixedUniversity
        : showUniversitySelect
          ? selectedUniversity
          : undefined;
    logger.info("Admin", "Iniciando busca.", {
      filterType,
      universityId,
      courseId: showCourseSelect ? selectedCourse : undefined,
      disciplineId: showStudentDisciplineSelect
        ? selectedDiscipline
        : undefined,
      classId: showStudentClassSelect ? selectedClass : undefined,
    });
    onSearch({
      filterType,
      universityId: showUniversitySelect ? selectedUniversity : undefined,
      courseId: showCourseSelect ? selectedCourse : undefined,
      disciplineId: showStudentDisciplineSelect
        ? selectedDiscipline
        : undefined,
      classId: showStudentClassSelect ? selectedClass : undefined,
    });
  }

  function handleResetFilter() {
    setFilterType("");
    setSelectedCourse("");
    setSelectedDiscipline("");
    setSelectedClass("");
    if (isAdmin) setSelectedUniversity("");
    onReset();
  }

  if (error)
    return (
      <div className="p-4 mb-4 border rounded-xl bg-red-600/20 border-red-600/50">
        <p className="mb-2 text-red-300">{t("admin.erroAoCarregarFiltros", {}, locale)}</p>
        <button
          onClick={() => refetch()}
          className="text-sm text-red-200 underline hover:text-red-100"
        >
          {t("common.tentarNovamente", {}, locale)}</button>
      </div>
    );

  return (
    <div className="rounded-2xl border border-white/10 bg-surface p-5 shadow-lg shadow-black/10 sm:p-6">
      <div className="mb-5">
        <h2 className="font-[Poppins] text-base font-semibold text-white">
          {t("admin.filtrosDeBusca", {}, locale)}</h2>
        <p className="mt-1 font-[Poppins] text-xs text-zinc-500">
          {t("admin.selecioneOsCriteriosECliqueEmBuscar", {}, locale)}</p>
      </div>

      {loading && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3">
          <div className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-blue-400/30 border-t-blue-400" />
          <p className="font-[Poppins] text-sm text-blue-300">
            {t("admin.carregandoFiltros", {}, locale)}</p>
        </div>
      )}

      <div className="mb-5 grid gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1.5 block font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {t("admin.tipoDeFiltro", {}, locale)}</label>
          <Select
            value={filterType}
            onChange={(v) => setFilterType(v as FilterType)}
            disabled={loading}
            placeholder={t("common.selecione_92", {}, locale)}
            options={allowedFilters.map((ft) => ({
              value: ft,
              label: ({ universities: t("common.universidades", {}, locale), courses: t("common.cursos", {}, locale), disciplines: t("common.disciplinas", {}, locale), classes: t("common.turmas", {}, locale), professors: t("common.professores", {}, locale), students: t("admin.alunosDoSistema", {}, locale), "students-course": t("admin.alunosPorCurso", {}, locale), "students-discipline": t("admin.alunosPorDisciplina", {}, locale), "students-class": t("admin.alunosPorTurma", {}, locale) } as Record<string, string>)[ft] || ft,
            }))}
          />
        </div>

        {showUniversitySelect && (
          <div>
            <label className="mb-1.5 block font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {t("common.universidade", {}, locale)}</label>
            <Select
              value={selectedUniversity}
              onChange={(v) => { setSelectedUniversity(v); setSelectedCourse(""); setSelectedDiscipline(""); setSelectedClass(""); }}
              disabled={loading}
              placeholder={t("common.selecioneAUniversidade", {}, locale)}
              options={universities.map((u) => ({ value: u._id, label: u.name }))}
            />
          </div>
        )}

        {showCourseSelect && (
          <div>
            <label className="mb-1.5 block font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {t("common.curso", {}, locale)}</label>
            <Select
              value={selectedCourse}
              onChange={(v) => { setSelectedCourse(v); setSelectedDiscipline(""); setSelectedClass(""); }}
              disabled={loading || courses.length === 0}
              placeholder={t("common.selecioneOCurso", {}, locale)}
              options={courses.map((c) => ({ value: c._id, label: c.name }))}
            />
          </div>
        )}

        {showStudentDisciplineSelect && (
          <div>
            <label className="mb-1.5 block font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {t("common.disciplina", {}, locale)}</label>
            <Select
              value={selectedDiscipline}
              onChange={setSelectedDiscipline}
              disabled={loading || disciplines.length === 0}
              placeholder={t("common.selecioneADisciplina", {}, locale)}
              options={disciplines.map((d) => ({ value: d._id, label: d.name }))}
            />
          </div>
        )}

        {showStudentClassSelect && (
          <div>
            <label className="mb-1.5 block font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {t("common.turma", {}, locale)}</label>
            <Select
              value={selectedClass}
              onChange={setSelectedClass}
              disabled={loading || classes.length === 0}
              placeholder={t("admin.selecioneATurma", {}, locale)}
              options={classes.map((c) => ({ value: c._id, label: c.name }))}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <EntityActionButton
          action="search"
          onClick={handleSearchClick}
          disabled={!canSearch || loading}
        />
        <EntityActionButton
          action="reload"
          onClick={handleResetFilter}
          disabled={loading}
        />
      </div>
    </div>
  );
}

export function EntityListFilter(props: EntityListFilterProps) {
  const { user } = useAuth();
  return user ? <EntityListFilterContent {...props} /> : null;
}
