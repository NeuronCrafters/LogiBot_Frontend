import { api } from "@/services/api/api";
import { ADMIN_ROUTES } from './api_routes'

const postRequest = async <T>(url: string, data: object): Promise<T> => {
  const response = await api.post<T>(url, data, { withCredentials: true });
  return response.data;
};

const getRequest = async <T>(url: string): Promise<T> => {
  const response = await api.get<T>(url, { withCredentials: true });
  return response.data;
};

const deleteRequest = async <T>(url: string): Promise<T> => {
  const response = await api.delete<T>(url, { withCredentials: true });
  return response.data;
};

const patchRequest = async <T>(url: string, data: object): Promise<T> => {
  const response = await api.patch<T>(url, data, { withCredentials: true });
  return response.data;
};

export const adminApi = {
  createProfessor: <T>(data: object): Promise<T> =>
    postRequest<T>(ADMIN_ROUTES.createProfessor, data),

  deleteProfessor: <T>(professorId: string): Promise<T> =>
    deleteRequest<T>(
      ADMIN_ROUTES.deleteProfessor.replace(":professorId", professorId)
    ),

  listAllProfessors: <T>(): Promise<T> =>
    getRequest<T>(ADMIN_ROUTES.listAllProfessors),

  listProfessorsByUniversity: <T>(schoolId: string): Promise<T> =>
    getRequest<T>(
      ADMIN_ROUTES.listProfessorsByUniversity.replace(
        ":schoolId",
        schoolId
      )
    ),

  listProfessorsByCourse: <T>(courseId: string): Promise<T> =>
    getRequest<T>(
      ADMIN_ROUTES.listProfessorsByCourse.replace(":courseId", courseId)
    ),

  updateProfessorRole: <T>(id: string, action: "add" | "remove"): Promise<T> =>
    patchRequest<T>(
      ADMIN_ROUTES.updateProfessorRole.replace(":id", id),
      { action }
    ),

  listStudents: <T>(): Promise<T> =>
    getRequest<T>(ADMIN_ROUTES.listStudents),
};