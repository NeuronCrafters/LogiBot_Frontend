import { api } from "@/services/api/api";
import { LOG_ROUTES, PROFESSOR_LOG_ROUTES } from "./api_routes";
import { LogApiResponse, UserAnalysisLog, LogFilterParams } from "../../@types/Log";

const getRequest = async <T>(url: string): Promise<T> => {
  const response = await api.get<T>(url, { withCredentials: true });
  return response.data;
};

const postRequest = async <T>(url: string, data: object): Promise<T> => {
  const response = await api.post<T>(url, data, { withCredentials: true });
  return response.data;
};

export type LogEntityType = "university" | "course" | "class" | "student" | "discipline";
export type LogMetricType = "accuracy" | "usage" | "subjects";

export const logApi = {
  getUniversitySummary: async (id: string) =>
    getRequest<LogApiResponse<UserAnalysisLog>>(LOG_ROUTES.summary.university(id)),

  getCourseSummary: async (id: string) =>
    getRequest<LogApiResponse<UserAnalysisLog>>(LOG_ROUTES.summary.course(id)),

  getClassSummary: async (id: string) =>
    getRequest<LogApiResponse<UserAnalysisLog>>(LOG_ROUTES.summary.class(id)),

  getDisciplineSummary: async (id: string) =>
    getRequest<LogApiResponse<UserAnalysisLog>>(LOG_ROUTES.summary.discipline(id)),

  getFilteredStudentSummary: async (params: LogFilterParams): Promise<UserAnalysisLog> => {
    const response = await postRequest<LogApiResponse<UserAnalysisLog>>(
      LOG_ROUTES.summary.filteredStudent, params
    );
    if (!response.success) throw new Error(response.error || "Erro ao buscar dados de usuário");
    return response.data;
  },

  getAccuracyData: async (entity: LogEntityType, id: string, filters?: LogFilterParams) => {
    const summary = await logApi.fetchSummary(entity, id, filters);
    const totalCorrect = summary.totalCorrectAnswers;
    const totalWrong = summary.totalWrongAnswers;
    return {
      totalCorrect,
      totalWrong,
      accuracy: (totalCorrect + totalWrong) > 0 ? (totalCorrect / (totalCorrect + totalWrong)) * 100 : 0
    };
  },

  getUsageData: async (entity: LogEntityType, id: string, filters?: LogFilterParams) => {
    const summary = await logApi.fetchSummary(entity, id, filters);
    return {
      totalUsageTime: summary.usageTimeInSeconds,
      usageTime: summary.usageTime,
      dailyUsage: summary.dailyUsage,
      sessions: summary.sessions
    };
  },

  getSubjectsData: async (entity: LogEntityType, id: string, filters?: LogFilterParams) => {
    const summary = await logApi.fetchSummary(entity, id, filters);
    return {
      subjectFrequency: summary.subjectCounts
    };
  },

  getProfessorStudentsByDiscipline: async (disciplineId: string) => {
    return getRequest<LogApiResponse<UserAnalysisLog>>(PROFESSOR_LOG_ROUTES.listStudentsByDiscipline(disciplineId));
  },

  getProfessorStudentDetails: async (studentId: string, disciplineId: string) => {
    return getRequest<LogApiResponse<UserAnalysisLog>>(PROFESSOR_LOG_ROUTES.getStudentDetails(studentId, disciplineId));
  },

  fetchSummary: async (entity: LogEntityType, id: string, filters?: LogFilterParams): Promise<UserAnalysisLog> => {
    switch (entity) {
      case "university":
        return (await logApi.getUniversitySummary(id)).data;
      case "course":
        return (await logApi.getCourseSummary(id)).data;
      case "class":
        return (await logApi.getClassSummary(id)).data;
      case "discipline":
        return (await logApi.getDisciplineSummary(id)).data;
      case "student":
        return await logApi.getFilteredStudentSummary({
          universityId: filters?.universityId || "",
          courseId: filters?.courseId,
          classId: filters?.classId,
          studentId: id
        });
      default:
        throw new Error(`Entidade inválida: ${entity}`);
    }
  },

  get: async (
    entity: LogEntityType,
    metric: LogMetricType,
    id: string,
    filters?: LogFilterParams
  ) => {
    switch (metric) {
      case "accuracy":
        return logApi.getAccuracyData(entity, id, filters);
      case "usage":
        return logApi.getUsageData(entity, id, filters);
      case "subjects":
        return logApi.getSubjectsData(entity, id, filters);
      default:
        throw new Error(`Métrica inválida: ${metric}`);
    }
  }
};

export default logApi;
