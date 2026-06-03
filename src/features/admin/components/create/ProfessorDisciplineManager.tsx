import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Link2Off, Loader2, Plus, UserMinus, UserPlus, Users } from "lucide-react";
import { academicApi, academicFiltersApi } from "@/services/apiClient";
import { toast } from "@/shared/lib/toast";

const selectCls = "h-11 w-full rounded-xl border border-white/10 bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white outline-none transition-colors focus:border-blue-500/60";

export function ProfessorDisciplineManager({
  initialUniversityId = "",
  initialCourseId = "",
  initialDisciplineId = "",
  inModal = false,
}: {
  initialUniversityId?: string;
  initialCourseId?: string;
  initialDisciplineId?: string;
  inModal?: boolean;
} = {}) {
  const queryClient = useQueryClient();
  const [selectedUniversity, setSelectedUniversity] = useState(initialUniversityId);
  const [selectedCourse, setSelectedCourse] = useState(initialCourseId);
  const [selectedDiscipline, setSelectedDiscipline] = useState(initialDisciplineId);
  const [selectedProfessor, setSelectedProfessor] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");

  const { data: academicData, isLoading } = useQuery({
    queryKey: ["academicData"],
    queryFn: async () => {
      const response = await academicFiltersApi.getAcademicData();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const courses = useMemo(() => {
    if (!academicData || !selectedUniversity) return [];
    return academicData.universities.find((u) => u._id === selectedUniversity)?.courses ?? [];
  }, [academicData, selectedUniversity]);

  const course = useMemo(() => courses.find((item) => item._id === selectedCourse), [courses, selectedCourse]);
  const discipline = useMemo(() => course?.disciplines.find((item) => item._id === selectedDiscipline), [course, selectedDiscipline]);
  const assignedProfessorIds = useMemo(() => new Set((discipline?.professors ?? []).map((p) => p._id)), [discipline]);
  const availableProfessors = useMemo(() => (course?.professors ?? []).filter((p) => !assignedProfessorIds.has(p._id)), [course, assignedProfessorIds]);
  const enrolledStudentIds = useMemo(() => new Set((discipline?.students ?? []).map((s) => s._id)), [discipline]);
  const availableStudents = useMemo(() => (course?.students ?? []).filter((s) => !enrolledStudentIds.has(s._id)), [course, enrolledStudentIds]);

  const attachProfessorMutation = useMutation({
    mutationFn: async () => academicApi.attachProfessorToDiscipline(selectedDiscipline, selectedProfessor),
    onSuccess: () => { toast.success("Professor vinculado à disciplina."); setSelectedProfessor(""); queryClient.invalidateQueries({ queryKey: ["academicData"] }); },
    onError: () => toast.error("Não foi possível vincular o professor."),
  });

  const detachProfessorMutation = useMutation({
    mutationFn: async (professorId: string) => academicApi.detachProfessorFromDiscipline(selectedDiscipline, professorId),
    onSuccess: () => { toast.success("Professor desvinculado da disciplina."); queryClient.invalidateQueries({ queryKey: ["academicData"] }); },
    onError: () => toast.error("Não foi possível desvincular o professor."),
  });

  const enrollStudentMutation = useMutation({
    mutationFn: async () => academicApi.enrollStudentInDiscipline(selectedDiscipline, selectedStudent),
    onSuccess: () => { setSelectedStudent(""); queryClient.invalidateQueries({ queryKey: ["academicData"] }); toast.success("Aluno adicionado à disciplina."); },
    onError: () => toast.error("Não foi possível adicionar o aluno."),
  });

  const removeStudentMutation = useMutation({
    mutationFn: async (studentId: string) => academicApi.removeStudentFromDiscipline(selectedDiscipline, studentId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["academicData"] }); toast.success("Aluno removido da disciplina."); },
    onError: () => toast.error("Não foi possível remover o aluno."),
  });

  const resetAfterUniversity = (universityId: string) => {
    setSelectedUniversity(universityId); setSelectedCourse(""); setSelectedDiscipline(""); setSelectedProfessor(""); setSelectedStudent("");
  };
  const resetAfterCourse = (courseId: string) => {
    setSelectedCourse(courseId); setSelectedDiscipline(""); setSelectedProfessor(""); setSelectedStudent("");
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
          <h2 className="font-[Poppins] text-base font-semibold text-white">Professores por disciplina</h2>
          <p className="mt-1 font-[Poppins] text-xs text-zinc-500">Vincule professores e gerencie os alunos de uma disciplina.</p>
        </div>
      )}

      {/* Selectors */}
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="block mb-1.5 font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">Universidade</label>
          <select value={selectedUniversity} onChange={(e) => resetAfterUniversity(e.target.value)} className={selectCls}>
            <option value="">Selecione</option>
            {academicData?.universities.map((university) => <option key={university._id} value={university._id}>{university.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-1.5 font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">Curso</label>
          <select value={selectedCourse} onChange={(e) => resetAfterCourse(e.target.value)} className={selectCls} disabled={!selectedUniversity}>
            <option value="">Selecione</option>
            {courses.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-1.5 font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">Disciplina</label>
          <select value={selectedDiscipline} onChange={(e) => { setSelectedDiscipline(e.target.value); setSelectedProfessor(""); setSelectedStudent(""); }} className={selectCls} disabled={!selectedCourse}>
            <option value="">Selecione</option>
            {course?.disciplines.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </select>
        </div>
      </div>

      {discipline && (
        <div className="mt-6 space-y-6">
          {/* Professores */}
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-neutral-950/40 p-4">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 shrink-0 text-blue-400" />
                <span className="font-[Poppins] text-sm font-semibold text-white">Vincular professor</span>
              </div>
              <div className="flex gap-2">
                <select value={selectedProfessor} onChange={(e) => setSelectedProfessor(e.target.value)} className={selectCls}>
                  <option value="">Selecione um professor</option>
                  {availableProfessors.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
                <button type="button" disabled={!selectedProfessor || attachProfessorMutation.isPending} onClick={() => attachProfessorMutation.mutate()} className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 font-[Poppins] text-sm text-blue-300 transition-colors hover:bg-blue-500/20 disabled:opacity-50">
                  <Link2 className="h-4 w-4" />Vincular
                </button>
              </div>
              {availableProfessors.length === 0 && <p className="font-[Poppins] text-xs text-zinc-600">Todos os professores já estão vinculados.</p>}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-0.5">
                <span className="font-[Poppins] text-sm font-semibold text-white">Professores vinculados</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-[Poppins] text-xs text-zinc-400">{discipline.professors.length}</span>
              </div>
              <div className="rounded-xl border border-white/10 overflow-hidden">
                {discipline.professors.length === 0 ? (
                  <p className="px-4 py-6 text-center font-[Poppins] text-sm text-zinc-600">Nenhum professor vinculado ainda.</p>
                ) : discipline.professors.map((professor) => (
                  <div key={professor._id} className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3 last:border-0 hover:bg-white/[0.02]">
                    <div className="min-w-0">
                      <p className="font-[Poppins] text-sm text-white truncate">{professor.name}</p>
                      <p className="font-[Poppins] text-xs text-zinc-500 truncate">{professor.email}</p>
                    </div>
                    <button type="button" disabled={detachProfessorMutation.isPending} onClick={() => detachProfessorMutation.mutate(professor._id)} className="flex shrink-0 items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 font-[Poppins] text-xs text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50">
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
              {availableStudents.length === 0 && <p className="font-[Poppins] text-xs text-zinc-600">Todos os alunos do curso já estão nesta disciplina.</p>}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-0.5">
                <span className="font-[Poppins] text-sm font-semibold text-white">Alunos da disciplina</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-[Poppins] text-xs text-zinc-400">{discipline.students.length}</span>
              </div>
              <div className="rounded-xl border border-white/10 overflow-hidden">
                {discipline.students.length === 0 ? (
                  <p className="px-4 py-6 text-center font-[Poppins] text-sm text-zinc-600">Nenhum aluno nesta disciplina ainda.</p>
                ) : discipline.students.map((student) => (
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
