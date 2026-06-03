import { useState } from "react";
import type { ReactNode } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, GraduationCap, Library, School, ShieldOff, TableProperties, Users } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { EntityCreateForm } from "@/features/admin/components/create/EntityCreateForm";
import { RecentEntityList, RecentItem } from "@/features/admin/components/create/RecentEntityList";
import { academicApi, adminApi } from "@/services/apiClient";
import { AcademicEntityType } from "@/services/api/api_routes";
import { toast } from "@/shared/lib/toast";
import { logger } from "@/shared/lib/logger";

interface ApiResponse {
  id?: string;
  _id?: string;
  registrationCodes?: RecentItem["registrationCodes"];
  [key: string]: any;
}

type EntityType = "university" | "course" | "class" | "professor" | "discipline";

const ENTITY_META: Record<EntityType, { title: string; description: string; icon: ReactNode }> = {
  university: { title: "Nova Universidade", description: "Cadastre uma instituicao para organizar cursos, turmas e usuarios.", icon: <School className="h-5 w-5" /> },
  course: { title: "Novo Curso", description: "Crie um curso dentro de uma universidade ja cadastrada.", icon: <BookOpen className="h-5 w-5" /> },
  class: { title: "Nova Turma", description: "Crie uma turma e, se quiser, selecione disciplinas para gerar codigos de cadastro.", icon: <Users className="h-5 w-5" /> },
  discipline: { title: "Nova Disciplina", description: "Crie uma disciplina e vincule turmas ou professores quando fizer sentido.", icon: <Library className="h-5 w-5" /> },
  professor: { title: "Novo Professor", description: "Crie o acesso de professor e vincule ao curso correto.", icon: <GraduationCap className="h-5 w-5" /> },
};

function getCreatedEntity(response: ApiResponse, entity: string) {
  if (entity === "class") return response.class || response;
  if (entity === "discipline") return response.discipline || response;
  if (entity === "course") return response.course || response;
  if (entity === "university") return response.university || response;
  if (entity === "professor") return response.professor || response;
  return response;
}

function PermissionDenied() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-zinc-600"><ShieldOff className="h-6 w-6" /></div>
      <p className="font-[Poppins] text-sm text-zinc-500">Voce nao tem permissao para acessar esta pagina.</p>
    </div>
  );
}

function NextActions({ entity }: { entity: EntityType }) {
  const actions = [
    ...(entity === "class" || entity === "discipline" ? [{ to: "/entities/links/class-disciplines", label: "Gerenciar disciplinas por turma" }] : []),
    ...(entity === "professor" || entity === "discipline" ? [{ to: "/entities/links/professor-disciplines", label: "Gerenciar professores por disciplina" }] : []),
    { to: "/entities", label: "Listar entidades" },
  ];

  return (
    <section className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 sm:p-6">
      <p className="font-[Poppins] text-sm font-semibold text-white">Proximas acoes</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {actions.map((action) => (
          <Link key={action.to} to={action.to} className="inline-flex h-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 font-[Poppins] text-sm text-zinc-300 transition-colors hover:bg-white/10 hover:text-white">
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

export function CreateEntities() {
  const { user } = useAuth();
  const { entityType } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  if (!user) return null;

  const roles = Array.isArray(user.role) ? user.role : [user.role];
  const isAdmin = roles.includes("admin");
  const isCoordinator = roles.includes("course-coordinator");
  const routeEntity = ["university", "course", "class", "professor", "discipline"].includes(String(entityType)) ? entityType as EntityType : undefined;

  if (!routeEntity) return <Navigate to="/entities/manage" replace />;
  if (!isAdmin && !isCoordinator) return <PermissionDenied />;
  if (!isAdmin && ["university", "course"].includes(routeEntity)) return <PermissionDenied />;

  const createMutation = useMutation({
    mutationFn: async ({ entity, item }: { entity: EntityType; item: any }) => {
      logger.info("Admin", `Enviando ${entity}.`, item);
      const response: ApiResponse = entity === "professor"
        ? await adminApi.createProfessor<ApiResponse>({ name: item.name, email: item.email, password: item.password, school: item.school, courses: item.courses })
        : await academicApi.post<ApiResponse>(entity as AcademicEntityType, item);
      return { response, entity, item };
    },
    onSuccess: ({ response, entity, item }) => {
      const created = getCreatedEntity(response, entity);
      const registrationCodes = response.registrationCodes || created.registrationCodes;
      const newItem: RecentItem = {
        id: created?.id || created?._id || response?.id || response?._id || `temp-${Date.now()}`,
        name: created?.name || item.name || "Item sem nome",
        type: entity,
        action: "create",
        registrationCodes,
      };
      setRecentItems((prev) => [newItem, ...prev.slice(0, 19)]);
      queryClient.invalidateQueries({ queryKey: ["academicData"] });
      queryClient.invalidateQueries({ queryKey: ["searchEntities"] });
      toast.success(registrationCodes?.length ? "Cadastro realizado. Codigo de aluno gerado." : "Cadastro realizado com sucesso!");
    },
    onError: (error) => {
      logger.error("Admin", "Erro ao enviar dados.", error);
      toast.error("Erro ao cadastrar. Verifique os dados e tente novamente.");
    },
  });

  const meta = ENTITY_META[routeEntity];

  return (
    <main className="flex-1 overflow-y-auto px-4 py-6 text-white md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <section className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">{meta.icon}</div>
              <div>
                <h1 className="font-[Poppins] text-2xl font-semibold text-white">{meta.title}</h1>
                <p className="mt-1 font-[Poppins] text-sm leading-relaxed text-zinc-400">{meta.description}</p>
              </div>
            </div>
            <Link to="/entities/manage" className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 font-[Poppins] text-sm text-zinc-300 transition-colors hover:bg-white/10 hover:text-white">
              <TableProperties className="h-4 w-4" />Gestao
            </Link>
          </div>
        </section>

        <EntityCreateForm onSubmit={(entity, item) => createMutation.mutate({ entity, item })} animateForm defaultEntity={routeEntity} lockEntity />
        {recentItems.length > 0 && <NextActions entity={routeEntity} />}
        <RecentEntityList items={recentItems} onEdit={(item) => navigate(`/entities/edit/${item.type}/${item.id}`)} loading={createMutation.isPending} />
      </div>
    </main>
  );
}
