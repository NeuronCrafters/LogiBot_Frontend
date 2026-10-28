import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, UserMinus, Users } from "lucide-react";
import { academicApi, academicFiltersApi } from "@/services/apiClient";
import { toast } from "@/shared/lib/toast";
import { Select } from "@/components/ui/select";

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
      toast.success("Professor linked to the subject.");
      queryClient.invalidateQueries({ queryKey: ["academicData"] });
    },
    onError: () => toast.error("Could not link the professor."),
  });

  const detachProfessorMutation = useMutation({
    mutationFn: async (professorId: string) =>
      academicApi.detachProfessorFromDiscipline(
        selectedDiscipline,
        professorId,
      ),
    onSuccess: () => {
      toast.success("Professor unlinked from the subject.");
      queryClient.invalidateQueries({ queryKey: ["academicData"] });
    },
    onError: () => toast.error("Could not unlink the professor."),
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
      Loading links...
    </div>
  );

  const body = (
    <>
      {!inModal && (
        <div className="mb-5">
          <h2 className="font-[Poppins] text-base font-semibold text-white">
            Manage subject
          </h2>
          <p className="mt-1 font-[Poppins] text-xs text-zinc-500">
            Link professors and follow the students of the classes with this subject.
          </p>
        </div>
      )}

      {!inModal && (
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block mb-1.5 font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">
              University
            </label>
            <Select
              value={selectedUniversity}
              onChange={(v) => resetAfterUniversity(v)}
              options={(academicData?.universities ?? []).map((university) => ({ value: university._id, label: university.name }))}
              placeholder="Select"
            />
          </div>
          <div>
            <label className="block mb-1.5 font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Program
            </label>
            <Select
              value={selectedCourse}
              onChange={(v) => resetAfterCourse(v)}
              options={courses.map((item) => ({ value: item._id, label: item.name }))}
              placeholder="Select"
              disabled={!selectedUniversity}
            />
          </div>
          <div>
            <label className="block mb-1.5 font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Subject
            </label>
            <Select
              value={selectedDiscipline}
              onChange={(v) => resetAfterDiscipline(v)}
              options={(course?.disciplines ?? []).map((item) => ({ value: item._id, label: item.name }))}
              placeholder="Select"
              disabled={!selectedCourse}
            />
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
              Professors
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("students")}
              className={`flex-1 rounded-lg px-3 py-2 font-[Poppins] text-sm transition-colors ${activeTab === "students" ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"}`}
            >
              Students
            </button>
          </div>

          {activeTab === "professors" && (
            <div className="space-y-5">
              <SearchField
                value={professorSearch}
                onChange={setProfessorSearch}
                placeholder="Search professor by name or email..."
              />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-[Poppins] text-sm font-semibold text-white">
                    Available professors
                  </h3>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-[Poppins] text-xs text-zinc-400">
                    {filteredAvailableProfessors.length}
                  </span>
                </div>
                <PersonList
                  items={filteredAvailableProfessors}
                  emptyText="No professor available."
                  action={(professor) => (
                    <button
                      type="button"
                      disabled={attachProfessorMutation.isPending}
                      onClick={() =>
                        attachProfessorMutation.mutate(professor._id)
                      }
                      className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 font-[Poppins] text-xs text-blue-300 transition-colors hover:bg-blue-500/20 disabled:opacity-50"
                    >
                      Link
                    </button>
                  )}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-[Poppins] text-sm font-semibold text-white">
                    Linked professors
                  </h3>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-[Poppins] text-xs text-zinc-400">
                    {filteredLinkedProfessors.length}
                  </span>
                </div>
                <PersonList
                  items={filteredLinkedProfessors}
                  emptyText="No professor linked."
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
                      Remove
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
                placeholder="Search student by name or email..."
              />

              <div className="rounded-xl border border-white/10 bg-neutral-950/40 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-400" />
                  <p className="font-[Poppins] text-sm font-semibold text-white">
                    Access by class
                  </p>
                </div>
                <p className="mt-1 font-[Poppins] text-xs leading-relaxed text-zinc-500">
                  To add a student to this list, add the student to a class that has this subject in its curriculum.
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
                    Students with access
                  </h3>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-[Poppins] text-xs text-zinc-400">
                    {filteredStudents.length}
                  </span>
                </div>
                <PersonList
                  items={filteredStudents}
                  emptyText="No students in classes with this subject."
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
