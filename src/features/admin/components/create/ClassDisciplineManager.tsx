import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Link2Off, Loader2 } from "lucide-react";
import { academicApi, academicFiltersApi } from "@/services/apiClient";
import { toast } from "@/shared/lib/toast";

const labelCls = "block mb-1.5 font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500";
const selectCls = "h-11 w-full rounded-xl border border-white/10 bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white outline-none transition-colors focus:border-blue-500/60";

type RegistrationResponse = {
  registrationCodes?: Array<{ code: string; classId: string; disciplineId: string }>;
};

export function ClassDisciplineManager() {
  const queryClient = useQueryClient();
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState("");
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
  const linkedDisciplineIds = useMemo(() => new Set((classItem?.disciplines ?? []).map((discipline) => discipline._id)), [classItem]);
  const availableDisciplines = useMemo(() => (course?.disciplines ?? []).filter((discipline) => !linkedDisciplineIds.has(discipline._id)), [course, linkedDisciplineIds]);

  const attachMutation = useMutation({
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

  const detachMutation = useMutation({
    mutationFn: async (disciplineId: string) => academicApi.detachDisciplineFromClass(selectedClass, disciplineId),
    onSuccess: () => {
      setLastCode("");
      queryClient.invalidateQueries({ queryKey: ["academicData"] });
      toast.success("Disciplina desvinculada da turma.");
    },
    onError: () => toast.error("Não foi possível desvincular a disciplina."),
  });

  const resetUniversity = (universityId: string) => {
    setSelectedUniversity(universityId);
    setSelectedCourse("");
    setSelectedClass("");
    setSelectedDiscipline("");
    setLastCode("");
  };

  const resetCourse = (courseId: string) => {
    setSelectedCourse(courseId);
    setSelectedClass("");
    setSelectedDiscipline("");
    setLastCode("");
  };

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 sm:p-6">
        <div className="flex items-center gap-2 text-zinc-500 font-[Poppins] text-sm"><Loader2 className="h-4 w-4 animate-spin" />Carregando vínculos...</div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 sm:p-6">
      <div className="mb-5">
        <h2 className="font-[Poppins] text-base font-semibold text-white">Disciplinas por turma</h2>
        <p className="mt-1 font-[Poppins] text-xs text-zinc-500">Vincule disciplinas a uma turma e gere o código que os alunos usam no cadastro.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className={labelCls}>Universidade</label>
          <select value={selectedUniversity} onChange={(e) => resetUniversity(e.target.value)} className={selectCls}>
            <option value="">Selecione</option>
            {academicData?.universities.map((university) => <option key={university._id} value={university._id}>{university.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Curso</label>
          <select value={selectedCourse} onChange={(e) => resetCourse(e.target.value)} className={selectCls} disabled={!selectedUniversity}>
            <option value="">Selecione</option>
            {courses.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Turma</label>
          <select value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setSelectedDiscipline(""); setLastCode(""); }} className={selectCls} disabled={!selectedCourse}>
            <option value="">Selecione</option>
            {course?.classes.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </select>
        </div>
      </div>

      {classItem && (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div>
            <label className={labelCls}>Adicionar disciplina</label>
            <div className="flex gap-2">
              <select value={selectedDiscipline} onChange={(e) => setSelectedDiscipline(e.target.value)} className={selectCls}>
                <option value="">Selecione uma disciplina disponível</option>
                {availableDisciplines.map((discipline) => <option key={discipline._id} value={discipline._id}>{discipline.name}</option>)}
              </select>
              <button type="button" disabled={!selectedDiscipline || attachMutation.isPending} onClick={() => attachMutation.mutate()} className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 font-[Poppins] text-sm text-blue-300 transition-colors hover:bg-blue-500/20 disabled:opacity-50">
                <Link2 className="h-4 w-4" />Vincular
              </button>
            </div>
            {lastCode && <p className="mt-2 font-[Poppins] text-sm text-zinc-400">Código gerado: <span className="font-mono text-blue-300">{lastCode}</span></p>}
          </div>

          <div>
            <label className={labelCls}>Disciplinas vinculadas</label>
            <div className="rounded-xl border border-white/10 bg-neutral-950/60 p-2">
              {classItem.disciplines.length === 0 && <p className="px-2 py-2 font-[Poppins] text-sm text-zinc-600">Nenhuma disciplina vinculada.</p>}
              {classItem.disciplines.map((discipline) => (
                <div key={discipline._id} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-white/5">
                  <div>
                    <p className="font-[Poppins] text-sm text-zinc-200">{discipline.name}</p>
                    {discipline.code && <p className="font-mono text-xs text-blue-300">{discipline.code}</p>}
                  </div>
                  <button type="button" disabled={detachMutation.isPending} onClick={() => detachMutation.mutate(discipline._id)} className="flex h-8 items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 font-[Poppins] text-xs text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50">
                    <Link2Off className="h-3.5 w-3.5" />Remover
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
