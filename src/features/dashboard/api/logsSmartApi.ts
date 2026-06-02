import { api } from "@/shared/api/httpClient";
import { logger } from "@/shared/lib/logger";
import { LOG_ROUTES, PROFESSOR_LOG_ROUTES } from "@/services/api/api_routes";
import { LogApiResponse, UserAnalysisLog, LogFilterParams } from "@/features/dashboard/logTypes";

const getRequest = async <T>(url: string): Promise<T> => {
  const response = await api.get<T>(url, { withCredentials: true });
  return response.data;
};

const postRequest = async <T>(url: string, data: object): Promise<T> => {
  const response = await api.post<T>(url, data, { withCredentials: true });
  return response.data;
};

export const logApiSmart = {
  fetchSummary: async (
    userRole: string[],
    entity: "university" | "course" | "class" | "discipline" | "student",
    id: string,
    filters?: LogFilterParams
  ): Promise<UserAnalysisLog | any> => {
    const isProfessor = userRole.includes("professor");

    if (isProfessor) {
      if (entity === "discipline") {
        const url = PROFESSOR_LOG_ROUTES.listStudentsByDiscipline(id);
        const response = await getRequest<any>(url);
        return response.data || response;
      }

      if (entity === "student") {
        if (!filters?.disciplineId) {
          throw new Error("disciplineId obrigatório para professores ao buscar aluno");
        }
        const url = PROFESSOR_LOG_ROUTES.getStudentDetails(id, filters.disciplineId);
        const response = await getRequest<any>(url);
        logger.info("LogAPI", "Resposta da API para aluno.", response);
        return response.data || response;
      }
    }

    switch (entity) {
      case "university":
        return (await getRequest<LogApiResponse<UserAnalysisLog>>(LOG_ROUTES.summary.university(id))).data;
      case "course":
        return (await getRequest<LogApiResponse<UserAnalysisLog>>(LOG_ROUTES.summary.course(id))).data;
      case "class":
        return (await getRequest<LogApiResponse<UserAnalysisLog>>(LOG_ROUTES.summary.class(id))).data;
      case "discipline":
        return (await getRequest<LogApiResponse<UserAnalysisLog>>(LOG_ROUTES.summary.discipline(id))).data;
      case "student": {
        const response = await postRequest<LogApiResponse<UserAnalysisLog>>(
          LOG_ROUTES.summary.filteredStudent, {
          universityId: filters?.universityId || "",
          courseId: filters?.courseId,
          classId: filters?.classId,
          studentId: id
        });
        if (!response.success) throw new Error(response.error || "erro ao buscar dados do estudante");
        return response.data;
      }
      default:
        throw new Error("Entidade inválida");
    }
  }
};

export default logApiSmart;
