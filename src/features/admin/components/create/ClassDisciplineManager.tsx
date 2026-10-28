import { t, useLocale } from "@/i18n";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Check,
  Copy,
  KeyRound,
  Loader2,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";
import { academicApi, academicFiltersApi } from "@/services/apiClient";
import { toast } from "@/shared/lib/toast";
import { Select } from "@/components/ui/select";

const inputCls =
  "h-11 w-full rounded-xl border border-white/10 bg-neutral-950/60 pl-10 pr-3 font-[Poppins] text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-blue-500/60";

type RegistrationCodeResponse = {
  registrationCode?: string;
};

type ActiveTab = "disciplines" | "students";
type ListItem = { _id: string; name: string; email?: string };

function matchesSearch(item: ListItem, search: string) {
  const query = search.trim().toLowerCase();
  if (!query) return true;
  return `${item.name} ${item.email ?? ""}`.toLowerCase().includes(query);
}

function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  useLocale();

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={inputCls}
      />
    </div>
  );
}

function EmptyList({ message }: { message: string }) {
  useLocale();

  return (
    <p className="px-4 py-6 text-center font-[Poppins] text-sm text-zinc-600">
      {message}
    </p>
  );
}

function AssignmentList({
  items,
  emptyText,
  action,
}: {
  items: ListItem[];
  emptyText: string;
  action?: (item: ListItem) => ReactNode;
}) {
  useLocale();

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      {items.length === 0 ? (
        <EmptyList message={emptyText} />
      ) : (
        items.map((item) => (
          <div
            key={item._id}
            className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3 last:border-0 hover:bg-white/[0.02]"
          >
            <div className="min-w-0">
              <p className="truncate font-[Poppins] text-sm text-white">
                {item.name}
              </p>
              {item.email && (
                <p className="truncate font-[Poppins] text-xs text-zinc-500">
                  {item.email}
                </p>
              )}
            </div>
            {action?.(item)}
          </div>
        ))
      )}
    </div>
  );
}

export function ClassDisciplineManager({
  initialUniversityId = "",
  initialCourseId = "",
  initialClassId = "",
  inModal = false,
}: {
  initialUniversityId?: string;
  initialCourseId?: string;
  initialClassId?: string;
  inModal?: boolean;
} = {}) {
  const locale = useLocale();

  const queryClient = useQueryClient();
  const [selectedUniversity, setSelectedUniversity] =
    useState(initialUniversityId);
  const [selectedCourse, setSelectedCourse] = useState(initialCourseId);
  const [selectedClass, setSelectedClass] = useState(initialClassId);
  const [latestRegistrationCode, setLatestRegistrationCode] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("disciplines");
  const [disciplineSearch, setDisciplineSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  const { data: academicData, isLoading } = useQuery({
    queryKey: ["academicData"],
    queryFn: async () => {
      const response = await academicFiltersApi.getAcademicData();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const courses = useMemo(
    () =>
      academicData?.universities.find((u) => u._id === selectedUniversity)
        ?.courses ?? [],
    [academicData, selectedUniversity],
  );
  const course = useMemo(
    () => courses.find((item) => item._id === selectedCourse),
    [courses, selectedCourse],
  );
  const classItem = useMemo(
    () => course?.classes.find((item) => item._id === selectedClass),
    [course, selectedClass],
  );
  const registrationCode =
    latestRegistrationCode || classItem?.registrationCode || "";
  const linkedDisciplineIds = useMemo(
    () => new Set((classItem?.disciplines ?? []).map((d) => d._id)),
    [classItem],
  );
  const enrolledStudentIds = useMemo(
    () => new Set((classItem?.students ?? []).map((s) => s._id)),
    [classItem],
  );
  const availableDisciplines = useMemo(
    () =>
      (course?.disciplines ?? []).filter(
        (d) => !linkedDisciplineIds.has(d._id),
      ),
    [course, linkedDisciplineIds],
  );
  const linkedDisciplines = useMemo(
    () => classItem?.disciplines ?? [],
    [classItem],
  );
  const availableStudents = useMemo(
    () =>
      (course?.students ?? []).filter((s) => !enrolledStudentIds.has(s._id)),
    [course, enrolledStudentIds],
  );
  const enrolledStudents = useMemo(
    () => classItem?.students ?? [],
    [classItem],
  );

  const filteredAvailableDisciplines = useMemo(
    () =>
      availableDisciplines.filter((discipline) =>
        matchesSearch(discipline, disciplineSearch),
      ),
    [availableDisciplines, disciplineSearch],
  );
  const filteredLinkedDisciplines = useMemo(
    () =>
      linkedDisciplines.filter((discipline) =>
        matchesSearch(discipline, disciplineSearch),
      ),
    [linkedDisciplines, disciplineSearch],
  );
  const filteredAvailableStudents = useMemo(
    () =>
      availableStudents.filter((student) =>
        matchesSearch(student, studentSearch),
      ),
    [availableStudents, studentSearch],
  );
  const filteredEnrolledStudents = useMemo(
    () =>
      enrolledStudents.filter((student) =>
        matchesSearch(student, studentSearch),
      ),
    [enrolledStudents, studentSearch],
  );

  const attachDisciplineMutation = useMutation({
    mutationFn: async (disciplineId: string) =>
      academicApi.attachDisciplineToClass(selectedClass, disciplineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academicData"] });
      toast.success({ key: "admin.disciplinaVinculadaAGradeDaTurma", params: {} });
    },
    onError: () => toast.error({ key: "admin.naoFoiPossivelVincularADisciplina", params: {} }),
  });

  const detachDisciplineMutation = useMutation({
    mutationFn: async (disciplineId: string) =>
      academicApi.detachDisciplineFromClass(selectedClass, disciplineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academicData"] });
      toast.success({ key: "admin.disciplinaRemovidaDaGradeDaTurma", params: {} });
    },
    onError: () => toast.error({ key: "admin.naoFoiPossivelDesvincularADisciplina", params: {} }),
  });

  const regenerateCodeMutation = useMutation({
    mutationFn: async () =>
      academicApi.regenerateClassRegistrationCode<RegistrationCodeResponse>(
        selectedClass,
      ),
    onSuccess: (response) => {
      setLatestRegistrationCode(response.registrationCode || "");
      setCopiedCode(false);
      queryClient.invalidateQueries({ queryKey: ["academicData"] });
      toast.success({ key: "admin.codigoDaTurmaRegenerado", params: {} });
    },
    onError: () => toast.error({ key: "admin.naoFoiPossivelRegenerarOCodigoDa", params: {} }),
  });

  const enrollStudentMutation = useMutation({
    mutationFn: async (studentId: string) =>
      academicApi.enrollStudentInClass(selectedClass, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academicData"] });
      toast.success({ key: "admin.alunoTransferidoParaATurma", params: {} });
    },
    onError: () => toast.error({ key: "admin.naoFoiPossivelTransferirOAluno", params: {} }),
  });

  const resetUniversity = (universityId: string) => {
    setSelectedUniversity(universityId);
    setSelectedCourse("");
    setSelectedClass("");
    setLatestRegistrationCode("");
    setCopiedCode(false);
    setDisciplineSearch("");
    setStudentSearch("");
  };

  const resetCourse = (courseId: string) => {
    setSelectedCourse(courseId);
    setSelectedClass("");
    setLatestRegistrationCode("");
    setCopiedCode(false);
    setDisciplineSearch("");
    setStudentSearch("");
  };

  const resetClass = (classId: string) => {
    setSelectedClass(classId);
    setLatestRegistrationCode("");
    setCopiedCode(false);
    setDisciplineSearch("");
    setStudentSearch("");
  };

  const copyRegistrationCode = async () => {
    if (!registrationCode) return;
    await navigator.clipboard.writeText(registrationCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const loader = (
    <div className="flex items-center gap-2 text-zinc-500 font-[Poppins] text-sm">
      <Loader2 className="h-4 w-4 animate-spin" />
      {t("common.carregandoVinculos", {}, locale)}</div>
  );

  const body = (
    <>
      {!inModal && (
        <div className="mb-5">
          <h2 className="font-[Poppins] text-base font-semibold text-white">
            {t("admin.gerenciarTurma", {}, locale)}</h2>
          <p className="mt-1 font-[Poppins] text-xs text-zinc-500">
            {t("admin.controleGradeCodigoDeAcessoEAlunos", {}, locale)}</p>
        </div>
      )}

      {!inModal && (
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block mb-1.5 font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {t("common.universidade", {}, locale)}</label>
            <Select
              value={selectedUniversity}
              onChange={(v) => resetUniversity(v)}
              options={(academicData?.universities ?? []).map((university) => ({ value: university._id, label: university.name }))}
              placeholder={t("common.selecione_92", {}, locale)}
            />
          </div>
          <div>
            <label className="block mb-1.5 font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {t("common.curso", {}, locale)}</label>
            <Select
              value={selectedCourse}
              onChange={(v) => resetCourse(v)}
              options={courses.map((item) => ({ value: item._id, label: item.name }))}
              placeholder={t("common.selecione_92", {}, locale)}
              disabled={!selectedUniversity}
            />
          </div>
          <div>
            <label className="block mb-1.5 font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {t("common.turma", {}, locale)}</label>
            <Select
              value={selectedClass}
              onChange={(v) => resetClass(v)}
              options={(course?.classes ?? []).map((item) => ({ value: item._id, label: item.name }))}
              placeholder={t("common.selecione_92", {}, locale)}
              disabled={!selectedCourse}
            />
          </div>
        </div>
      )}

      {classItem && (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-neutral-950/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <KeyRound className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  {t("common.codigoDaTurma", {}, locale)}</p>
                <p className="mt-1 truncate font-mono text-base font-semibold text-blue-300">
                  {registrationCode}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyRegistrationCode}
                disabled={!registrationCode}
                className="flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 font-[Poppins] text-xs text-zinc-300 transition-colors hover:bg-white/10 disabled:opacity-50"
              >
                {copiedCode ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copiedCode ? t("common.copiado", {}, locale) : t("common.copiar", {}, locale)}
              </button>
              <button
                type="button"
                onClick={() => regenerateCodeMutation.mutate()}
                disabled={regenerateCodeMutation.isPending}
                className="flex h-10 items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 font-[Poppins] text-xs text-blue-300 transition-colors hover:bg-blue-500/20 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${regenerateCodeMutation.isPending ? "animate-spin" : ""}`}
                />
                {t("admin.regenerar", {}, locale)}</button>
            </div>
          </div>

          <div className="flex rounded-xl bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("disciplines")}
              className={`flex-1 rounded-lg px-3 py-2 font-[Poppins] text-sm transition-colors ${activeTab === "disciplines" ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"}`}
            >
              {t("common.disciplinas", {}, locale)}</button>
            <button
              type="button"
              onClick={() => setActiveTab("students")}
              className={`flex-1 rounded-lg px-3 py-2 font-[Poppins] text-sm transition-colors ${activeTab === "students" ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"}`}
            >
              {t("common.alunos", {}, locale)}</button>
          </div>

          {activeTab === "disciplines" && (
            <div className="space-y-5">
              <SearchField
                value={disciplineSearch}
                onChange={setDisciplineSearch}
                placeholder={t("admin.buscarDisciplina", {}, locale)}
              />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-[Poppins] text-sm font-semibold text-white">
                    {t("admin.disciplinasDisponiveis", {}, locale)}</h3>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-[Poppins] text-xs text-zinc-400">
                    {filteredAvailableDisciplines.length}
                  </span>
                </div>
                <AssignmentList
                  items={filteredAvailableDisciplines}
                  emptyText={t("admin.noAvailableSubjects")}
                  action={(discipline) => (
                    <button
                      type="button"
                      disabled={attachDisciplineMutation.isPending}
                      onClick={() =>
                        attachDisciplineMutation.mutate(discipline._id)
                      }
                      className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 font-[Poppins] text-xs text-blue-300 transition-colors hover:bg-blue-500/20 disabled:opacity-50"
                    >
                      {t("common.vincular", {}, locale)}</button>
                  )}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-400" />
                    <h3 className="font-[Poppins] text-sm font-semibold text-white">
                      {t("admin.gradeDaTurma", {}, locale)}</h3>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-[Poppins] text-xs text-zinc-400">
                    {filteredLinkedDisciplines.length}
                  </span>
                </div>
                <AssignmentList
                  items={filteredLinkedDisciplines}
                  emptyText={t("admin.noLinkedSubjects")}
                  action={(discipline) => (
                    <button
                      type="button"
                      disabled={detachDisciplineMutation.isPending}
                      onClick={() =>
                        detachDisciplineMutation.mutate(discipline._id)
                      }
                      className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 font-[Poppins] text-xs text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      {t("common.remover", {}, locale)}</button>
                  )}
                />
              </div>
            </div>
          )}

          {activeTab === "students" && (
            <div className="space-y-5">
              <SearchField
                value={studentSearch}
                onChange={setStudentSearch}
                placeholder={t("common.buscarAlunoPorNomeOuEmail", {}, locale)}
              />

              <div className="rounded-xl border border-white/10 bg-neutral-950/40 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-400" />
                  <p className="font-[Poppins] text-sm font-semibold text-white">
                    {t("admin.matriculaPorTurma", {}, locale)}</p>
                </div>
                <p className="mt-1 font-[Poppins] text-xs leading-relaxed text-zinc-500">
                  {t("admin.alunosPertencemAUmaUnicaTurmaTransferir", {}, locale)}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-[Poppins] text-sm font-semibold text-white">
                    {t("admin.alunosDeOutrasTurmasDoCurso", {}, locale)}</h3>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-[Poppins] text-xs text-zinc-400">
                    {filteredAvailableStudents.length}
                  </span>
                </div>
                <AssignmentList
                  items={filteredAvailableStudents}
                  emptyText={t("admin.noTransferStudents")}
                  action={(student) => (
                    <button
                      type="button"
                      disabled={enrollStudentMutation.isPending}
                      onClick={() => enrollStudentMutation.mutate(student._id)}
                      className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-[Poppins] text-xs text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                    >
                      {t("admin.transferir", {}, locale)}</button>
                  )}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-[Poppins] text-sm font-semibold text-white">
                    {t("admin.alunosDaTurma", {}, locale)}</h3>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-[Poppins] text-xs text-zinc-400">
                    {filteredEnrolledStudents.length}
                  </span>
                </div>
                <AssignmentList
                  items={filteredEnrolledStudents}
                  emptyText={t("admin.noClassStudents")}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );

  if (isLoading) {
    if (inModal) return loader;
    return (
      <section className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 sm:p-6">
        {loader}
      </section>
    );
  }

  if (inModal) return body;
  return (
    <section className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 sm:p-6">
      {body}
    </section>
  );
}
