import { useDialogFocus } from "@/shared/hooks/useDialogFocus";
import { t, useLocale } from "@/i18n";
import { useState, useMemo } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  academicFiltersApi,
  academicApi,
  adminApi,
} from "@/services/apiClient";
import {
  BookOpen,
  GraduationCap,
  Library,
  Loader2,
  Pencil,
  Plus,
  School,
  TableProperties,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "@/shared/lib/toast";
import { AppModal } from "@/shared/components/feedback/AppModal";
import { Select } from "@/components/ui/select";
import { ClassForm } from "@/features/admin/components/create/ClassForm";
import { DisciplineForm } from "@/features/admin/components/create/DisciplineForm";
import { ProfessorForm } from "@/features/admin/components/create/ProfessorForm";
import { ClassDisciplineManager } from "@/features/admin/components/create/ClassDisciplineManager";
import { ProfessorDisciplineManager } from "@/features/admin/components/create/ProfessorDisciplineManager";

type Tab = "classes" | "disciplines" | "professors";

type LinksModal = {
  type: "class-disciplines" | "professor-disciplines";
  universityId: string;
  courseId: string;
  classId?: string;
  disciplineId?: string;
  label: string;
};


const MODAL_META: Record<
  Tab,
  { create: string; edit: string; icon: ReactNode }
> = {
  classes: {
    get create() { return t("common.novaTurma"); },
    get edit() { return t("common.editarTurma"); },
    icon: <Users className="h-5 w-5" />,
  },
  disciplines: {
    get create() { return t("common.novaDisciplina"); },
    get edit() { return t("common.editarDisciplina"); },
    icon: <Library className="h-5 w-5" />,
  },
  professors: {
    get create() { return t("common.novoProfessor"); },
    get edit() { return t("common.editarProfessor"); },
    icon: <GraduationCap className="h-5 w-5" />,
  },
};

// ── Modal shell (shared for create / edit / links) ────────────────────────────

function FormModal({
  title,
  icon,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  icon: ReactNode;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useLocale();
  const dialogRef = useDialogFocus<HTMLDivElement>(true, onClose);

  return (
    <div
      ref={dialogRef} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex min-h-full items-start justify-center px-4 py-10">
        <div className={`w-full ${wide ? "max-w-4xl" : "max-w-lg"}`}>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1c1c1c] shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  {icon}
                </div>
                <h2 className="font-[Poppins] text-base font-semibold text-white">
                  {title}
                </h2>
              </div>
              <button
                aria-label={t("common.fechar")}
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── UI primitives ─────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  count: number;
}) {
  useLocale();

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 font-[Poppins] text-sm font-medium transition-colors ${
        active ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
      }`}
    >
      {icon}
      {label}
      <span
        className={`rounded-full px-1.5 py-0.5 font-[Poppins] text-xs leading-none ${
          active ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-zinc-600"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function EntityCard({
  name,
  subtitle,
  badges,
  onEdit,
  onLinks,
  linksLabel,
  linksIcon,
  onDelete,
}: {
  name: string;
  subtitle?: string;
  badges?: string[];
  onEdit: () => void;
  onLinks?: () => void;
  linksLabel?: string;
  linksIcon?: ReactNode;
  onDelete: () => void;
}) {
  useLocale();

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#1f1f1f] p-4 shadow-md shadow-black/10 transition-colors hover:border-white/20">
      <div>
        <p className="font-[Poppins] text-sm font-semibold text-white leading-snug">
          {name}
        </p>
        {subtitle && (
          <p className="mt-0.5 font-[Poppins] text-xs text-zinc-500 truncate">
            {subtitle}
          </p>
        )}
        {badges && badges.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {badges.map((b) => (
              <span
                key={b}
                className="inline-flex items-center rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 font-[Poppins] text-xs text-blue-400"
              >
                {b}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 border-t border-white/5 pt-3">
        {onLinks && (
          <button
            onClick={onLinks}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 font-[Poppins] text-xs text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            {linksIcon ?? <Library className="h-3 w-3" />}
            {linksLabel ?? t("admin.vinculos")}
          </button>
        )}
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 font-[Poppins] text-xs text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Pencil className="h-3 w-3" />
          {t("common.editar")}</button>
        <button
          onClick={onDelete}
          className="ml-auto flex items-center justify-center rounded-lg border border-white/10 bg-white/5 p-1.5 text-zinc-600 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
          title={t("common.excluir")}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function EmptyTab({
  message,
  createLabel,
  onCreateClick,
}: {
  message: string;
  createLabel: string;
  onCreateClick: () => void;
}) {
  useLocale();

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/10 bg-[#1f1f1f] py-14">
      <p className="font-[Poppins] text-sm text-zinc-500">{message}</p>
      <button
        onClick={onCreateClick}
        className="flex items-center gap-1.5 rounded-lg bg-blue-600/80 px-4 py-2 font-[Poppins] text-sm font-semibold text-white transition-colors hover:bg-blue-600"
      >
        <Plus className="h-4 w-4" />
        {createLabel}
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ManageEntities() {
  const locale = useLocale();

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("classes");
  const [adminUniversityId, setAdminUniversityId] = useState("");
  const [adminCourseId, setAdminCourseId] = useState("");
  const [createModal, setCreateModal] = useState<Tab | null>(null);
  const [editTarget, setEditTarget] = useState<{
    tab: Tab;
    id: string;
    entity: any;
  } | null>(null);
  const [linksModal, setLinksModal] = useState<LinksModal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
    type: string;
  } | null>(null);

  const roles = Array.isArray(user?.role) ? (user?.role ?? []) : [user?.role];
  const isAdmin = roles.includes("admin");
  const isCoordinator = roles.includes("course-coordinator");

  const { data: academicData, isLoading } = useQuery({
    queryKey: ["academicData"],
    queryFn: async () => {
      const res = await academicFiltersApi.getAcademicData();
      return res.data;
    },
    enabled: !!user && (isAdmin || isCoordinator),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const universities = useMemo(
    () => (academicData?.universities as any[]) ?? [],
    [academicData],
  );

  const coordUniversityId = useMemo(() => {
    if (!user?.schoolId) return "";
    return Array.isArray(user.schoolId)
      ? String(user.schoolId[0] ?? "")
      : String(user.schoolId);
  }, [user?.schoolId]);

  const coordCourseIds = useMemo(() => {
    if (!user?.courses) return [] as string[];
    const arr = Array.isArray(user.courses) ? user.courses : [user.courses];
    return arr
      .map((c: any) => (typeof c === "string" ? c : (c?.id ?? c?._id ?? "")))
      .filter(Boolean) as string[];
  }, [user?.courses]);

  const adminCourses = useMemo(() => {
    const uni = universities.find((u) => u._id === adminUniversityId);
    return (uni?.courses as any[]) ?? [];
  }, [universities, adminUniversityId]);

  const activeCourse = useMemo((): any => {
    if (isAdmin) {
      if (!adminUniversityId || !adminCourseId) return null;
      const uni = universities.find((u) => u._id === adminUniversityId);
      return (
        (uni?.courses as any[])?.find((c) => c._id === adminCourseId) ?? null
      );
    }
    const uni = universities.find((u) => u._id === coordUniversityId);
    if (!uni) return null;
    return (
      (uni.courses as any[])?.find((c) => coordCourseIds.includes(c._id)) ??
      null
    );
  }, [
    isAdmin,
    universities,
    adminUniversityId,
    adminCourseId,
    coordUniversityId,
    coordCourseIds,]);

  const classes = (activeCourse?.classes as any[]) ?? [];
  const disciplines = (activeCourse?.disciplines as any[]) ?? [];
  const professors = (activeCourse?.professors as any[]) ?? [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: async ({ entity, item }: { entity: string; item: any }) => {
      if (entity === "professor")
        return adminApi.createProfessor({
          name: item.name,
          email: item.email,
          password: item.password,
          school: item.school,
          courses: item.courses,
        });
      return academicApi.post(entity as any, item);
    },
    onSuccess: () => {
      toast.success({ key: "admin.cadastradoComSucesso", params: {} });
      queryClient.invalidateQueries({ queryKey: ["academicData"] });
      setCreateModal(null);
    },
    onError: () =>
      toast.error({ key: "admin.erroAoCadastrarVerifiqueOsDadosE", params: {} }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      entity,
      id,
      item,
    }: {
      entity: string;
      id: string;
      item: any;
    }) => {
      if (entity === "professor") return adminApi.updateProfessor(id, item);
      return academicApi.update(entity as any, id, item);
    },
    onSuccess: () => {
      toast.success({ key: "admin.atualizadoComSucesso", params: {} });
      queryClient.invalidateQueries({ queryKey: ["academicData"] });
      setEditTarget(null);
    },
    onError: () =>
      toast.error({ key: "admin.erroAoAtualizarVerifiqueOsDadosE", params: {} }),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: string }) => {
      if (type === "professor") return adminApi.deleteProfessor(id);
      return academicApi.delete(type as any, id);
    },
    onSuccess: () => {
      toast.success({ key: "admin.excluidoComSucesso", params: {} });
      queryClient.invalidateQueries({ queryKey: ["academicData"] });
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error({ key: "admin.erroAoExcluirTenteNovamente", params: {} });
      setDeleteTarget(null);
    },
  });

  if (!user || (!isAdmin && !isCoordinator)) return null;

  const effectiveUniversityId = isAdmin ? adminUniversityId : coordUniversityId;
  const effectiveCourseId = isAdmin ? adminCourseId : (coordCourseIds[0] ?? "");

  function buildEditInitialData(t: Tab, entity: any) {
    if (t === "classes")
      return {
        id: entity._id,
        _id: entity._id,
        name: entity.name,
        courseId: effectiveCourseId,
        universityId: effectiveUniversityId,
        disciplineIds: (entity.disciplines ?? entity.disciplineIds ?? []).map(
          (d: any) => (typeof d === "string" ? d : d._id),
        ),
      };
    if (t === "disciplines")
      return {
        id: entity._id,
        _id: entity._id,
        name: entity.name,
        courseId: effectiveCourseId,
        universityId: effectiveUniversityId,
        classIds: (entity.classes ?? []).map((c: any) =>
          typeof c === "string" ? c : c._id,
        ),
        professorIds: (entity.professors ?? []).map((p: any) =>
          typeof p === "string" ? p : p._id,
        ),
      };
    return {
      id: entity._id,
      _id: entity._id,
      name: entity.name,
      email: entity.email,
      school: effectiveUniversityId,
      courses: [effectiveCourseId].filter(Boolean),
    };
  }

  const TABS = [
    {
      key: "classes" as Tab,
      label: t("common.turmas", {}, locale),
      icon: <Users className="h-4 w-4" />,
      count: classes.length,
      createLabel: t("common.novaTurma", {}, locale),
    },
    {
      key: "disciplines" as Tab,
      label: t("common.disciplinas", {}, locale),
      icon: <Library className="h-4 w-4" />,
      count: disciplines.length,
      createLabel: t("common.novaDisciplina", {}, locale),
    },
    {
      key: "professors" as Tab,
      label: t("common.professores", {}, locale),
      icon: <GraduationCap className="h-4 w-4" />,
      count: professors.length,
      createLabel: t("common.novoProfessor", {}, locale),
    },
  ];
  const activeTab = TABS.find((t) => t.key === tab)!;
  const needsCourseSelection =
    isAdmin && (!adminUniversityId || !adminCourseId);

  return (
    <main className="flex-1 overflow-y-auto px-4 py-6 text-white md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        {/* Header */}
        <section className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <TableProperties className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-[Poppins] text-2xl font-semibold text-white">
                  {t("common.gestaoAcademica", {}, locale)}</h1>
                <p className="mt-1 font-[Poppins] text-sm leading-relaxed text-zinc-400">
                  {t("admin.crieEditeEVinculeTurmasDisciplinasE", {}, locale)}</p>
              </div>
            </div>
            {isAdmin && (
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/entities/create/university"
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-[Poppins] text-xs text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <School className="h-3.5 w-3.5" />
                  {t("common.novaUniversidade", {}, locale)}</Link>
                <Link
                  to="/entities/create/course"
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-[Poppins] text-xs text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  {t("common.novoCurso", {}, locale)}</Link>
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-white/5 pt-4">
              <div className="flex flex-col gap-1">
                <label className="font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  {t("common.universidade", {}, locale)}</label>
                <Select
                  value={adminUniversityId}
                  onChange={(v) => { setAdminUniversityId(v); setAdminCourseId(""); }}
                  placeholder={t("common.selecione_92", {}, locale)}
                  options={universities.map((u: any) => ({ value: u._id, label: u.name }))}
                  className="min-w-[180px]"
                />
              </div>
              {adminUniversityId && (
                <div className="flex flex-col gap-1">
                  <label className="font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    {t("common.curso", {}, locale)}</label>
                  <Select
                    value={adminCourseId}
                    onChange={setAdminCourseId}
                    placeholder={t("common.selecione_92", {}, locale)}
                    options={adminCourses.map((c: any) => ({ value: c._id, label: c.name }))}
                    className="min-w-[180px]"
                  />
                </div>
              )}
            </div>
          )}
        </section>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-12 font-[Poppins] text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("common.carregandoDadosAcademicos", {}, locale)}</div>
        )}

        {!isLoading && needsCourseSelection && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-[#1f1f1f] py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-neutral-950/60 text-zinc-600">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="font-[Poppins] text-sm font-semibold text-white">
                {t("admin.selecioneUniversidadeECurso", {}, locale)}</p>
              <p className="mt-1 font-[Poppins] text-xs text-zinc-500">
                {t("admin.escolhaAcimaParaVerEGerenciarAs", {}, locale)}</p>
            </div>
          </div>
        )}

        {!isLoading && !needsCourseSelection && (
          <>
            {/* Tab bar + create button */}
            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#1f1f1f] px-5 py-4 shadow-lg shadow-black/10 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-0.5 overflow-x-auto">
                {TABS.map((t) => (
                  <TabButton
                    key={t.key}
                    active={tab === t.key}
                    onClick={() => setTab(t.key)}
                    icon={t.icon}
                    label={t.label}
                    count={t.count}
                  />
                ))}
              </div>
              <button
                onClick={() => setCreateModal(tab)}
                className="flex items-center gap-1.5 self-start rounded-lg bg-blue-600 px-4 py-2 font-[Poppins] text-sm font-semibold text-white transition-colors hover:bg-blue-700 sm:self-auto"
              >
                <Plus className="h-4 w-4" />
                {activeTab.createLabel}
              </button>
            </div>

            {/* Turmas */}
            {tab === "classes" &&
              (classes.length === 0 ? (
                <EmptyTab
                  message={t("admin.nenhumaTurmaCadastradaNesteCurso", {}, locale)}
                  createLabel={t("common.novaTurma")}
                  onCreateClick={() => setCreateModal("classes")}
                />
              ) : (
                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {classes.map((cls: any) => {
                    const discCount = (
                      cls.disciplines ??
                      cls.disciplineIds ??
                      []
                    ).length;
                    const studCount = (cls.students ?? []).length;
                    return (
                      <EntityCard
                        key={cls._id}
                        name={cls.name}
                        badges={[
                          `${discCount} ${discCount === 1 ? "disciplina" : "disciplinas"}`,
                          `${studCount} ${studCount === 1 ? "aluno" : "alunos"}`,
                        ]}
                        onEdit={() =>
                          setEditTarget({
                            tab: "classes",
                            id: cls._id,
                            entity: cls,
                          })
                        }
                        onLinks={() =>
                          setLinksModal({
                            type: "class-disciplines",
                            universityId: effectiveUniversityId,
                            courseId: effectiveCourseId,
                            classId: cls._id,
                            label: cls.name,
                          })
                        }
                        linksIcon={<BookOpen className="h-3 w-3" />}
                        linksLabel={t("admin.curriculum")}
                        onDelete={() =>
                          setDeleteTarget({
                            id: cls._id,
                            name: cls.name,
                            type: "class",
                          })
                        }
                      />
                    );
                  })}
                </section>
              ))}

            {/* Disciplinas */}
            {tab === "disciplines" &&
              (disciplines.length === 0 ? (
                <EmptyTab
                  message={t("admin.nenhumaDisciplinaCadastradaNesteCurso", {}, locale)}
                  createLabel={t("common.novaDisciplina")}
                  onCreateClick={() => setCreateModal("disciplines")}
                />
              ) : (
                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {disciplines.map((disc: any) => {
                    const profCount = (disc.professors ?? []).length;
                    const studCount = (disc.students ?? []).length;
                    return (
                      <EntityCard
                        key={disc._id}
                        name={disc.name}
                        badges={[
                          `${profCount} ${profCount === 1 ? "professor" : "professores"}`,
                          `${studCount} ${studCount === 1 ? "aluno" : "alunos"}`,
                        ]}
                        onEdit={() =>
                          setEditTarget({
                            tab: "disciplines",
                            id: disc._id,
                            entity: disc,
                          })
                        }
                        onLinks={() =>
                          setLinksModal({
                            type: "professor-disciplines",
                            universityId: effectiveUniversityId,
                            courseId: effectiveCourseId,
                            disciplineId: disc._id,
                            label: disc.name,
                          })
                        }
                        linksIcon={<Users className="h-3 w-3" />}
                        linksLabel={t("common.professores")}
                        onDelete={() =>
                          setDeleteTarget({
                            id: disc._id,
                            name: disc.name,
                            type: "discipline",
                          })
                        }
                      />
                    );
                  })}
                </section>
              ))}

            {/* Professores */}
            {tab === "professors" &&
              (professors.length === 0 ? (
                <EmptyTab
                  message={t("admin.nenhumProfessorCadastradoNesteCurso", {}, locale)}
                  createLabel={t("common.novoProfessor")}
                  onCreateClick={() => setCreateModal("professors")}
                />
              ) : (
                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {professors.map((prof: any) => (
                    <EntityCard
                      key={prof._id}
                      name={prof.name}
                      subtitle={prof.email}
                      onEdit={() =>
                        setEditTarget({
                          tab: "professors",
                          id: prof._id,
                          entity: prof,
                        })
                      }
                      onDelete={() =>
                        setDeleteTarget({
                          id: prof._id,
                          name: prof.name,
                          type: "professor",
                        })
                      }
                    />
                  ))}
                </section>
              ))}
          </>
        )}
      </div>

      {/* ── Create modal ─────────────────────────────────────── */}
      {createModal && (
        <FormModal
          title={MODAL_META[createModal].create}
          icon={MODAL_META[createModal].icon}
          onClose={() => setCreateModal(null)}
        >
          {createModal === "classes" && (
            <ClassForm
              onSubmit={(data) =>
                createMutation.mutate({ entity: "class", item: data })
              }
            />
          )}
          {createModal === "disciplines" && (
            <DisciplineForm
              onSubmit={(data) =>
                createMutation.mutate({ entity: "discipline", item: data })
              }
            />
          )}
          {createModal === "professors" && (
            <ProfessorForm
              onSubmit={(data) =>
                createMutation.mutate({ entity: "professor", item: data })
              }
            />
          )}
        </FormModal>
      )}

      {/* ── Edit modal ───────────────────────────────────────── */}
      {editTarget && (
        <FormModal
          title={MODAL_META[editTarget.tab].edit}
          icon={MODAL_META[editTarget.tab].icon}
          onClose={() => setEditTarget(null)}
        >
          {editTarget.tab === "classes" && (
            <ClassForm
              initialData={
                buildEditInitialData("classes", editTarget.entity) as any
              }
              onSubmit={(data) =>
                updateMutation.mutate({
                  entity: "class",
                  id: editTarget.id,
                  item: data,
                })
              }
            />
          )}
          {editTarget.tab === "disciplines" && (
            <DisciplineForm
              initialData={
                buildEditInitialData("disciplines", editTarget.entity) as any
              }
              onSubmit={(data) =>
                updateMutation.mutate({
                  entity: "discipline",
                  id: editTarget.id,
                  item: data,
                })
              }
            />
          )}
          {editTarget.tab === "professors" && (
            <ProfessorForm
              initialData={
                buildEditInitialData("professors", editTarget.entity) as any
              }
              onSubmit={(data) =>
                updateMutation.mutate({
                  entity: "professor",
                  id: editTarget.id,
                  item: data,
                })
              }
            />
          )}
        </FormModal>
      )}

      {/* Links modal (Grade da Turma / Professores por Disciplina) */}
      {linksModal && (
        <FormModal
          wide
          title={
            linksModal.type === "class-disciplines"
              ? t("admin.disciplinasValue0", { value0: linksModal.label }, locale)
              : t("admin.professoresAlunosValue0", { value0: linksModal.label }, locale)
          }
          icon={
            linksModal.type === "class-disciplines" ? (
              <Library className="h-5 w-5" />
            ) : (
              <GraduationCap className="h-5 w-5" />
            )
          }
          onClose={() => setLinksModal(null)}
        >
          {linksModal.type === "class-disciplines" ? (
            <ClassDisciplineManager
              inModal
              initialUniversityId={linksModal.universityId}
              initialCourseId={linksModal.courseId}
              initialClassId={linksModal.classId}
            />
          ) : (
            <ProfessorDisciplineManager
              inModal
              initialUniversityId={linksModal.universityId}
              initialCourseId={linksModal.courseId}
              initialDisciplineId={linksModal.disciplineId}
            />
          )}
        </FormModal>
      )}

      {/* ── Delete confirmation ──────────────────────────────── */}
      <AppModal
        isOpen={!!deleteTarget}
        type="delete"
        title={t("common.excluirValue0", { value0: deleteTarget?.name }, locale)}
        description={t("admin.estaAcaoNaoPodeSerDesfeitaO", {}, locale)}
        onConfirm={() =>
          deleteTarget &&
          deleteMutation.mutate({
            id: deleteTarget.id,
            type: deleteTarget.type,
          })
        }
        onCancel={() => setDeleteTarget(null)}
        onClose={() => setDeleteTarget(null)}
        disabled={deleteMutation.isPending}
      />
    </main>
  );
}
