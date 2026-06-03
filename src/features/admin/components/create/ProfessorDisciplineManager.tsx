import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Link2Off, Loader2 } from "lucide-react";
import { academicApi, academicFiltersApi } from "@/services/apiClient";
import { toast } from "@/shared/lib/toast";

const labelCls = "block mb-1.5 font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500";
const selectCls = "h-11 w-full rounded-xl border border-white/10 bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white outline-none transition-colors focus:border-blue-500/60";

export function ProfessorDisciplineManager() {
  const queryClient = useQueryClient();
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState("");
  const [selectedProfessor, setSelectedProfessor] = useState("");

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
  const assignedProfessorIds = useMemo(() => new Set((discipline?.professors ?? []).map((professor) => professor._id)), [discipline]);
  const availableProfessors = useMemo(() => (course?.professors ?? []).filter((professor) => !assignedProfessorIds.has(professor._id)), [course, assignedProfessorIds]);

  const attachMutation = useMutation({
    mutationFn: async () => academicApi.attachProfessorToDiscipline(selectedDiscipline, selectedProfessor),
    onSuccess: () => {
      toast.success("Professor vinculado à disciplina.");
      setSelectedProfessor("");
      queryClient.invalidateQueries({ queryKey: ["academicData"] });
    },
    onError: () => toast.error("Não foi possível vincular o professor."),
  });

  const detachMutation = useMutation({
    mutationFn: async (professorId: string) => academicApi.detachProfessorFromDiscipline(selectedDiscipline, professorId),
    onSuccess: () => {
      toast.success("Professor desvinculado da disciplina.");
      queryClient.invalidateQueries({ queryKey: ["academicData"] });
    },
    onError: () => toast.error("Não foi possível desvincular o professor."),
  });

  const resetAfterUniversity = (universityId: string) => {
    setSelectedUniversity(universityId);
    setSelectedCourse("");
    setSelectedDiscipline("");
    setSelectedProfessor("");
  };

  const resetAfterCourse = (courseId: string) => {
    setSelectedCourse(courseId);
    setSelectedDiscipline("");
    setSelectedProfessor("");
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
        <h2 className="font-[Poppins] text-base font-semibold text-white">Professores por disciplina</h2>
        <p className="mt-1 font-[Poppins] text-xs text-zinc-500">Vincule ou remova professores de uma disciplina já cadastrada.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className={labelCls}>Universidade</label>
          <select value={selectedUniversity} onChange={(e) => resetAfterUniversity(e.target.value)} className={selectCls}>
            <option value="">Selecione</option>
            {academicData?.universities.map((university) => <option key={university._id} value={university._id}>{university.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Curso</label>
          <select value={selectedCourse} onChange={(e) => resetAfterCourse(e.target.value)} className={selectCls} disabled={!selectedUniversity}>
            <option value="">Selecione</option>
            {courses.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Disciplina</label>
          <select value={selectedDiscipline} onChange={(e) => { setSelectedDiscipline(e.target.value); setSelectedProfessor(""); }} className={selectCls} disabled={!selectedCourse}>
            <option value="">Selecione</option>
            {course?.disciplines.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </select>
        </div>
      </div>

      {discipline && (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div>
            <label className={labelCls}>Adicionar professor</label>
            <div className="flex gap-2">
              <select value={selectedProfessor} onChange={(e) => setSelectedProfessor(e.target.value)} className={selectCls}>
                <option value="">Selecione um professor disponível</option>
                {availableProfessors.map((professor) => <option key={professor._id} value={professor._id}>{professor.name}</option>)}
              </select>
              <button type="button" disabled={!selectedProfessor || attachMutation.isPending} onClick={() => attachMutation.mutate()} className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 font-[Poppins] text-sm text-blue-300 transition-colors hover:bg-blue-500/20 disabled:opacity-50">
                <Link2 className="h-4 w-4" />Vincular
              </button>
            </div>
          </div>

          <div>
            <label className={labelCls}>Professores vinculados</label>
            <div className="rounded-xl border border-white/10 bg-neutral-950/60 p-2">
              {discipline.professors.length === 0 && <p className="px-2 py-2 font-[Poppins] text-sm text-zinc-600">Nenhum professor vinculado.</p>}
              {discipline.professors.map((professor) => (
                <div key={professor._id} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-white/5">
                  <div>
                    <p className="font-[Poppins] text-sm text-zinc-200">{professor.name}</p>
                    <p className="font-[Poppins] text-xs text-zinc-600">{professor.email}</p>
                  </div>
                  <button type="button" disabled={detachMutation.isPending} onClick={() => detachMutation.mutate(professor._id)} className="flex h-8 items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 font-[Poppins] text-xs text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50">
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
