import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, UserMinus, Users } from "lucide-react";
import { academicApi, academicFiltersApi } from "@/services/apiClient";
import { toast } from "@/shared/lib/toast";

const selectCls =
  "h-11 w-full rounded-xl border border-white/10 bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white outline-none transition-colors focus:border-blue-500/60";
const inputCls =
  "h-11 w-full rounded-xl border border-white/10 bg-neutral-950/60 pl-10 pr-3 font-[Poppins] text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-blue-500/60";

type ActiveTab = "professors" | "students";
type Person = { _id: string; name: string; email?: string };

function matchesSearch(item: Person, search: string) {
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

function PersonList({
  items,
  emptyText,
  action,
}: {
  items: Person[];
  emptyText: string;
  action?: (item: Person) => ReactNode;
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
  const [selectedUniversity, setSelectedUniversity] =
    useState(initialUniversityId);
  const [selectedCourse, setSelectedCourse] = useState(initialCourseId);
  const [selectedDiscipline, setSelectedDiscipline] =
    useState(initialDisciplineId);
  const [activeTab, setActiveTab] = useState<ActiveTab>("professors");
  const [professorSearch, setProfessorSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

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
    return (
      academicData.universities.find((u) => u._id === selectedUniversity)
        ?.courses ?? []
    );
  }, [academicData, selectedUniversity]);

  const course = useMemo(
    () => courses.find((item) => item._id === selectedCourse),
    [courses, selectedCourse],
  );
  const discipline = useMemo(
    () => course?.disciplines.find((item) => item._id === selectedDiscipline),
    [course, selectedDiscipline],
  );
  const assignedProfessorIds = useMemo(
    () => new Set((discipline?.professors ?? []).map((p) => p._id)),
    [discipline],
  );
  const availableProfessors = useMemo(
    () =>
      (course?.professors ?? []).filter(
        (p) => !assignedProfessorIds.has(p._id),
      ),
    [course, assignedProfessorIds],
  );
  const linkedProfessors = useMemo(
    () => discipline?.professors ?? [],
    [discipline],
  );
  const studentsWithAccess = useMemo(
    () => discipline?.students ?? [],
    [discipline],
  );
  const linkedClasses = useMemo(() => discipline?.classes ?? [], [discipline]);

  const filteredAvailableProfessors = useMemo(
    () =>
      availableProfessors.filter((professor) =>
        matchesSearch(professor, professorSearch),
      ),
    [availableProfessors, professorSearch],
  );
  const filteredLinkedProfessors = useMemo(
    () =>
      linkedProfessors.filter((professor) =>
        matchesSearch(professor, professorSearch),
      ),
    [linkedProfessors, professorSearch],
  );
  const filteredStudents = useMemo(
    () =>
      studentsWithAccess.filter((student) =>
        matchesSearch(student, studentSearch),
      ),
    [studentsWithAccess, studentSearch],
  );

  const attachProfessorMutation = useMutation({
    mutationFn: async (professorId: string) =>
      academicApi.attachProfessorToDiscipline(selectedDiscipline, professorId),
    onSuccess: () => {
      toast.success("Professor vinculado a disciplina.");
      queryClient.invalidateQueries({ queryKey: ["academicData"] });
    },
    onError: () => toast.error("Nao foi possivel vincular o professor."),
  });

  const detachProfessorMutation = useMutation({
    mutationFn: async (professorId: string) =>
      academicApi.detachProfessorFromDiscipline(
        selectedDiscipline,
        professorId,
      ),
    onSuccess: () => {
      toast.success("Professor desvinculado da disciplina.");
      queryClient.invalidateQueries({ queryKey: ["academicData"] });
    },
    onError: () => toast.error("Nao foi possivel desvincular o professor."),
  });

  const resetAfterUniversity = (universityId: string) => {
    setSelectedUniversity(universityId);
    setSelectedCourse("");
    setSelectedDiscipline("");
    setProfessorSearch("");
    setStudentSearch("");
  };

  const resetAfterCourse = (courseId: string) => {
    setSelectedCourse(courseId);
    setSelectedDiscipline("");
    setProfessorSearch("");
    setStudentSearch("");
  };

  const resetAfterDiscipline = (disciplineId: string) => {
    setSelectedDiscipline(disciplineId);
    setProfessorSearch("");
    setStudentSearch("");
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
            Gerenciar disciplina
          </h2>
          <p className="mt-1 font-[Poppins] text-xs text-zinc-500">
            Vincule professores e acompanhe os alunos das turmas com esta
            disciplina.
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
              onChange={(event) => resetAfterUniversity(event.target.value)}
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
              onChange={(event) => resetAfterCourse(event.target.value)}
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
              Disciplina
            </label>
            <select
              value={selectedDiscipline}
              onChange={(event) => resetAfterDiscipline(event.target.value)}
              className={selectCls}
              disabled={!selectedCourse}
            >
              <option value="">Selecione</option>
              {course?.disciplines.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {discipline && (
        <div className="space-y-5">
          <div className="flex rounded-xl bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("professors")}
              className={`flex-1 rounded-lg px-3 py-2 font-[Poppins] text-sm transition-colors ${activeTab === "professors" ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"}`}
            >
              Professores
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("students")}
              className={`flex-1 rounded-lg px-3 py-2 font-[Poppins] text-sm transition-colors ${activeTab === "students" ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"}`}
            >
              Alunos
            </button>
          </div>

          {activeTab === "professors" && (
            <div className="space-y-5">
              <SearchField
                value={professorSearch}
                onChange={setProfessorSearch}
                placeholder="Buscar professor por nome ou email..."
              />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-[Poppins] text-sm font-semibold text-white">
                    Professores disponiveis
                  </h3>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-[Poppins] text-xs text-zinc-400">
                    {filteredAvailableProfessors.length}
                  </span>
                </div>
                <PersonList
                  items={filteredAvailableProfessors}
                  emptyText="Nenhum professor disponivel."
                  action={(professor) => (
                    <button
                      type="button"
                      disabled={attachProfessorMutation.isPending}
                      onClick={() =>
                        attachProfessorMutation.mutate(professor._id)
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
                  <h3 className="font-[Poppins] text-sm font-semibold text-white">
                    Professores vinculados
                  </h3>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-[Poppins] text-xs text-zinc-400">
                    {filteredLinkedProfessors.length}
                  </span>
                </div>
                <PersonList
                  items={filteredLinkedProfessors}
                  emptyText="Nenhum professor vinculado."
                  action={(professor) => (
                    <button
                      type="button"
                      disabled={detachProfessorMutation.isPending}
                      onClick={() =>
                        detachProfessorMutation.mutate(professor._id)
                      }
                      className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 font-[Poppins] text-xs text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                    >
                      <UserMinus className="h-3.5 w-3.5" />
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
                    Acesso por turma
                  </p>
                </div>
                <p className="mt-1 font-[Poppins] text-xs leading-relaxed text-zinc-500">
                  Para adicionar aluno nesta lista, adicione o aluno a uma turma
                  que tenha esta disciplina na grade.
                </p>
                {linkedClasses.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {linkedClasses.map((classItem) => (
                      <span
                        key={classItem._id}
                        className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-[Poppins] text-[11px] text-emerald-300"
                      >
                        {classItem.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-[Poppins] text-sm font-semibold text-white">
                    Alunos com acesso
                  </h3>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-[Poppins] text-xs text-zinc-400">
                    {filteredStudents.length}
                  </span>
                </div>
                <PersonList
                  items={filteredStudents}
                  emptyText="Nenhum aluno em turmas com esta disciplina."
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
