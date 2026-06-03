import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Link2, Users } from "lucide-react";
import { ClassDisciplineManager } from "@/features/admin/components/create/ClassDisciplineManager";
import { ProfessorDisciplineManager } from "@/features/admin/components/create/ProfessorDisciplineManager";

function LinksHeader({ title, description, icon }: { title: string; description: string; icon: ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">{icon}</div>
        <div>
          <h1 className="font-[Poppins] text-2xl font-semibold text-white">{title}</h1>
          <p className="mt-1 font-[Poppins] text-sm leading-relaxed text-zinc-400">{description}</p>
        </div>
      </div>
    </section>
  );
}

export function ClassDisciplineLinksPage() {
  const { state } = useLocation();
  const { universityId, courseId, classId } = (state ?? {}) as {
    universityId?: string;
    courseId?: string;
    classId?: string;
  };
  return (
    <main className="flex-1 overflow-y-auto px-4 py-6 text-white md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <LinksHeader title="Grade da Turma" description="Escolha uma turma e controle as disciplinas vinculadas a ela." icon={<Link2 className="h-5 w-5" />} />
        <ClassDisciplineManager
          initialUniversityId={universityId}
          initialCourseId={courseId}
          initialClassId={classId}
        />
      </div>
    </main>
  );
}

export function ProfessorDisciplineLinksPage() {
  const { state } = useLocation();
  const { universityId, courseId, disciplineId } = (state ?? {}) as {
    universityId?: string;
    courseId?: string;
    disciplineId?: string;
  };
  return (
    <main className="flex-1 overflow-y-auto px-4 py-6 text-white md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <LinksHeader title="Professores por Disciplina" description="Escolha uma disciplina e controle quais professores estao vinculados a ela." icon={<Users className="h-5 w-5" />} />
        <ProfessorDisciplineManager
          initialUniversityId={universityId}
          initialCourseId={courseId}
          initialDisciplineId={disciplineId}
        />
      </div>
    </main>
  );
}
