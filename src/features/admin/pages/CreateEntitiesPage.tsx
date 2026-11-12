import { t, useLocale } from "@/i18n";
import { useState } from "react";
import type { ReactNode } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  GraduationCap,
  Library,
  School,
  ShieldOff,
  TableProperties,
  Users,
} from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { EntityCreateForm } from "@/features/admin/components/create/EntityCreateForm";
import {
  RecentEntityList,
  RecentItem,
} from "@/features/admin/components/create/RecentEntityList";
import { academicApi, adminApi } from "@/services/apiClient";
import { AcademicEntityType } from "@/services/api/api_routes";
import { toast } from "@/shared/lib/toast";
import { logger } from "@/shared/lib/logger";

interface ApiResponse {
  id?: string;
  _id?: string;
  registrationCode?: string;
  [key: string]: any;
}

type EntityType =
  | "university"
  | "course"
  | "class"
  | "professor"
  | "discipline";

const ENTITY_META: Record<
  EntityType,
  { title: string; description: string; icon: ReactNode }
> = {
  university: {
    get title() { return t("common.novaUniversidade"); },
    get description() { return t("admin.cadastreUmaInstituicaoParaOrganizarCursosTurmas"); },
    icon: <School className="h-5 w-5" />,
  },
  course: {
    get title() { return t("common.novoCurso"); },
    get description() { return t("admin.crieUmCursoDentroDeUmaUniversidade"); },
    icon: <BookOpen className="h-5 w-5" />,
  },
  class: {
    get title() { return t("common.novaTurma"); },
    get description() { return t("admin.crieUmaTurmaDefinaSuaGradeE"); },
    icon: <Users className="h-5 w-5" />,
  },
  discipline: {
    get title() { return t("common.novaDisciplina"); },
    get description() { return t("admin.crieUmaDisciplinaEVinculeTurmasOu"); },
    icon: <Library className="h-5 w-5" />,
  },
  professor: {
    get title() { return t("common.novoProfessor"); },
    get description() { return t("admin.crieOAcessoDeProfessorEVincule"); },
    icon: <GraduationCap className="h-5 w-5" />,
  },
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
  useLocale();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-zinc-600">
        <ShieldOff className="h-6 w-6" />
      </div>
      <p className="font-[Poppins] text-sm text-zinc-500">
        {t("admin.voceNaoTemPermissaoParaAcessarEsta")}</p>
    </div>
  );
}

function NextActions({ entity }: { entity: EntityType }) {
  useLocale();

  const actions = [
    ...(["class", "discipline", "professor"].includes(entity)
      ? [{ to: "/entities/manage", label: t("admin.gerenciarVinculos") }]
      : []),
    { to: "/entities", label: t("common.listarEntidades") },
  ];

  return (
    <section className="rounded-2xl border border-white/10 bg-surface p-5 shadow-lg shadow-black/10 sm:p-6">
      <p className="font-[Poppins] text-sm font-semibold text-white">
        {t("admin.proximasAcoes")}</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {actions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 font-[Poppins] text-sm text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function CreateEntitiesContent() {
  useLocale();

  const { user } = useAuth();
  const { entityType } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);


  const roles = Array.isArray(user.role) ? user.role : [user.role];
  const isAdmin = roles.includes("admin");
  const isCoordinator = roles.includes("course-coordinator");
  const routeEntity = [
    "university",
    "course",
    "class",
    "professor",
    "discipline",
  ].includes(String(entityType))
    ? (entityType as EntityType)
    : undefined;

  const createMutation = useMutation({
    mutationFn: async ({ entity, item }: { entity: EntityType; item: any }) => {
      logger.info("Admin", t("admin.enviandoValue0", { value0: entity }), item);
      const response: ApiResponse =
        entity === "professor"
          ? await adminApi.createProfessor<ApiResponse>({
              name: item.name,
              email: item.email,
              password: item.password,
              school: item.school,
              courses: item.courses,
            })
          : await academicApi.post<ApiResponse>(
              entity as AcademicEntityType,
              item,
            );
      return { response, entity, item };
    },
    onSuccess: ({ response, entity, item }) => {
      const created = getCreatedEntity(response, entity);
      const registrationCode =
        response.registrationCode || created.registrationCode;
      const newItem: RecentItem = {
        id:
          created?.id ||
          created?._id ||
          response?.id ||
          response?._id ||
          `temp-${Date.now()}`,
        name: created?.name || item.name || t("admin.itemSemNome"),
        type: entity,
        action: "create",
        registrationCode,
      };
      setRecentItems((prev) => [newItem, ...prev.slice(0, 19)]);
      queryClient.invalidateQueries({ queryKey: ["academicData"] });
      queryClient.invalidateQueries({ queryKey: ["searchEntities"] });
      toast.success(
        registrationCode
          ? t("admin.turmaCriadaCodigoDeAcessoGerado")
          : t("admin.cadastroRealizadoComSucesso"),
      );
    },
    onError: (error) => {
      logger.error("Admin", "Erro ao enviar dados.", error);
      toast.error({ key: "admin.erroAoCadastrarVerifiqueOsDadosE", params: {} });
    },
  });

  if (!routeEntity) return <Navigate to="/entities/manage" replace />;
  if (!isAdmin && !isCoordinator) return <PermissionDenied />;
  if (!isAdmin && ["university", "course"].includes(routeEntity))
    return <PermissionDenied />;

  const meta = ENTITY_META[routeEntity];

  return (
    <main className="flex-1 overflow-y-auto px-4 py-6 text-white md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <section className="rounded-2xl border border-white/10 bg-surface p-5 shadow-lg shadow-black/10 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                {meta.icon}
              </div>
              <div>
                <h1 className="font-[Poppins] text-2xl font-semibold text-white">
                  {meta.title}
                </h1>
                <p className="mt-1 font-[Poppins] text-sm leading-relaxed text-zinc-400">
                  {meta.description}
                </p>
              </div>
            </div>
            <Link
              to="/entities/manage"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 font-[Poppins] text-sm text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <TableProperties className="h-4 w-4" />
              {t("admin.gestao")}</Link>
          </div>
        </section>

        <EntityCreateForm
          onSubmit={(entity, item) => createMutation.mutate({ entity, item })}
          animateForm
          defaultEntity={routeEntity}
          lockEntity
        />
        {recentItems.length > 0 && <NextActions entity={routeEntity} />}
        <RecentEntityList
          items={recentItems}
          onEdit={() => navigate("/entities/manage")}
          loading={createMutation.isPending}
        />
      </div>
    </main>
  );
}

export function CreateEntities() {
  const { user } = useAuth();
  return user ? <CreateEntitiesContent /> : null;
}
