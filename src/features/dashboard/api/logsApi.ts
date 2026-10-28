import { t } from "@/i18n";
import { api } from "@/shared/api/httpClient";
import { LOG_ROUTES, PROFESSOR_LOG_ROUTES } from "@/services/api/api_routes";
import {
  LogApiResponse,
  UserAnalysisLog,
  LogFilterParams,
} from "@/features/dashboard/logTypes";

const getRequest = async <T>(url: string): Promise<T> => {
  const response = await api.get<T>(url, { withCredentials: true });
  return response.data;
};

const postRequest = async <T>(url: string, data: object): Promise<T> => {
  const response = await api.post<T>(url, data, { withCredentials: true });
  return response.data;
};

function unwrapLogResponse<T>(response: LogApiResponse<T> | T): T {
  if (response && typeof response === "object" && "data" in response) {
    return (response as LogApiResponse<T>).data;
  }
  return response as T;
}

function isFailedEnvelope<T>(
  response: LogApiResponse<T> | T,
): response is LogApiResponse<T> {
  return Boolean(
    response &&
    typeof response === "object" &&
    "success" in response &&
    !(response as LogApiResponse<T>).success,
  );
}

export type LogEntityType =
  | "university"
  | "course"
  | "class"
  | "student"
  | "discipline";
export type LogMetricType = "accuracy" | "usage" | "subjects";

export const logApi = {
  getUniversitySummary: async (id: string) =>
    getRequest<LogApiResponse<UserAnalysisLog> | UserAnalysisLog>(
      LOG_ROUTES.summary.university(id),
    ),

  getCourseSummary: async (id: string) =>
    getRequest<LogApiResponse<UserAnalysisLog> | UserAnalysisLog>(
      LOG_ROUTES.summary.course(id),
    ),

  getClassSummary: async (id: string) =>
    getRequest<LogApiResponse<UserAnalysisLog> | UserAnalysisLog>(
      LOG_ROUTES.summary.class(id),
    ),

  getDisciplineSummary: async (id: string) =>
    getRequest<LogApiResponse<UserAnalysisLog> | UserAnalysisLog>(
      LOG_ROUTES.summary.discipline(id),
    ),

  getFilteredStudentSummary: async (
    params: LogFilterParams,
  ): Promise<UserAnalysisLog> => {
    const response = await postRequest<
      LogApiResponse<UserAnalysisLog> | UserAnalysisLog
    >(LOG_ROUTES.summary.filteredStudent, params);
    if (isFailedEnvelope(response))
      throw new Error(response.error || t("dashboard.erroAoBuscarDadosDeUsuario"));
    return unwrapLogResponse(response);
  },

  getAccuracyData: async (
    entity: LogEntityType,
    id: string,
    filters?: LogFilterParams,
  ) => {
    const summary = await logApi.fetchSummary(entity, id, filters);
    const totalCorrect = summary.totalCorrectAnswers;
    const totalWrong = summary.totalWrongAnswers;
    return {
      totalCorrect,
      totalWrong,
      accuracy:
        totalCorrect + totalWrong > 0
          ? (totalCorrect / (totalCorrect + totalWrong)) * 100
          : 0,
    };
  },

  getUsageData: async (
    entity: LogEntityType,
    id: string,
    filters?: LogFilterParams,
  ) => {
    const summary = await logApi.fetchSummary(entity, id, filters);
    return {
      totalUsageTime: summary.usageTimeInSeconds,
      usageTime: summary.usageTime,
      dailyUsage: summary.dailyUsage,
      sessions: summary.sessions,
    };
  },

  getSubjectsData: async (
    entity: LogEntityType,
    id: string,
    filters?: LogFilterParams,
  ) => {
    const summary = await logApi.fetchSummary(entity, id, filters);
    return {
      subjectFrequency: summary.subjectCounts,
    };
  },

  getProfessorStudentsByDiscipline: async (disciplineId: string) => {
    return getRequest<LogApiResponse<UserAnalysisLog> | UserAnalysisLog>(
      PROFESSOR_LOG_ROUTES.listStudentsByDiscipline(disciplineId),
    );
  },

  getProfessorStudentDetails: async (
    studentId: string,
    disciplineId: string,
  ) => {
    return getRequest<LogApiResponse<UserAnalysisLog> | UserAnalysisLog>(
      PROFESSOR_LOG_ROUTES.getStudentDetails(studentId, disciplineId),
    );
  },

  fetchSummary: async (
    entity: LogEntityType,
    id: string,
    filters?: LogFilterParams,
  ): Promise<UserAnalysisLog> => {
    switch (entity) {
      case "university":
        return unwrapLogResponse(await logApi.getUniversitySummary(id));
      case "course":
        return unwrapLogResponse(await logApi.getCourseSummary(id));
      case "class":
        return unwrapLogResponse(await logApi.getClassSummary(id));
      case "discipline":
        return unwrapLogResponse(await logApi.getDisciplineSummary(id));
      case "student":
        return await logApi.getFilteredStudentSummary({
          universityId: filters?.universityId || "",
          courseId: filters?.courseId,
          classId: filters?.classId,
          studentId: id,
        });
      default:
        throw new Error(t("dashboard.entidadeInvalidaValue0", { value0: entity }));
    }
  },

  get: async (
    entity: LogEntityType,
    metric: LogMetricType,
    id: string,
    filters?: LogFilterParams,
  ) => {
    switch (metric) {
      case "accuracy":
        return logApi.getAccuracyData(entity, id, filters);
      case "usage":
        return logApi.getUsageData(entity, id, filters);
      case "subjects":
        return logApi.getSubjectsData(entity, id, filters);
      default:
        throw new Error(t("dashboard.metricaInvalidaValue0", { value0: metric }));
    }
  },
};

export default logApi;
