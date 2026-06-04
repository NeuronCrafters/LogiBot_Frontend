import { api } from "@/shared/api/httpClient";
import { PROFESSOR_ROUTES } from "@/services/api/api_routes";

export const professorApi = {
  listMyStudents: () => api.get(PROFESSOR_ROUTES.listMyStudents),
};
