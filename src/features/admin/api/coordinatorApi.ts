import { api } from "@/shared/api/httpClient";
import { COORDINATOR_ROUTES } from "@/services/api/api_routes";

export const coordinatorApi = {
  listMyProfessors: () =>
    api.get(COORDINATOR_ROUTES.listMyProfessors),

  listMyStudents: () =>
    api.get(COORDINATOR_ROUTES.listMyStudents),

  listStudentsByDiscipline: (disciplineId: string) =>
    api.get(COORDINATOR_ROUTES.listStudentsByDiscipline.replace(":disciplineId", disciplineId)),
};
