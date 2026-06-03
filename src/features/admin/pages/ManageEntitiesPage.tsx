import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { BookOpen, GraduationCap, Library, Link2, School, TableProperties, Users } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";

type Action = {
  to: string;
  title: string;
  description: string;
  icon: ReactNode;
  adminOnly?: boolean;
};

const ACTIONS: Action[] = [
  { to: "/entities/create/university", title: "Nova Universidade", description: "Cadastre uma instituicao.", icon: <School className="h-5 w-5" />, adminOnly: true },
  { to: "/entities/create/course", title: "Novo Curso", description: "Crie um curso vinculado a universidade.", icon: <BookOpen className="h-5 w-5" />, adminOnly: true },
  { to: "/entities/create/class", title: "Nova Turma", description: "Crie turmas e gere codigos por disciplina.", icon: <Users className="h-5 w-5" /> },
  { to: "/entities/create/discipline", title: "Nova Disciplina", description: "Cadastre disciplinas do curso.", icon: <Library className="h-5 w-5" /> },
  { to: "/entities/create/professor", title: "Novo Professor", description: "Crie acesso e vinculo de curso.", icon: <GraduationCap className="h-5 w-5" /> },
  { to: "/entities/links/class-disciplines", title: "Disciplinas por Turma", description: "Adicione ou remova disciplinas de uma turma.", icon: <Link2 className="h-5 w-5" /> },
  { to: "/entities/links/professor-disciplines", title: "Professores por Disciplina", description: "Controle os professores de cada disciplina.", icon: <GraduationCap className="h-5 w-5" /> },
  { to: "/entities", title: "Listar Entidades", description: "Busque, edite e remova registros.", icon: <TableProperties className="h-5 w-5" /> },
];

export function ManageEntities() {
  const { user } = useAuth();
  if (!user) return null;

  const roles = Array.isArray(user.role) ? user.role : [user.role];
  const isAdmin = roles.includes("admin");
  const isCoordinator = roles.includes("course-coordinator");
  if (!isAdmin && !isCoordinator) return null;

  const visibleActions = ACTIONS.filter((action) => isAdmin || !action.adminOnly);

  return (
    <main className="flex-1 overflow-y-auto px-4 py-6 text-white md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <section className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <TableProperties className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-[Poppins] text-2xl font-semibold text-white">Gestao Academica</h1>
              <p className="mt-1 font-[Poppins] text-sm leading-relaxed text-zinc-400">Escolha uma acao especifica para criar, editar, vincular ou listar entidades.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {visibleActions.map((action) => (
            <Link key={action.to} to={action.to} className="group rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 transition-colors hover:border-blue-500/30 hover:bg-white/[0.03]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-neutral-950/60 text-blue-400 transition-colors group-hover:border-blue-500/30 group-hover:bg-blue-500/10">
                {action.icon}
              </div>
              <h2 className="mt-4 font-[Poppins] text-sm font-semibold text-white">{action.title}</h2>
              <p className="mt-1 font-[Poppins] text-xs leading-relaxed text-zinc-500">{action.description}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
