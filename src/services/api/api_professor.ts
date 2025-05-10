import { api } from "./api";
import { PROFESSOR_ROUTES } from "./api_routes";

export const professorApi = {
  listMyStudents: () =>
    api.get(PROFESSOR_ROUTES.listMyStudents),
};
