import { useState, useMemo } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { academicFiltersApi, academicApi, adminApi } from "@/services/apiClient";
import {
  BookOpen,
  GraduationCap,
  Library,
  Link2,
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
import { ClassForm } from "@/features/admin/components/create/ClassForm";
import { DisciplineForm } from "@/features/admin/components/create/DisciplineForm";
import { ProfessorForm } from "@/features/admin/components/create/ProfessorForm";

type Tab = "classes" | "disciplines" | "professors";

const selectCls =
  "h-10 rounded-xl border border-white/10 bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white outline-none transition-colors focus:border-blue-500/60 min-w-[180px]";

const MODAL_META: Record<Tab, { title: string; icon: ReactNode }> = {
  classes: { title: "Nova Turma", icon: <Users className="h-5 w-5" /> },
  disciplines: { title: "Nova Disciplina", icon: <Library className="h-5 w-5" /> },
  professors: { title: "Novo Professor", icon: <GraduationCap className="h-5 w-5" /> },
};

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
  badge,
  editPath,
  linksPath,
  linksLabel,
  linksState,
  onDelete,
}: {
  name: string;
  subtitle?: string;
  badge?: string;
  editPath: string;
  linksPath?: string;
  linksLabel?: string;
  linksState?: Record<string, string>;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#1f1f1f] p-4 shadow-md shadow-black/10 transition-colors hover:border-white/20">
      <div>
        <p className="font-[Poppins] text-sm font-semibold text-white leading-snug">{name}</p>
        {subtitle && (
          <p className="mt-0.5 font-[Poppins] text-xs text-zinc-500 truncate">{subtitle}</p>
        )}
        {badge !== undefined && (
          <span className="mt-2 inline-flex items-center rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 font-[Poppins] text-xs text-blue-400">
            {badge}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 border-t border-white/5 pt-3">
        {linksPath && (
          <Link
            to={linksPath}
            state={linksState}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 font-[Poppins] text-xs text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Link2 className="h-3 w-3" />
            {linksLabel ?? "Vínculos"}
          </Link>
        )}
        <Link
          to={editPath}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 font-[Poppins] text-xs text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Pencil className="h-3 w-3" />
          Editar
        </Link>
        <button
          onClick={onDelete}
          className="ml-auto flex items-center justify-center rounded-lg border border-white/10 bg-white/5 p-1.5 text-zinc-600 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
          title="Excluir"
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

export function ManageEntities() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("classes");
  const [adminUniversityId, setAdminUniversityId] = useState("");
  const [adminCourseId, setAdminCourseId] = useState("");
  const [createModal, setCreateModal] = useState<Tab | null>(null);
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
      return (uni?.courses as any[])?.find((c) => c._id === adminCourseId) ?? null;
    }
    const uni = universities.find((u) => u._id === coordUniversityId);
    if (!uni) return null;
    return (
      (uni.courses as any[])?.find((c) => coordCourseIds.includes(c._id)) ?? null
    );
  }, [isAdmin, universities, adminUniversityId, adminCourseId, coordUniversityId, coordCourseIds]);

  const classes = (activeCourse?.classes as any[]) ?? [];
  const disciplines = (activeCourse?.disciplines as any[]) ?? [];
  const professors = (activeCourse?.professors as any[]) ?? [];

  const createMutation = useMutation({
    mutationFn: async ({ entity, item }: { entity: string; item: any }) => {
      if (entity === "professor") {
        return adminApi.createProfessor({
          name: item.name,
          email: item.email,
          password: item.password,
          school: item.school,
          courses: item.courses,
        });
      }
      return academicApi.post(entity as any, item);
    },
    onSuccess: () => {
      toast.success("Cadastrado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["academicData"] });
      setCreateModal(null);
    },
    onError: () => {
      toast.error("Erro ao cadastrar. Verifique os dados e tente novamente.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: string }) => {
      if (type === "professor") return adminApi.deleteProfessor(id);
      return academicApi.delete(type as any, id);
    },
    onSuccess: () => {
      toast.success("Excluído com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["academicData"] });
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error("Erro ao excluir. Tente novamente.");
      setDeleteTarget(null);
    },
  });

  if (!user || (!isAdmin && !isCoordinator)) return null;

  const effectiveUniversityId = isAdmin ? adminUniversityId : coordUniversityId;
  const effectiveCourseId = isAdmin ? adminCourseId : (coordCourseIds[0] ?? "");

  const TABS = [
    {
      key: "classes" as Tab,
      label: "Turmas",
      icon: <Users className="h-4 w-4" />,
      count: classes.length,
      createLabel: "Nova Turma",
    },
    {
      key: "disciplines" as Tab,
      label: "Disciplinas",
      icon: <Library className="h-4 w-4" />,
      count: disciplines.length,
      createLabel: "Nova Disciplina",
    },
    {
      key: "professors" as Tab,
      label: "Professores",
      icon: <GraduationCap className="h-4 w-4" />,
      count: professors.length,
      createLabel: "Novo Professor",
    },
  ];

  const activeTab = TABS.find((t) => t.key === tab)!;
  const needsCourseSelection = isAdmin && (!adminUniversityId || !adminCourseId);

  return (
    <main className="flex-1 overflow-y-auto px-4 py-6 text-white md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        {/* Page header */}
        <section className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <TableProperties className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-[Poppins] text-2xl font-semibold text-white">
                  Gestão Acadêmica
                </h1>
                <p className="mt-1 font-[Poppins] text-sm leading-relaxed text-zinc-400">
                  Crie, edite e vincule turmas, disciplinas e professores.
                </p>
              </div>
            </div>
            {isAdmin && (
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/entities/create/university"
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-[Poppins] text-xs text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <School className="h-3.5 w-3.5" />
                  Nova Universidade
                </Link>
                <Link
                  to="/entities/create/course"
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-[Poppins] text-xs text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Novo Curso
                </Link>
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-white/5 pt-4">
              <div className="flex flex-col gap-1">
                <label className="font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Universidade
                </label>
                <select
                  value={adminUniversityId}
                  onChange={(e) => {
                    setAdminUniversityId(e.target.value);
                    setAdminCourseId("");
                  }}
                  className={selectCls}
                >
                  <option value="">Selecione</option>
                  {universities.map((u: any) => (
                    <option key={u._id} value={u._id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              {adminUniversityId && (
                <div className="flex flex-col gap-1">
                  <label className="font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Curso
                  </label>
                  <select
                    value={adminCourseId}
                    onChange={(e) => setAdminCourseId(e.target.value)}
                    className={selectCls}
                  >
                    <option value="">Selecione</option>
                    {adminCourses.map((c: any) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-12 font-[Poppins] text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando dados acadêmicos...
          </div>
        )}

        {/* Admin: needs to select a course first */}
        {!isLoading && needsCourseSelection && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-[#1f1f1f] py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-neutral-950/60 text-zinc-600">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="font-[Poppins] text-sm font-semibold text-white">
                Selecione universidade e curso
              </p>
              <p className="mt-1 font-[Poppins] text-xs text-zinc-500">
                Escolha acima para ver e gerenciar as entidades.
              </p>
            </div>
          </div>
        )}

        {/* Main content */}
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
                  message="Nenhuma turma cadastrada neste curso."
                  createLabel="Nova Turma"
                  onCreateClick={() => setCreateModal("classes")}
                />
              ) : (
                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {classes.map((cls: any) => {
                    const discCount = (cls.disciplines ?? cls.disciplineIds ?? []).length;
                    return (
                      <EntityCard
                        key={cls._id}
                        name={cls.name}
                        badge={`${discCount} ${discCount === 1 ? "disciplina" : "disciplinas"}`}
                        editPath={`/entities/edit/class/${cls._id}`}
                        linksPath="/entities/links/class-disciplines"
                        linksLabel="Disciplinas"
                        linksState={{ universityId: effectiveUniversityId, courseId: effectiveCourseId, classId: cls._id }}
                        onDelete={() =>
                          setDeleteTarget({ id: cls._id, name: cls.name, type: "class" })
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
                  message="Nenhuma disciplina cadastrada neste curso."
                  createLabel="Nova Disciplina"
                  onCreateClick={() => setCreateModal("disciplines")}
                />
              ) : (
                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {disciplines.map((disc: any) => {
                    const profCount = (disc.professors ?? []).length;
                    return (
                      <EntityCard
                        key={disc._id}
                        name={disc.name}
                        badge={`${profCount} ${profCount === 1 ? "professor" : "professores"}`}
                        editPath={`/entities/edit/discipline/${disc._id}`}
                        linksPath="/entities/links/professor-disciplines"
                        linksLabel="Professores"
                        linksState={{ universityId: effectiveUniversityId, courseId: effectiveCourseId, disciplineId: disc._id }}
                        onDelete={() =>
                          setDeleteTarget({ id: disc._id, name: disc.name, type: "discipline" })
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
                  message="Nenhum professor cadastrado neste curso."
                  createLabel="Novo Professor"
                  onCreateClick={() => setCreateModal("professors")}
                />
              ) : (
                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {professors.map((prof: any) => (
                    <EntityCard
                      key={prof._id}
                      name={prof.name}
                      subtitle={prof.email}
                      editPath={`/entities/edit/professor/${prof._id}`}
                      onDelete={() =>
                        setDeleteTarget({ id: prof._id, name: prof.name, type: "professor" })
                      }
                    />
                  ))}
                </section>
              ))}
          </>
        )}
      </div>

      {/* Create modal */}
      {createModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCreateModal(null);
          }}
        >
          <div className="flex min-h-full items-start justify-center px-4 py-10">
            <div className="w-full max-w-lg">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1c1c1c] shadow-2xl shadow-black/40">
                {/* Modal header */}
                <div className="flex items-center justify-between border-b border-white/10 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                      {MODAL_META[createModal].icon}
                    </div>
                    <h2 className="font-[Poppins] text-base font-semibold text-white">
                      {MODAL_META[createModal].title}
                    </h2>
                  </div>
                  <button
                    onClick={() => setCreateModal(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Modal form */}
                <div className="p-5">
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
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <AppModal
        isOpen={!!deleteTarget}
        type="delete"
        title={`Excluir "${deleteTarget?.name}"`}
        description="Esta ação não pode ser desfeita. O registro será removido permanentemente."
        onConfirm={() =>
          deleteTarget &&
          deleteMutation.mutate({ id: deleteTarget.id, type: deleteTarget.type })
        }
        onCancel={() => setDeleteTarget(null)}
        onClose={() => setDeleteTarget(null)}
        disabled={deleteMutation.isPending}
      />
    </main>
  );
}
