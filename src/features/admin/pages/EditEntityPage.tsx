import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, ShieldOff, TableProperties } from "lucide-react";
import { EntityCreateForm } from "@/features/admin/components/create/EntityCreateForm";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { academicFiltersApi } from "@/features/academic/api/academicFiltersApi";
import { academicApi, adminApi } from "@/services/apiClient";
import { AcademicEntityType } from "@/services/api/api_routes";
import type {
  ClassData,
  CourseData,
  DisciplineData,
  ProfessorData,
  UniversityData,
} from "@/features/admin/types";
import { toast } from "@/shared/lib/toast";
import { logger } from "@/shared/lib/logger";

type EntityType =
  | "university"
  | "course"
  | "class"
  | "professor"
  | "discipline";
type InitialData =
  | { type: "university"; data: UniversityData }
  | { type: "course"; data: CourseData }
  | { type: "class"; data: ClassData }
  | { type: "professor"; data: ProfessorData }
  | { type: "discipline"; data: DisciplineData };

const ENTITY_LABEL: Record<EntityType, string> = {
  university: "Universidade",
  course: "Curso",
  class: "Turma",
  discipline: "Disciplina",
  professor: "Professor",
};

function PermissionDenied() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-zinc-600">
        <ShieldOff className="h-6 w-6" />
      </div>
      <p className="font-[Poppins] text-sm text-zinc-500">
        Voce nao tem permissao para acessar esta pagina.
      </p>
    </div>
  );
}

export function EditEntity() {
  const { user } = useAuth();
  const { entityType, id } = useParams();
  const queryClient = useQueryClient();

  const routeEntity = [
    "university",
    "course",
    "class",
    "professor",
    "discipline",
  ].includes(String(entityType))
    ? (entityType as EntityType)
    : undefined;
  const roles = Array.isArray(user?.role) ? user.role : [user?.role];
  const isAdmin = roles.includes("admin");
  const isCoordinator = roles.includes("course-coordinator");

  const { data: academicData, isLoading } = useQuery({
    queryKey: ["academicData"],
    queryFn: async () => {
      const response = await academicFiltersApi.getAcademicData();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const initialData = useMemo<InitialData | null>(() => {
    if (!academicData || !routeEntity || !id) return null;

    for (const university of academicData.universities) {
      if (routeEntity === "university" && university._id === id) {
        return {
          type: "university",
          data: { id: university._id, name: university.name },
        };
      }

      for (const course of university.courses) {
        if (routeEntity === "course" && course._id === id) {
          return {
            type: "course",
            data: {
              id: course._id,
              name: course.name,
              universityId: university._id,
            },
          };
        }

        const classItem = course.classes.find((item) => item._id === id);
        if (routeEntity === "class" && classItem) {
          return {
            type: "class",
            data: {
              id: classItem._id,
              name: classItem.name,
              universityId: university._id,
              courseId: course._id,
              disciplineIds: classItem.disciplines.map(
                (discipline) => discipline._id,
              ),
            },
          };
        }

        const discipline = course.disciplines.find((item) => item._id === id);
        if (routeEntity === "discipline" && discipline) {
          return {
            type: "discipline",
            data: {
              id: discipline._id,
              name: discipline.name,
              universityId: university._id,
              courseId: course._id,
              classIds: discipline.classes.map((classRef) => classRef._id),
              professorIds: discipline.professors.map(
                (professor) => professor._id,
              ),
            },
          };
        }
      }
    }

    if (routeEntity === "professor") {
      for (const university of academicData.universities) {
        const courses = university.courses.filter((course) =>
          course.professors.some((professor) => professor._id === id),
        );
        const professor = courses
          .flatMap((course) => course.professors)
          .find((item) => item._id === id);
        if (professor) {
          return {
            type: "professor",
            data: {
              id: professor._id,
              name: professor.name,
              email: professor.email,
              school: university._id,
              courses: courses.map((course) => course._id),
            },
          };
        }
      }
    }

    return null;
  }, [academicData, routeEntity, id]);

  const updateMutation = useMutation({
    mutationFn: async ({ entity, item }: { entity: EntityType; item: any }) => {
      if (!id) throw new Error("ID ausente");
      if (entity === "professor") return adminApi.updateProfessor(id, item);
      return academicApi.update(entity as AcademicEntityType, id, item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academicData"] });
      queryClient.invalidateQueries({ queryKey: ["searchEntities"] });
      toast.success("Registro atualizado com sucesso.");
    },
    onError: (error) => {
      logger.error("Admin", "Erro ao atualizar registro.", error);
      toast.error("Erro ao atualizar. Verifique os dados e tente novamente.");
    },
  });

  if (!user) return null;
  if (!routeEntity || !id) return <Navigate to="/entities/manage" replace />;
  if (!isAdmin && !isCoordinator) return <PermissionDenied />;
  if (!isAdmin && ["university", "course"].includes(routeEntity))
    return <PermissionDenied />;

  return (
    <main className="flex-1 overflow-y-auto px-4 py-6 text-white md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <section className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <Pencil className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-[Poppins] text-2xl font-semibold text-white">
                  Editar {ENTITY_LABEL[routeEntity]}
                </h1>
                <p className="mt-1 font-[Poppins] text-sm leading-relaxed text-zinc-400">
                  Atualize os dados principais e os vinculos deste registro.
                </p>
              </div>
            </div>
            <Link
              to="/entities"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 font-[Poppins] text-sm text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <TableProperties className="h-4 w-4" />
              Listar
            </Link>
          </div>
        </section>

        {isLoading && (
          <section className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 sm:p-6">
            <div className="flex items-center gap-2 font-[Poppins] text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando registro...
            </div>
          </section>
        )}

        {!isLoading && !initialData && (
          <section className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-8 text-center shadow-lg shadow-black/10">
            <p className="font-[Poppins] text-sm font-semibold text-white">
              Registro nao encontrado
            </p>
            <p className="mt-1 font-[Poppins] text-xs text-zinc-500">
              Volte para a listagem e selecione outro item.
            </p>
          </section>
        )}

        {initialData && (
          <EntityCreateForm
            onSubmit={(entity, item) => updateMutation.mutate({ entity, item })}
            initialData={initialData}
            animateForm
            defaultEntity={routeEntity}
            lockEntity
          />
        )}
      </div>
    </main>
  );
}
