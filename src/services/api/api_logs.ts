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

// Interfaces para adaptação de dados
interface SummaryData {
  totalCorrectAnswers: number;
  totalWrongAnswers: number;
  usageTimeInSeconds: number;
  mostAccessedSubjects: Array<{
    subject: string;
    count: number;
  }>;
  userCount?: number;
  users?: any; // Adiciona suporte para dados de usuário específico
}

// Interface para filtro de resumo
interface FilteredStudentSummaryParams {
  universityId: string;
  courseId?: string;
  classId?: string;
  studentId?: string; // Novo parâmetro opcional
}

export const logApi = {
  // Métodos para resumos existentes
  getUniversitySummary: <T>(id: string) =>
    getRequest<T>(LOG_ROUTES.summary.university(id)),

  getCourseSummary: <T>(id: string) =>
    getRequest<T>(LOG_ROUTES.summary.course(id)),

  getClassSummary: <T>(id: string) =>
    getRequest<T>(LOG_ROUTES.summary.class(id)),

  // Atualiza a tipagem para incluir studentId
  getFilteredStudentSummary: <T>(body: FilteredStudentSummaryParams) =>
    postRequest<T>(LOG_ROUTES.summary.filteredStudent, body),

  // Métodos adaptados para gráficos específicos
  getAccuracyData: async <T>(entityType: string, id: string, additionalParams?: FilteredStudentSummaryParams): Promise<T> => {
    let summaryData: SummaryData;

    switch (entityType) {
      case "university":
        summaryData = await getRequest<SummaryData>(LOG_ROUTES.summary.university(id));
        break;
      case "course":
        summaryData = await getRequest<SummaryData>(LOG_ROUTES.summary.course(id));
        break;
      case "class":
        summaryData = await getRequest<SummaryData>(LOG_ROUTES.summary.class(id));
        break;
      case "student":
        // Adiciona suporte para parâmetros adicionais ao buscar dados de um aluno
        summaryData = await postRequest<SummaryData>(LOG_ROUTES.summary.filteredStudent, {
          universityId: id,
          ...(additionalParams || {})
        });
        break;
      default:
        throw new Error(`Tipo de entidade não suportado: ${entityType}`);
    }

    // Adapta os dados para o formato esperado pelo componente CorrectWrongChart
    return {
      totalCorrect: summaryData.totalCorrectAnswers || 0,
      totalWrong: summaryData.totalWrongAnswers || 0,
      accuracy: summaryData.totalCorrectAnswers + summaryData.totalWrongAnswers > 0
        ? (summaryData.totalCorrectAnswers / (summaryData.totalCorrectAnswers + summaryData.totalWrongAnswers)) * 100
        : 0,
      // Adiciona informações extras se disponíveis
      userCount: summaryData.userCount,
      users: summaryData.users
    } as unknown as T;
  },

  getUsageData: async <T>(entityType: string, id: string, additionalParams?: FilteredStudentSummaryParams): Promise<T> => {
    let summaryData: SummaryData;

    switch (entityType) {
      case "university":
        summaryData = await getRequest<SummaryData>(LOG_ROUTES.summary.university(id));
        break;
      case "course":
        summaryData = await getRequest<SummaryData>(LOG_ROUTES.summary.course(id));
        break;
      case "class":
        summaryData = await getRequest<SummaryData>(LOG_ROUTES.summary.class(id));
        break;
      case "student":
        // Adiciona suporte para parâmetros adicionais ao buscar dados de um aluno
        summaryData = await postRequest<SummaryData>(LOG_ROUTES.summary.filteredStudent, {
          universityId: id,
          ...(additionalParams || {})
        });
        break;
      default:
        throw new Error(`Tipo de entidade não suportado: ${entityType}`);
    }

    // Adapta os dados para o formato esperado pelo componente UsageChart
    return {
      totalUsageTime: summaryData.usageTimeInSeconds || 0,
      sessionCount: 1,
      sessionDetails: [{
        sessionStart: new Date().toISOString(),
        sessionEnd: new Date().toISOString(),
        sessionDuration: summaryData.usageTimeInSeconds || 0
      }],
      // Adiciona informações extras se disponíveis
      userCount: summaryData.userCount,
      users: summaryData.users
    } as unknown as T;
  },

  getSubjectsData: async <T>(entityType: string, id: string, additionalParams?: FilteredStudentSummaryParams): Promise<T> => {
    let summaryData: SummaryData;

    switch (entityType) {
      case "university":
        summaryData = await getRequest<SummaryData>(LOG_ROUTES.summary.university(id));
        break;
      case "course":
        summaryData = await getRequest<SummaryData>(LOG_ROUTES.summary.course(id));
        break;
      case "class":
        summaryData = await getRequest<SummaryData>(LOG_ROUTES.summary.class(id));
        break;
      case "student":
        // Adiciona suporte para parâmetros adicionais ao buscar dados de um aluno
        summaryData = await postRequest<SummaryData>(LOG_ROUTES.summary.filteredStudent, {
          universityId: id,
          ...(additionalParams || {})
        });
        break;
      default:
        throw new Error(`Tipo de entidade não suportado: ${entityType}`);
    }

    // Adapta os dados para o formato esperado pelo componente CategoryChart
    return {
      subjectFrequency: summaryData.mostAccessedSubjects?.reduce((acc: Record<string, number>, item: any) => {
        acc[item.subject] = item.count;
        return acc;
      }, {}) || {},
      // Adiciona informações extras se disponíveis
      userCount: summaryData.userCount,
      users: summaryData.users
    } as unknown as T;
  }
};