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

// Tipos para os parâmetros de entrada
export type LogEntityType = "university" | "course" | "class" | "student" | "discipline";
export type LogMetricType = "accuracy" | "usage" | "subjects";
export type LogModeType = "individual" | "comparison";

// Interfaces para adaptação de dados
interface SummaryData {
  totalCorrectAnswers: number;
  totalWrongAnswers: number;
  usageTimeInSeconds: number;
  usageTime?: {
    totalSeconds: number;
    hours: number;
    minutes: number;
    seconds: number;
    formatted: string;
    humanized: string;
  };
  subjectCounts?: Record<string, number>;
  mostAccessedSubjects?: Array<{
    subject: string;
    count: number;
  }>;
  userCount?: number;
  users?: any;
}

// Interface para filtro de resumo
interface FilteredStudentSummaryParams {
  universityId: string;
  courseId?: string;
  classId?: string;
  studentId?: string;
}

// Interfaces para parâmetros de comparação
interface UniversitiesComparisonParams {
  universityId1: string;
  universityId2: string;
}

interface CoursesComparisonParams {
  courseId1: string;
  courseId2: string;
}

interface ClassesComparisonParams {
  classId1: string;
  classId2: string;
}

interface StudentsComparisonParams {
  studentId1: string;
  studentId2: string;
  classId: string;
}

export const logApi = {
  // Métodos para resumos existentes
  getUniversitySummary: <T>(id: string) =>
    getRequest<T>(LOG_ROUTES.summary.university(id)),

  getCourseSummary: <T>(id: string) =>
    getRequest<T>(LOG_ROUTES.summary.course(id)),

  getClassSummary: <T>(id: string) =>
    getRequest<T>(LOG_ROUTES.summary.class(id)),

  // Métodos para resumo filtrado de estudante
  getFilteredStudentSummary: <T>(body: FilteredStudentSummaryParams) =>
    postRequest<T>(LOG_ROUTES.summary.filteredStudent, body),

  // Novos métodos para comparações
  compareUniversities: <T>(params: UniversitiesComparisonParams) =>
    postRequest<T>(LOG_ROUTES.comparison.universities, params),

  compareCourses: <T>(params: CoursesComparisonParams) =>
    postRequest<T>(LOG_ROUTES.comparison.courses, params),

  compareClasses: <T>(params: ClassesComparisonParams) =>
    postRequest<T>(LOG_ROUTES.comparison.classes, params),

  compareStudents: <T>(params: StudentsComparisonParams) =>
    postRequest<T>(LOG_ROUTES.comparison.students, params),

  // Métodos adaptados para gráficos específicos - Individual
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

    // Para compatibilidade, tentamos usar mostAccessedSubjects primeiro,
    // mas também usamos o novo formato subjectCounts se disponível
    let subjectFrequency = {};

    if (summaryData.mostAccessedSubjects && Array.isArray(summaryData.mostAccessedSubjects)) {
      subjectFrequency = summaryData.mostAccessedSubjects.reduce((acc: Record<string, number>, item: any) => {
        acc[item.subject] = item.count;
        return acc;
      }, {});
    } else if (summaryData.subjectCounts) {
      subjectFrequency = summaryData.subjectCounts;
    }

    // Adapta os dados para o formato esperado pelo componente CategoryChart
    return {
      subjectFrequency,
      // Adiciona informações extras se disponíveis
      userCount: summaryData.userCount,
      users: summaryData.users
    } as unknown as T;
  },

  // Métodos adaptados para gráficos específicos - Comparação
  getComparisonAccuracyData: async <T>(
    entityType: string,
    id1: string,
    id2: string,
    additionalParams?: {
      classId?: string
    }
  ): Promise<T> => {
    let comparisonData: any;

    switch (entityType) {
      case "university":
        comparisonData = await postRequest(LOG_ROUTES.comparison.universities, {
          universityId1: id1,
          universityId2: id2
        });
        break;
      case "course":
        comparisonData = await postRequest(LOG_ROUTES.comparison.courses, {
          courseId1: id1,
          courseId2: id1
        });
        break;
      case "class":
        comparisonData = await postRequest(LOG_ROUTES.comparison.classes, {
          classId1: id1,
          classId2: id2
        });
        break;
      case "student":
        if (!additionalParams?.classId) {
          throw new Error("classId é obrigatório para comparação de alunos");
        }
        comparisonData = await postRequest(LOG_ROUTES.comparison.students, {
          studentId1: id1,
          studentId2: id2,
          classId: additionalParams.classId
        });
        break;
      default:
        throw new Error(`Tipo de entidade não suportado: ${entityType}`);
    }

    // Adapta os dados para o formato esperado pelo componente de comparação
    const entityNames = Object.keys(comparisonData);
    const entity1 = comparisonData[entityNames[0]];
    const entity2 = comparisonData[entityNames[1]];

    return {
      entities: [
        {
          id: id1,
          key: entityNames[0],
          totalCorrect: entity1.totalCorrectAnswers || 0,
          totalWrong: entity1.totalWrongAnswers || 0,
          accuracy: (entity1.totalCorrectAnswers + entity1.totalWrongAnswers) > 0
            ? (entity1.totalCorrectAnswers / (entity1.totalCorrectAnswers + entity1.totalWrongAnswers)) * 100
            : 0
        },
        {
          id: id2,
          key: entityNames[1],
          totalCorrect: entity2.totalCorrectAnswers || 0,
          totalWrong: entity2.totalWrongAnswers || 0,
          accuracy: (entity2.totalCorrectAnswers + entity2.totalWrongAnswers) > 0
            ? (entity2.totalCorrectAnswers / (entity2.totalCorrectAnswers + entity2.totalWrongAnswers)) * 100
            : 0
        }
      ]
    } as unknown as T;
  },

  getComparisonUsageData: async <T>(
    entityType: string,
    id1: string,
    id2: string,
    additionalParams?: {
      classId?: string
    }
  ): Promise<T> => {
    let comparisonData: any;

    switch (entityType) {
      case "university":
        comparisonData = await postRequest(LOG_ROUTES.comparison.universities, {
          universityId1: id1,
          universityId2: id2
        });
        break;
      case "course":
        comparisonData = await postRequest(LOG_ROUTES.comparison.courses, {
          courseId1: id1,
          courseId2: id2
        });
        break;
      case "class":
        comparisonData = await postRequest(LOG_ROUTES.comparison.classes, {
          classId1: id1,
          classId2: id2
        });
        break;
      case "student":
        if (!additionalParams?.classId) {
          throw new Error("classId é obrigatório para comparação de alunos");
        }
        comparisonData = await postRequest(LOG_ROUTES.comparison.students, {
          studentId1: id1,
          studentId2: id2,
          classId: additionalParams.classId
        });
        break;
      default:
        throw new Error(`Tipo de entidade não suportado: ${entityType}`);
    }

    // Adapta os dados para o formato esperado pelo componente de comparação
    const entityNames = Object.keys(comparisonData);
    const entity1 = comparisonData[entityNames[0]];
    const entity2 = comparisonData[entityNames[1]];

    return {
      entities: [
        {
          id: id1,
          key: entityNames[0],
          totalUsageTime: entity1.usageTimeInSeconds || 0,
          usageTime: entity1.usageTime || {},
          sessionCount: 1,
          sessionDetails: [{
            sessionStart: new Date().toISOString(),
            sessionEnd: new Date().toISOString(),
            sessionDuration: entity1.usageTimeInSeconds || 0
          }]
        },
        {
          id: id2,
          key: entityNames[1],
          totalUsageTime: entity2.usageTimeInSeconds || 0,
          usageTime: entity2.usageTime || {},
          sessionCount: 1,
          sessionDetails: [{
            sessionStart: new Date().toISOString(),
            sessionEnd: new Date().toISOString(),
            sessionDuration: entity2.usageTimeInSeconds || 0
          }]
        }
      ]
    } as unknown as T;
  },

  getComparisonSubjectsData: async <T>(
    entityType: string,
    id1: string,
    id2: string,
    additionalParams?: {
      classId?: string
    }
  ): Promise<T> => {
    let comparisonData: any;

    switch (entityType) {
      case "university":
        comparisonData = await postRequest(LOG_ROUTES.comparison.universities, {
          universityId1: id1,
          universityId2: id2
        });
        break;
      case "course":
        comparisonData = await postRequest(LOG_ROUTES.comparison.courses, {
          courseId1: id1,
          courseId2: id2
        });
        break;
      case "class":
        comparisonData = await postRequest(LOG_ROUTES.comparison.classes, {
          classId1: id1,
          classId2: id2
        });
        break;
      case "student":
        if (!additionalParams?.classId) {
          throw new Error("classId é obrigatório para comparação de alunos");
        }
        comparisonData = await postRequest(LOG_ROUTES.comparison.students, {
          studentId1: id1,
          studentId2: id2,
          classId: additionalParams.classId
        });
        break;
      default:
        throw new Error(`Tipo de entidade não suportado: ${entityType}`);
    }

    // Adapta os dados para o formato esperado pelo componente de comparação
    const entityNames = Object.keys(comparisonData);
    const entity1 = comparisonData[entityNames[0]];
    const entity2 = comparisonData[entityNames[1]];

    return {
      entities: [
        {
          id: id1,
          key: entityNames[0],
          subjectFrequency: entity1.subjectCounts || {}
        },
        {
          id: id2,
          key: entityNames[1],
          subjectFrequency: entity2.subjectCounts || {}
        }
      ]
    } as unknown as T;
  },

  // API unificada para buscar dados com base no tipo de entidade, métrica e modo
  get: async <T>(
    entity: LogEntityType,
    metric: LogMetricType,
    mode: LogModeType,
    idOrIds: string | string[],
    additionalParams?: {
      courseId?: string,
      classId?: string,
      studentId?: string
    }
  ): Promise<T> => {
    console.log(`logApi.get: ${entity}/${metric}/${mode}`, idOrIds);

    // Modo individual - buscando dados para uma única entidade
    if (mode === "individual") {
      const id = idOrIds as string;

      try {
        let response: any;

        switch (entity) {
          case "university":
            response = await getRequest<any>(LOG_ROUTES.summary.university(id));
            break;
          case "course":
            response = await getRequest<any>(LOG_ROUTES.summary.course(id));
            break;
          case "class":
            response = await getRequest<any>(LOG_ROUTES.summary.class(id));
            break;
          case "student":
            response = await postRequest<any>(LOG_ROUTES.summary.filteredStudent, {
              universityId: id,
              courseId: additionalParams?.courseId,
              classId: additionalParams?.classId,
              studentId: additionalParams?.studentId
            });
            break;
          default:
            console.warn(`logApi.get: Entidade não suportada ${entity}`);
            return {} as T;
        }

        console.log(`logApi.get: Resposta recebida:`, response);

        // Adaptar a resposta para o formato esperado pelos componentes
        if (metric === "accuracy") {
          return {
            totalCorrect: response.totalCorrectAnswers || 0,
            totalWrong: response.totalWrongAnswers || 0,
            accuracy: response.totalCorrectAnswers + response.totalWrongAnswers > 0
              ? (response.totalCorrectAnswers / (response.totalCorrectAnswers + response.totalWrongAnswers)) * 100
              : 0,
            // Adiciona informações extras
            userCount: response.userCount,
            users: response.users
          } as unknown as T;
        }
        else if (metric === "subjects") {
          // Converter para o formato esperado pelo componente CategoryChart
          let subjectFrequency = {};

          if (response.mostAccessedSubjects && Array.isArray(response.mostAccessedSubjects)) {
            subjectFrequency = response.mostAccessedSubjects.reduce((acc: Record<string, number>, item: any) => {
              acc[item.subject] = item.count;
              return acc;
            }, {});
          } else if (response.subjectCounts) {
            subjectFrequency = response.subjectCounts;
          }

          return {
            subjectFrequency,
            // Adiciona informações extras
            userCount: response.userCount,
            users: response.users
          } as unknown as T;
        }
        else if (metric === "usage") {
          // Converter para o formato esperado pelo componente UsageChart
          return {
            totalUsageTime: response.usageTimeInSeconds || 0,
            sessionCount: 1,
            sessionDetails: [{
              sessionStart: new Date().toISOString(),
              sessionEnd: new Date().toISOString(),
              sessionDuration: response.usageTimeInSeconds || 0
            }],
            // Adiciona informações extras
            userCount: response.userCount,
            users: response.users
          } as unknown as T;
        }

        return response as T;
      } catch (error) {
        console.error(`logApi.get: Erro ao adaptar dados para ${entity}/${metric}:`, error);
        throw error;
      }
    }
    // Modo de comparação - buscando dados para comparar duas entidades
    else if (mode === "comparison") {
      try {
        // Verificamos se temos os IDs necessários para comparação
        if (!Array.isArray(idOrIds) || idOrIds.length !== 2) {
          throw new Error("Para comparação, forneça exatamente dois IDs");
        }

        const [id1, id2] = idOrIds;
        let comparisonData: any;

        // Selecionar o endpoint correto com base na entidade
        switch (entity) {
          case "university":
            comparisonData = await postRequest(LOG_ROUTES.comparison.universities, {
              universityId1: id1,
              universityId2: id2
            });
            break;
          case "course":
            comparisonData = await postRequest(LOG_ROUTES.comparison.courses, {
              courseId1: id1,
              courseId2: id2
            });
            break;
          case "class":
            comparisonData = await postRequest(LOG_ROUTES.comparison.classes, {
              classId1: id1,
              classId2: id2
            });
            break;
          case "student":
            if (!additionalParams?.classId) {
              throw new Error("classId é obrigatório para comparação de alunos");
            }

            comparisonData = await postRequest(LOG_ROUTES.comparison.students, {
              studentId1: id1,
              studentId2: id2,
              classId: additionalParams.classId
            });
            break;
          default:
            throw new Error(`Tipo de entidade inválido: ${entity}`);
        }

        // Extrair as chaves dos objetos na resposta (normalmente "entity1" e "entity2")
        const entityKeys = Object.keys(comparisonData);
        if (entityKeys.length !== 2) {
          throw new Error("Resposta de comparação inválida");
        }

        const entity1 = comparisonData[entityKeys[0]];
        const entity2 = comparisonData[entityKeys[1]];

        // Formatar os dados de acordo com a métrica solicitada
        if (metric === "accuracy") {
          return {
            entities: [
              {
                id: id1,
                key: entityKeys[0],
                name: entityKeys[0],
                totalCorrect: entity1.totalCorrectAnswers || 0,
                totalWrong: entity1.totalWrongAnswers || 0,
                accuracy: (entity1.totalCorrectAnswers + entity1.totalWrongAnswers) > 0
                  ? (entity1.totalCorrectAnswers / (entity1.totalCorrectAnswers + entity1.totalWrongAnswers)) * 100
                  : 0
              },
              {
                id: id2,
                key: entityKeys[1],
                name: entityKeys[1],
                totalCorrect: entity2.totalCorrectAnswers || 0,
                totalWrong: entity2.totalWrongAnswers || 0,
                accuracy: (entity2.totalCorrectAnswers + entity2.totalWrongAnswers) > 0
                  ? (entity2.totalCorrectAnswers / (entity2.totalCorrectAnswers + entity2.totalWrongAnswers)) * 100
                  : 0
              }
            ]
          } as unknown as T;
        }
        else if (metric === "subjects") {
          return {
            entities: [
              {
                id: id1,
                key: entityKeys[0],
                name: entityKeys[0],
                subjectFrequency: entity1.subjectCounts || {}
              },
              {
                id: id2,
                key: entityKeys[1],
                name: entityKeys[1],
                subjectFrequency: entity2.subjectCounts || {}
              }
            ]
          } as unknown as T;
        }
        else if (metric === "usage") {
          return {
            entities: [
              {
                id: id1,
                key: entityKeys[0],
                name: entityKeys[0],
                totalUsageTime: entity1.usageTimeInSeconds || 0,
                usageTime: entity1.usageTime || {},
                sessionCount: 1,
                sessionDetails: [{
                  sessionStart: new Date().toISOString(),
                  sessionEnd: new Date().toISOString(),
                  sessionDuration: entity1.usageTimeInSeconds || 0
                }]
              },
              {
                id: id2,
                key: entityKeys[1],
                name: entityKeys[1],
                totalUsageTime: entity2.usageTimeInSeconds || 0,
                usageTime: entity2.usageTime || {},
                sessionCount: 1,
                sessionDetails: [{
                  sessionStart: new Date().toISOString(),
                  sessionEnd: new Date().toISOString(),
                  sessionDuration: entity2.usageTimeInSeconds || 0
                }]
              }
            ]
          } as unknown as T;
        }

        // Se não for uma das métricas específicas, retornar a resposta bruta
        return comparisonData as T;
      } catch (error) {
        console.error(`logApi.get: Erro no modo de comparação para ${entity}/${metric}:`, error);
        throw error;
      }
    }

    throw new Error(`Modo não suportado: ${mode}`);
  }
};

export default logApi;