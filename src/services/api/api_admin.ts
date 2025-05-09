import { api } from "./api";
import { ADMIN_ROUTES } from "./api_routes";

export const adminApi = {
  createProfessor: (data: object) =>
    api.post(ADMIN_ROUTES.createProfessor, data),

  deleteProfessor: (professorId: string) =>
    api.delete(
      ADMIN_ROUTES.deleteProfessor.replace(":professorId", professorId)
    ),

  listAllProfessors: () =>
    api.get(ADMIN_ROUTES.listAllProfessors),

  listProfessorsByUniversity: (schoolId: string) =>
    api.get(
      ADMIN_ROUTES.listProfessorsByUniversity.replace(":schoolId", schoolId)
    ),

  listProfessorsByCourse: (courseId: string) =>
    api.get(
      ADMIN_ROUTES.listProfessorsByCourse.replace(":courseId", courseId)
    ),

  updateProfessorRole: (id: string, action: "add" | "remove") =>
    api.patch(
      ADMIN_ROUTES.updateProfessorRole.replace(":id", id),
      { action }
    ),

  listStudents: () =>
    api.get(ADMIN_ROUTES.listStudents),
};
