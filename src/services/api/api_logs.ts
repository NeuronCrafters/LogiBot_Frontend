import { api } from "@/services/api/api";
import { LOG_ROUTES } from "./api_routes";

const getRequest = async <T>(url: string): Promise<T> => {
  const response = await api.get<T>(url, { withCredentials: true });
  return response.data;
};

const postRequest = async <T>(url: string, data: object): Promise<T> => {
  const response = await api.post<T>(url, data, { withCredentials: true });
  return response.data;
};

export const logApi = {
  getUniversitySummary: <T>(id: string) => getRequest<T>(LOG_ROUTES.summary.university(id)),
  getCourseSummary: <T>(id: string) => getRequest<T>(LOG_ROUTES.summary.course(id)),
  getClassSummary: <T>(id: string) => getRequest<T>(LOG_ROUTES.summary.class(id)),
  getFilteredStudentSummary: <T>(body: { universityId: string, courseId?: string, classId?: string }) =>
    postRequest<T>(LOG_ROUTES.summary.filteredStudent, body),
};
