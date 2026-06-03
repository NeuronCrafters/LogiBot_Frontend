import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Link2Off, Loader2, Plus, UserMinus, UserPlus, Users } from "lucide-react";
import { academicApi, academicFiltersApi } from "@/services/apiClient";
import { toast } from "@/shared/lib/toast";

const selectCls = "h-11 w-full rounded-xl border border-white/10 bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white outline-none transition-colors focus:border-blue-500/60";

type RegistrationResponse = {
  registrationCodes?: Array<{ code: string; classId: string; disciplineId: string }>;
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
  const [lastCode, setLastCode] = useState("");

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
  const linkedDisciplineIds = useMemo(() => new Set((classItem?.disciplines ?? []).map((d) => d._id)), [classItem]);
  const availableDisciplines = useMemo(() => (course?.disciplines ?? []).filter((d) => !linkedDisciplineIds.has(d._id)), [course, linkedDisciplineIds]);
  const enrolledStudentIds = useMemo(() => new Set((classItem?.students ?? []).map((s) => s._id)), [classItem]);
  const availableStudents = useMemo(() => (course?.students ?? []).filter((s) => !enrolledStudentIds.has(s._id)), [course, enrolledStudentIds]);

  const attachDisciplineMutation = useMutation({
    mutationFn: async () => academicApi.attachDisciplineToClass<RegistrationResponse>(selectedClass, selectedDiscipline),
    onSuccess: (response) => {
      const code = response.registrationCodes?.[0]?.code || "";
      setLastCode(code);
      setSelectedDiscipline("");
      queryClient.invalidateQueries({ queryKey: ["academicData"] });
      toast.success(code ? `Disciplina vinculada. Código: ${code}` : "Disciplina vinculada à turma.");
    },
    onError: () => toast.error("Não foi possível vincular a disciplina."),
  });

  const detachDisciplineMutation = useMutation({
    mutationFn: async (disciplineId: string) => academicApi.detachDisciplineFromClass(selectedClass, disciplineId),
    onSuccess: () => {
      setLastCode("");
      queryClient.invalidateQueries({ queryKey: ["academicData"] });
      toast.success("Disciplina desvinculada da turma.");
    },
    onError: () => toast.error("Não foi possível desvincular a disciplina."),
  });

  const enrollStudentMutation = useMutation({
    mutationFn: async () => academicApi.enrollStudentInClass(selectedClass, selectedStudent),
    onSuccess: () => {
      setSelectedStudent("");
      queryClient.invalidateQueries({ queryKey: ["academicData"] });
      toast.success("Aluno adicionado à turma.");
    },
    onError: () => toast.error("Não foi possível adicionar o aluno."),
  });

  const removeStudentMutation = useMutation({
    mutationFn: async (studentId: string) => academicApi.removeStudentFromClass(selectedClass, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academicData"] });
      toast.success("Aluno removido da turma.");
    },
    onError: () => toast.error("Não foi possível remover o aluno."),
  });

  const resetUniversity = (universityId: string) => {
    setSelectedUniversity(universityId);
    setSelectedCourse(""); setSelectedClass(""); setSelectedDiscipline(""); setSelectedStudent(""); setLastCode("");
  };
  const resetCourse = (courseId: string) => {
    setSelectedCourse(courseId);
    setSelectedClass(""); setSelectedDiscipline(""); setSelectedStudent(""); setLastCode("");
  };

  const loader = (
    <div className="flex items-center gap-2 text-zinc-500 font-[Poppins] text-sm">
      <Loader2 className="h-4 w-4 animate-spin" />Carregando vínculos...
    </div>
  );

  const body = (
    <>
      {!inModal && (
        <div className="mb-5">
          <h2 className="font-[Poppins] text-base font-semibold text-white">Disciplinas por turma</h2>
          <p className="mt-1 font-[Poppins] text-xs text-zinc-500">Vincule disciplinas e gerencie os alunos de uma turma.</p>
        </div>
      )}

      {/* Selectors */}
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
          <select value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setSelectedDiscipline(""); setSelectedStudent(""); setLastCode(""); }} className={selectCls} disabled={!selectedCourse}>
            <option value="">Selecione</option>
            {course?.classes.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </select>
        </div>
      </div>

      {classItem && (
        <div className="mt-6 space-y-6">
          {/* Disciplinas */}
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
              {lastCode && <p className="font-[Poppins] text-xs text-zinc-400">Código gerado: <span className="font-mono text-blue-300">{lastCode}</span></p>}
              {availableDisciplines.length === 0 && !lastCode && <p className="font-[Poppins] text-xs text-zinc-600">Todas as disciplinas já estão vinculadas.</p>}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-0.5">
                <span className="font-[Poppins] text-sm font-semibold text-white">Disciplinas vinculadas</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-[Poppins] text-xs text-zinc-400">{classItem.disciplines.length}</span>
              </div>
              <div className="rounded-xl border border-white/10 overflow-hidden">
                {classItem.disciplines.length === 0 ? (
                  <p className="px-4 py-6 text-center font-[Poppins] text-sm text-zinc-600">Nenhuma disciplina vinculada ainda.</p>
                ) : classItem.disciplines.map((discipline) => (
                  <div key={discipline._id} className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3 last:border-0 hover:bg-white/[0.02]">
                    <div className="min-w-0">
                      <p className="font-[Poppins] text-sm text-white truncate">{discipline.name}</p>
                      {discipline.code && <span className="font-mono text-xs text-blue-400">{discipline.code}</span>}
                    </div>
                    <button type="button" disabled={detachDisciplineMutation.isPending} onClick={() => detachDisciplineMutation.mutate(discipline._id)} className="flex shrink-0 items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 font-[Poppins] text-xs text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50">
                      <Link2Off className="h-3.5 w-3.5" />Remover
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Alunos */}
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-neutral-950/40 p-4">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 shrink-0 text-emerald-400" />
                <span className="font-[Poppins] text-sm font-semibold text-white">Adicionar aluno</span>
              </div>
              <div className="flex gap-2">
                <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className={selectCls}>
                  <option value="">Selecione um aluno</option>
                  {availableStudents.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
                <button type="button" disabled={!selectedStudent || enrollStudentMutation.isPending} onClick={() => enrollStudentMutation.mutate()} className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 font-[Poppins] text-sm text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-50">
                  <Users className="h-4 w-4" />Adicionar
                </button>
              </div>
              {availableStudents.length === 0 && <p className="font-[Poppins] text-xs text-zinc-600">Todos os alunos do curso já estão nesta turma.</p>}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-0.5">
                <span className="font-[Poppins] text-sm font-semibold text-white">Alunos da turma</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-[Poppins] text-xs text-zinc-400">{classItem.students.length}</span>
              </div>
              <div className="rounded-xl border border-white/10 overflow-hidden">
                {classItem.students.length === 0 ? (
                  <p className="px-4 py-6 text-center font-[Poppins] text-sm text-zinc-600">Nenhum aluno nesta turma ainda.</p>
                ) : classItem.students.map((student) => (
                  <div key={student._id} className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3 last:border-0 hover:bg-white/[0.02]">
                    <div className="min-w-0">
                      <p className="font-[Poppins] text-sm text-white truncate">{student.name}</p>
                      <p className="font-[Poppins] text-xs text-zinc-500 truncate">{student.email}</p>
                    </div>
                    <button type="button" disabled={removeStudentMutation.isPending} onClick={() => removeStudentMutation.mutate(student._id)} className="flex shrink-0 items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 font-[Poppins] text-xs text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50">
                      <UserMinus className="h-3.5 w-3.5" />Remover
                    </button>
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
