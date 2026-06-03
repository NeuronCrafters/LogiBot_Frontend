import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, KeyRound, Link2, Link2Off, Loader2, Plus, RefreshCw, UserPlus, Users } from "lucide-react";
import { academicApi, academicFiltersApi } from "@/services/apiClient";
import { toast } from "@/shared/lib/toast";

const selectCls = "h-11 w-full rounded-xl border border-white/10 bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white outline-none transition-colors focus:border-blue-500/60";

type RegistrationCodeResponse = {
  registrationCode?: string;
};

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
  const [selectedUniversity, setSelectedUniversity] = useState(initialUniversityId);
  const [selectedCourse, setSelectedCourse] = useState(initialCourseId);
  const [selectedClass, setSelectedClass] = useState(initialClassId);
  const [selectedDiscipline, setSelectedDiscipline] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [latestRegistrationCode, setLatestRegistrationCode] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  const { data: academicData, isLoading } = useQuery({
    queryKey: ["academicData"],
    queryFn: async () => {
      const response = await academicFiltersApi.getAcademicData();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const courses = useMemo(() => academicData?.universities.find((u) => u._id === selectedUniversity)?.courses ?? [], [academicData, selectedUniversity]);
  const course = useMemo(() => courses.find((item) => item._id === selectedCourse), [courses, selectedCourse]);
  const classItem = useMemo(() => course?.classes.find((item) => item._id === selectedClass), [course, selectedClass]);
  const registrationCode = latestRegistrationCode || classItem?.registrationCode || "";
  const linkedDisciplineIds = useMemo(() => new Set((classItem?.disciplines ?? []).map((d) => d._id)), [classItem]);
  const availableDisciplines = useMemo(() => (course?.disciplines ?? []).filter((d) => !linkedDisciplineIds.has(d._id)), [course, linkedDisciplineIds]);
  const enrolledStudentIds = useMemo(() => new Set((classItem?.students ?? []).map((s) => s._id)), [classItem]);
  const availableStudents = useMemo(() => (course?.students ?? []).filter((s) => !enrolledStudentIds.has(s._id)), [course, enrolledStudentIds]);

  const attachDisciplineMutation = useMutation({
    mutationFn: async () => academicApi.attachDisciplineToClass(selectedClass, selectedDiscipline),
    onSuccess: () => {
      setSelectedDiscipline("");
      queryClient.invalidateQueries({ queryKey: ["academicData"] });
      toast.success("Disciplina vinculada a grade da turma.");
    },
    onError: () => toast.error("Nao foi possivel vincular a disciplina."),
  });

  const detachDisciplineMutation = useMutation({
    mutationFn: async (disciplineId: string) => academicApi.detachDisciplineFromClass(selectedClass, disciplineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academicData"] });
      toast.success("Disciplina removida da grade da turma.");
    },
    onError: () => toast.error("Nao foi possivel desvincular a disciplina."),
  });

  const regenerateCodeMutation = useMutation({
    mutationFn: async () => academicApi.regenerateClassRegistrationCode<RegistrationCodeResponse>(selectedClass),
    onSuccess: (response) => {
      setLatestRegistrationCode(response.registrationCode || "");
      setCopiedCode(false);
      queryClient.invalidateQueries({ queryKey: ["academicData"] });
      toast.success("Codigo da turma regenerado.");
    },
    onError: () => toast.error("Nao foi possivel regenerar o codigo da turma."),
  });

  const enrollStudentMutation = useMutation({
    mutationFn: async () => academicApi.enrollStudentInClass(selectedClass, selectedStudent),
    onSuccess: () => {
      setSelectedStudent("");
      queryClient.invalidateQueries({ queryKey: ["academicData"] });
      toast.success("Aluno transferido para a turma.");
    },
    onError: () => toast.error("Nao foi possivel adicionar o aluno."),
  });

  const resetUniversity = (universityId: string) => {
    setSelectedUniversity(universityId);
    setSelectedCourse("");
    setSelectedClass("");
    setSelectedDiscipline("");
    setSelectedStudent("");
    setLatestRegistrationCode("");
    setCopiedCode(false);
  };

  const resetCourse = (courseId: string) => {
    setSelectedCourse(courseId);
    setSelectedClass("");
    setSelectedDiscipline("");
    setSelectedStudent("");
    setLatestRegistrationCode("");
    setCopiedCode(false);
  };

  const resetClass = (classId: string) => {
    setSelectedClass(classId);
    setSelectedDiscipline("");
    setSelectedStudent("");
    setLatestRegistrationCode("");
    setCopiedCode(false);
  };

  const copyRegistrationCode = async () => {
    if (!registrationCode) return;
    await navigator.clipboard.writeText(registrationCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const loader = (
    <div className="flex items-center gap-2 text-zinc-500 font-[Poppins] text-sm">
      <Loader2 className="h-4 w-4 animate-spin" />Carregando vinculos...
    </div>
  );

  const body = (
    <>
      {!inModal && (
        <div className="mb-5">
          <h2 className="font-[Poppins] text-base font-semibold text-white">Grade da turma</h2>
          <p className="mt-1 font-[Poppins] text-xs text-zinc-500">Gerencie disciplinas, codigo de acesso e alunos da turma.</p>
        </div>
      )}

      {!inModal && (
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block mb-1.5 font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">Universidade</label>
            <select value={selectedUniversity} onChange={(e) => resetUniversity(e.target.value)} className={selectCls}>
              <option value="">Selecione</option>
              {academicData?.universities.map((university) => (
                <option key={university._id} value={university._id}>{university.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1.5 font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">Curso</label>
            <select value={selectedCourse} onChange={(e) => resetCourse(e.target.value)} className={selectCls} disabled={!selectedUniversity}>
              <option value="">Selecione</option>
              {courses.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block mb-1.5 font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">Turma</label>
            <select value={selectedClass} onChange={(e) => resetClass(e.target.value)} className={selectCls} disabled={!selectedCourse}>
              <option value="">Selecione</option>
              {course?.classes.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
            </select>
          </div>
        </div>
      )}

      {classItem && (
        <div className="mt-6 space-y-6">
          <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-neutral-950/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <KeyRound className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">Codigo da turma</p>
                <p className="mt-1 truncate font-mono text-base font-semibold text-blue-300">{registrationCode}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={copyRegistrationCode} disabled={!registrationCode} className="flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 font-[Poppins] text-xs text-zinc-300 transition-colors hover:bg-white/10 disabled:opacity-50">
                {copiedCode ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                {copiedCode ? "Copiado" : "Copiar"}
              </button>
              <button type="button" onClick={() => regenerateCodeMutation.mutate()} disabled={regenerateCodeMutation.isPending} className="flex h-10 items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 font-[Poppins] text-xs text-blue-300 transition-colors hover:bg-blue-500/20 disabled:opacity-50">
                <RefreshCw className={`h-4 w-4 ${regenerateCodeMutation.isPending ? "animate-spin" : ""}`} />
                Regenerar
              </button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-neutral-950/40 p-4">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 shrink-0 text-blue-400" />
                <span className="font-[Poppins] text-sm font-semibold text-white">Vincular disciplina</span>
              </div>
              <div className="flex gap-2">
                <select value={selectedDiscipline} onChange={(e) => setSelectedDiscipline(e.target.value)} className={selectCls}>
                  <option value="">Selecione uma disciplina</option>
                  {availableDisciplines.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
                <button type="button" disabled={!selectedDiscipline || attachDisciplineMutation.isPending} onClick={() => attachDisciplineMutation.mutate()} className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 font-[Poppins] text-sm text-blue-300 transition-colors hover:bg-blue-500/20 disabled:opacity-50">
                  <Link2 className="h-4 w-4" />Vincular
                </button>
              </div>
              {availableDisciplines.length === 0 && <p className="font-[Poppins] text-xs text-zinc-600">Todas as disciplinas ja estao vinculadas.</p>}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-0.5">
                <span className="font-[Poppins] text-sm font-semibold text-white">Disciplinas vinculadas</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-[Poppins] text-xs text-zinc-400">{classItem.disciplines.length}</span>
              </div>
              <div className="overflow-hidden rounded-xl border border-white/10">
                {classItem.disciplines.length === 0 ? (
                  <p className="px-4 py-6 text-center font-[Poppins] text-sm text-zinc-600">Nenhuma disciplina vinculada ainda.</p>
                ) : classItem.disciplines.map((discipline) => (
                  <div key={discipline._id} className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3 last:border-0 hover:bg-white/[0.02]">
                    <p className="min-w-0 truncate font-[Poppins] text-sm text-white">{discipline.name}</p>
                    <button type="button" disabled={detachDisciplineMutation.isPending} onClick={() => detachDisciplineMutation.mutate(discipline._id)} className="flex shrink-0 items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 font-[Poppins] text-xs text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50">
                      <Link2Off className="h-3.5 w-3.5" />Remover
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-neutral-950/40 p-4">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 shrink-0 text-emerald-400" />
                <span className="font-[Poppins] text-sm font-semibold text-white">Transferir aluno para esta turma</span>
              </div>
              <div className="flex gap-2">
                <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className={selectCls}>
                  <option value="">Selecione um aluno</option>
                  {availableStudents.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
                <button type="button" disabled={!selectedStudent || enrollStudentMutation.isPending} onClick={() => enrollStudentMutation.mutate()} className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 font-[Poppins] text-sm text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-50">
                  <Users className="h-4 w-4" />Transferir
                </button>
              </div>
              {availableStudents.length === 0 && <p className="font-[Poppins] text-xs text-zinc-600">Todos os alunos do curso ja estao nesta turma.</p>}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-0.5">
                <span className="font-[Poppins] text-sm font-semibold text-white">Alunos da turma</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-[Poppins] text-xs text-zinc-400">{classItem.students.length}</span>
              </div>
              <div className="overflow-hidden rounded-xl border border-white/10">
                {classItem.students.length === 0 ? (
                  <p className="px-4 py-6 text-center font-[Poppins] text-sm text-zinc-600">Nenhum aluno nesta turma ainda.</p>
                ) : classItem.students.map((student) => (
                  <div key={student._id} className="border-b border-white/5 px-4 py-3 last:border-0 hover:bg-white/[0.02]">
                    <p className="truncate font-[Poppins] text-sm text-white">{student.name}</p>
                    <p className="truncate font-[Poppins] text-xs text-zinc-500">{student.email}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (isLoading) {
    if (inModal) return loader;
    return <section className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 sm:p-6">{loader}</section>;
  }

  if (inModal) return body;
  return <section className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 sm:p-6">{body}</section>;
}
