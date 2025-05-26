import { api } from "@/services/api/api";
import { LOG_ROUTES } from "./api_routes";
import {
  LogApiResponse,
  UserAnalysisLog,
  LogFilterParams
} from "../../@types/Log";

// Funções HTTP genéricas
const getRequest = async <T>(url: string): Promise<T> => {
  const response = await api.get<T>(url, { withCredentials: true });
  return response.data;
};

const postRequest = async <T>(url: string, data: object): Promise<T> => {
  const response = await api.post<T>(url, data, { withCredentials: true });
  return response.data;
};

// Tipos de entidade, métrica e modo
export type LogEntityType =
    | "university"
    | "course"
    | "class"
    | "student"
    | "discipline";
export type LogMetricType = "accuracy" | "usage" | "subjects";
export type LogModeType = "individual" | "comparison";

export const logApi = {
  // Resumos diretos de universidade, curso e turma
  getUniversitySummary: async (id: string) =>
      getRequest<LogApiResponse<UserAnalysisLog>>(LOG_ROUTES.summary.university(id)),

  getCourseSummary: async (id: string) =>
      getRequest<LogApiResponse<UserAnalysisLog>>(LOG_ROUTES.summary.course(id)),

  getClassSummary: async (id: string) =>
      getRequest<LogApiResponse<UserAnalysisLog>>(LOG_ROUTES.summary.class(id)),

  // Resumo filtrado do estudante
  getFilteredStudentSummary: async (
      params: LogFilterParams
  ): Promise<UserAnalysisLog> => {
    const response = await postRequest<LogApiResponse<UserAnalysisLog>>(
        LOG_ROUTES.summary.filteredStudent,
        params
    );
    if (!response.success) {
      throw new Error(response.error || "Erro ao buscar dados de usuário");
    }
    return response.data;
  },

  // Comparações de entidades
  compareUniversities: async (ids: { universityId1: string; universityId2: string }) =>
      postRequest<any>(LOG_ROUTES.comparison.universities, ids),

  compareCourses: async (ids: { courseId1: string; courseId2: string }) =>
      postRequest<any>(LOG_ROUTES.comparison.courses, ids),

  compareClasses: async (ids: { classId1: string; classId2: string }) =>
      postRequest<any>(LOG_ROUTES.comparison.classes, ids),

  compareStudents: async (
      ids: { studentId1: string; studentId2: string; classId: string }
  ) => postRequest<any>(LOG_ROUTES.comparison.students, ids),

  // Dados para gráficos individuais de aluno
  getAccuracyData: async (
      entity: LogEntityType,
      id: string,
      filterParams?: Pick<LogFilterParams, 'universityId' | 'courseId' | 'classId'>
  ) => {
    if (entity !== "student") {
      throw new Error(`Entidade ${entity} não suportada para accuracy`);
    }
    // Monta o filtro completo para a chamada
    const params: LogFilterParams = {
      ...(filterParams || {}),
      studentId: id
    };
    const summary = await logApi.getFilteredStudentSummary(params);
    const totalCorrect = summary.totalCorrectAnswers;
    const totalWrong = summary.totalWrongAnswers;
    return {
      totalCorrect,
      totalWrong,
      accuracy:
          totalCorrect + totalWrong > 0
              ? (totalCorrect / (totalCorrect + totalWrong)) * 100
              : 0
    };
  },

  getUsageData: async (
      entity: LogEntityType,
      id: string,
      filterParams?: Pick<LogFilterParams, 'universityId' | 'courseId' | 'classId'>
  ) => {
    if (entity !== "student") {
      throw new Error(`Entidade ${entity} não suportada para usage`);
    }
    const params: LogFilterParams = {
      ...(filterParams || {}),
      studentId: id
    };
    const summary = await logApi.getFilteredStudentSummary(params);
    return {
      totalUsageTime: summary.usageTimeInSeconds,
      usageTime: summary.usageTime,
      dailyUsage: summary.dailyUsage,
      sessions: summary.sessions
    };
  },

  getSubjectsData: async (
      entity: LogEntityType,
      id: string,
      filterParams?: Pick<LogFilterParams, 'universityId' | 'courseId' | 'classId'>
  ) => {
    if (entity !== "student") {
      throw new Error(`Entidade ${entity} não suportada para subjects`);
    }
    const params: LogFilterParams = {
      ...(filterParams || {}),
      studentId: id
    };
    const summary = await logApi.getFilteredStudentSummary(params);
    return {
      subjectFrequency: summary.subjectCounts
    };
  },

  // API unificada para buscar dados com base no tipo, métrica e modo
  get: async (
      entity: LogEntityType,
      metric: LogMetricType,
      mode: LogModeType,
      idOrIds: string | [string, string],
      params?: LogFilterParams
  ) => {
    if (mode === "individual") {
      const id = idOrIds as string;
      const filterParams = {
        universityId: params?.universityId,
        courseId: params?.courseId,
        classId: params?.classId
      };
      switch (metric) {
        case "accuracy":
          return logApi.getAccuracyData(entity, id, filterParams);
        case "usage":
          return logApi.getUsageData(entity, id, filterParams);
        case "subjects":
          return logApi.getSubjectsData(entity, id, filterParams);
      }
    } else {
      // comparação - atualmente apenas para estudantes
      if (!Array.isArray(idOrIds) || idOrIds.length !== 2) {
        throw new Error("Comparação requer dois IDs");
      }
      const [id1, id2] = idOrIds;
      if (entity !== "student" || !params?.classId) {
        throw new Error(`Comparação de ${entity} requer classId`);
      }
      switch (metric) {
        case "accuracy":
          return logApi.compareStudents({
            studentId1: id1,
            studentId2: id2,
            classId: params.classId
          });
        case "usage":
        case "subjects":
          return logApi.compareStudents({
            studentId1: id1,
            studentId2: id2,
            classId: params.classId
          });
      }
    }
    throw new Error(`Método não suportado: ${mode}/${metric}`);
  }
};

export default logApi;