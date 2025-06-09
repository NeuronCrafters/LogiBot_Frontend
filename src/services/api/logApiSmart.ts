import { api } from "@/services/api/api";
import { LOG_ROUTES, PROFESSOR_LOG_ROUTES } from "./api_routes";
import { LogApiResponse, UserAnalysisLog, LogFilterParams } from "../../@types/Log";

// Função genérica para GET
const getRequest = async <T>(url: string): Promise<T> => {
  const response = await api.get<T>(url, { withCredentials: true });
  return response.data;
};

// Função genérica para POST
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
  ): Promise<UserAnalysisLog> => {

    const isProfessor = userRole.includes("professor");

    // Quando é professor:
    if (isProfessor) {
      if (entity === "discipline") {
        const response = await getRequest<LogApiResponse<UserAnalysisLog>>(
          PROFESSOR_LOG_ROUTES.listStudentsByDiscipline(id)
        );
        return response.data;
      }

      if (entity === "student") {
        if (!filters?.disciplineId) {
          throw new Error("disciplineId obrigatório para professores ao buscar aluno");
        }
        const response = await getRequest<LogApiResponse<UserAnalysisLog>>(
          PROFESSOR_LOG_ROUTES.getStudentDetails(id, filters.disciplineId)
        );
        return response.data;
      }
    }

    // Para Admin e Coordenador (e professores nos demais casos)
    switch (entity) {
      case "university":
        return (await getRequest<LogApiResponse<UserAnalysisLog>>(LOG_ROUTES.summary.university(id))).data;

      case "course":
        return (await getRequest<LogApiResponse<UserAnalysisLog>>(LOG_ROUTES.summary.course(id))).data;

      case "class":
        return (await getRequest<LogApiResponse<UserAnalysisLog>>(LOG_ROUTES.summary.class(id))).data;

      case "discipline":
        return (await getRequest<LogApiResponse<UserAnalysisLog>>(LOG_ROUTES.summary.discipline(id))).data;

      case "student":
        const response = await postRequest<LogApiResponse<UserAnalysisLog>>(
          LOG_ROUTES.summary.filteredStudent, {
          universityId: filters?.universityId || "",
          courseId: filters?.courseId,
          classId: filters?.classId,
          studentId: id
        }
        );
        if (!response.success) throw new Error(response.error || "Erro ao buscar dados do estudante");
        return response.data;

      default:
        throw new Error("Entidade inválida");
    }
  }
};

export default logApiSmart;
