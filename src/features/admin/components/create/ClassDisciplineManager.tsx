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

const selectCls =
  "h-11 w-full rounded-xl border border-white/10 bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white outline-none transition-colors focus:border-blue-500/60";
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
      toast.success("Disciplina vinculada a grade da turma.");
    },
    onError: () => toast.error("Nao foi possivel vincular a disciplina."),
  });

  const detachDisciplineMutation = useMutation({
    mutationFn: async (disciplineId: string) =>
      academicApi.detachDisciplineFromClass(selectedClass, disciplineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academicData"] });
      toast.success("Disciplina removida da grade da turma.");
    },
    onError: () => toast.error("Nao foi possivel desvincular a disciplina."),
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
      toast.success("Codigo da turma regenerado.");
    },
    onError: () => toast.error("Nao foi possivel regenerar o codigo da turma."),
  });

  const enrollStudentMutation = useMutation({
    mutationFn: async (studentId: string) =>
      academicApi.enrollStudentInClass(selectedClass, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academicData"] });
      toast.success("Aluno transferido para a turma.");
    },
    onError: () => toast.error("Nao foi possivel transferir o aluno."),
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
      Carregando vinculos...
    </div>
  );

  const body = (
    <>
      {!inModal && (
        <div className="mb-5">
          <h2 className="font-[Poppins] text-base font-semibold text-white">
            Gerenciar turma
          </h2>
          <p className="mt-1 font-[Poppins] text-xs text-zinc-500">
            Controle grade, codigo de acesso e alunos da turma.
          </p>
        </div>
      )}

      {!inModal && (
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block mb-1.5 font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Universidade
            </label>
            <select
              value={selectedUniversity}
              onChange={(event) => resetUniversity(event.target.value)}
              className={selectCls}
            >
              <option value="">Selecione</option>
              {academicData?.universities.map((university) => (
                <option key={university._id} value={university._id}>
                  {university.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1.5 font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Curso
            </label>
            <select
              value={selectedCourse}
              onChange={(event) => resetCourse(event.target.value)}
              className={selectCls}
              disabled={!selectedUniversity}
            >
              <option value="">Selecione</option>
              {courses.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1.5 font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Turma
            </label>
            <select
              value={selectedClass}
              onChange={(event) => resetClass(event.target.value)}
              className={selectCls}
              disabled={!selectedCourse}
            >
              <option value="">Selecione</option>
              {course?.classes.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
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
                  Codigo da turma
                </p>
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
                {copiedCode ? "Copiado" : "Copiar"}
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
                Regenerar
              </button>
            </div>
          </div>

          <div className="flex rounded-xl bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("disciplines")}
              className={`flex-1 rounded-lg px-3 py-2 font-[Poppins] text-sm transition-colors ${activeTab === "disciplines" ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"}`}
            >
              Disciplinas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("students")}
              className={`flex-1 rounded-lg px-3 py-2 font-[Poppins] text-sm transition-colors ${activeTab === "students" ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"}`}
            >
              Alunos
            </button>
          </div>

          {activeTab === "disciplines" && (
            <div className="space-y-5">
              <SearchField
                value={disciplineSearch}
                onChange={setDisciplineSearch}
                placeholder="Buscar disciplina..."
              />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-[Poppins] text-sm font-semibold text-white">
                    Disciplinas disponiveis
                  </h3>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-[Poppins] text-xs text-zinc-400">
                    {filteredAvailableDisciplines.length}
                  </span>
                </div>
                <AssignmentList
                  items={filteredAvailableDisciplines}
                  emptyText="Nenhuma disciplina disponivel."
                  action={(discipline) => (
                    <button
                      type="button"
                      disabled={attachDisciplineMutation.isPending}
                      onClick={() =>
                        attachDisciplineMutation.mutate(discipline._id)
                      }
                      className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 font-[Poppins] text-xs text-blue-300 transition-colors hover:bg-blue-500/20 disabled:opacity-50"
                    >
                      Vincular
                    </button>
                  )}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-400" />
                    <h3 className="font-[Poppins] text-sm font-semibold text-white">
                      Grade da turma
                    </h3>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-[Poppins] text-xs text-zinc-400">
                    {filteredLinkedDisciplines.length}
                  </span>
                </div>
                <AssignmentList
                  items={filteredLinkedDisciplines}
                  emptyText="Nenhuma disciplina vinculada."
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
                      Remover
                    </button>
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
                placeholder="Buscar aluno por nome ou email..."
              />

              <div className="rounded-xl border border-white/10 bg-neutral-950/40 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-400" />
                  <p className="font-[Poppins] text-sm font-semibold text-white">
                    Matricula por turma
                  </p>
                </div>
                <p className="mt-1 font-[Poppins] text-xs leading-relaxed text-zinc-500">
                  Alunos pertencem a uma unica turma. Transferir um aluno para
                  esta turma altera suas disciplinas conforme a grade atual.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-[Poppins] text-sm font-semibold text-white">
                    Alunos de outras turmas do curso
                  </h3>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-[Poppins] text-xs text-zinc-400">
                    {filteredAvailableStudents.length}
                  </span>
                </div>
                <AssignmentList
                  items={filteredAvailableStudents}
                  emptyText="Nenhum aluno disponivel para transferencia."
                  action={(student) => (
                    <button
                      type="button"
                      disabled={enrollStudentMutation.isPending}
                      onClick={() => enrollStudentMutation.mutate(student._id)}
                      className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-[Poppins] text-xs text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                    >
                      Transferir
                    </button>
                  )}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-[Poppins] text-sm font-semibold text-white">
                    Alunos da turma
                  </h3>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-[Poppins] text-xs text-zinc-400">
                    {filteredEnrolledStudents.length}
                  </span>
                </div>
                <AssignmentList
                  items={filteredEnrolledStudents}
                  emptyText="Nenhum aluno nesta turma."
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
