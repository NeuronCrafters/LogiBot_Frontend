import { api } from "@/services/api/api";
import { LOG_ROUTES, PROFESSOR_LOG_ROUTES } from "./api_routes";
import { LogApiResponse, UserAnalysisLog, LogFilterParams } from "../../@types/Log";

const getRequest = async <T>(url: string): Promise<T> => {
  try {
    const response = await api.get<T>(url, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const postRequest = async <T>(url: string, data: object): Promise<T> => {
  try {
    const response = await api.post<T>(url, data, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw error;
  }
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

        try {
          const response = await getRequest<any>(url);
          const result = response.data || response;
          return result;
        } catch (error) {
          throw error;
        }
      }

      if (entity === "student") {
        if (!filters?.disciplineId) {
          throw new Error("disciplineId obrigatório para professores ao buscar aluno");
        }
        const url = PROFESSOR_LOG_ROUTES.getStudentDetails(id, filters.disciplineId);

        try {
          const response = await getRequest<any>(url);
          console.log("resposta da API para aluno:", response);
          const result = response.data || response;
          return result;
        } catch (error) {
          throw error;
        }
      }
    }

    switch (entity) {
      case "university":
        const uniUrl = LOG_ROUTES.summary.university(id);
        return (await getRequest<LogApiResponse<UserAnalysisLog>>(uniUrl)).data;

      case "course":
        const courseUrl = LOG_ROUTES.summary.course(id);
        return (await getRequest<LogApiResponse<UserAnalysisLog>>(courseUrl)).data;

      case "class":
        const classUrl = LOG_ROUTES.summary.class(id);
        return (await getRequest<LogApiResponse<UserAnalysisLog>>(classUrl)).data;

      case "discipline":
        const discUrl = LOG_ROUTES.summary.discipline(id);
        return (await getRequest<LogApiResponse<UserAnalysisLog>>(discUrl)).data;

      case "student":
        const response = await postRequest<LogApiResponse<UserAnalysisLog>>(
          LOG_ROUTES.summary.filteredStudent, {
          universityId: filters?.universityId || "",
          courseId: filters?.courseId,
          classId: filters?.classId,
          studentId: id
        }
        );
        if (!response.success) throw new Error(response.error || "erro ao buscar dados do estudante");
        return response.data;

      default:
        throw new Error("Entidade inválida");
    }
  }
};

export default logApiSmart;
