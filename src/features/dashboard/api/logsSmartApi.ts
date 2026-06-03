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

function unwrap<T>(response: LogApiResponse<T> | T): T {
  if (response && typeof response === "object" && "data" in response) {
    return (response as LogApiResponse<T>).data;
  }
  return response as T;
}

function isFailedEnvelope<T>(response: LogApiResponse<T> | T): response is LogApiResponse<T> {
  return Boolean(response && typeof response === "object" && "success" in response && !(response as LogApiResponse<T>).success);
}

export const logApiSmart = {
  fetchSummary: async (
    userRole: string[],
    entity: "university" | "course" | "class" | "discipline" | "student",
    id: string,
    filters?: LogFilterParams,
  ): Promise<UserAnalysisLog | any> => {
    const isProfessor = userRole.includes("professor");

    if (isProfessor) {
      if (entity === "discipline") {
        const response = await getRequest<LogApiResponse<UserAnalysisLog> | UserAnalysisLog>(PROFESSOR_LOG_ROUTES.listStudentsByDiscipline(id));
        return unwrap(response);
      }

      if (entity === "student") {
        if (!filters?.disciplineId) {
          throw new Error("disciplineId obrigatório para professores ao buscar aluno");
        }
        const response = await getRequest<LogApiResponse<UserAnalysisLog> | UserAnalysisLog>(
          PROFESSOR_LOG_ROUTES.getStudentDetails(id, filters.disciplineId),
        );
        logger.info("LogAPI", "Resposta da API para aluno.", response);
        return unwrap(response);
      }
    }

    switch (entity) {
      case "university":
        return unwrap(await getRequest<LogApiResponse<UserAnalysisLog> | UserAnalysisLog>(LOG_ROUTES.summary.university(id)));
      case "course":
        return unwrap(await getRequest<LogApiResponse<UserAnalysisLog> | UserAnalysisLog>(LOG_ROUTES.summary.course(id)));
      case "class":
        return unwrap(await getRequest<LogApiResponse<UserAnalysisLog> | UserAnalysisLog>(LOG_ROUTES.summary.class(id)));
      case "discipline":
        return unwrap(await getRequest<LogApiResponse<UserAnalysisLog> | UserAnalysisLog>(LOG_ROUTES.summary.discipline(id)));
      case "student": {
        const response = await postRequest<LogApiResponse<UserAnalysisLog> | UserAnalysisLog>(
          LOG_ROUTES.summary.filteredStudent,
          {
            universityId: filters?.universityId || "",
            courseId: filters?.courseId,
            classId: filters?.classId,
            studentId: id,
          },
        );
        if (isFailedEnvelope(response)) throw new Error(response.error || "erro ao buscar dados do estudante");
        return unwrap(response);
      }
      default:
        throw new Error("Entidade inválida");
    }
  },
};

export default logApiSmart;
