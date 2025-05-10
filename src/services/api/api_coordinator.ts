import { api } from "./api";
import { COORDINATOR_ROUTES } from "./api_routes";

export const coordinatorApi = {
  listMyProfessors: () =>
    api.get(COORDINATOR_ROUTES.listMyProfessors),

  listMyStudents: () =>
    api.get(COORDINATOR_ROUTES.listMyStudents),

  listStudentsByDiscipline: (disciplineId: string) =>
    api.get(
      COORDINATOR_ROUTES.listStudentsByDiscipline.replace(
        ":disciplineId",
        disciplineId
      )
    ),
};
