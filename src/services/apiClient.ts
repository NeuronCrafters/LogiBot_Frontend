import { api } from "@/services/api/api";
import {
  ACADEMIC_ROUTES,
  // PUBLIC_ROUTES,
  RASA_ROUTES,
  ADMIN_ROUTES,
  PROFESSOR_ROUTES,
  COORDINATOR_ROUTES,
  LOG_ROUTES,
  AcademicEntityType,
  LogEntityType,
  LogMetricType,
  LogModeType
} from "./api/api_routes";

const getRequest = async <T>(url: string): Promise<T> => {
  const response = await api.get<T>(url, { withCredentials: true });
  return response.data;
};

const postRequest = async <T>(url: string, data: object): Promise<T> => {
  const response = await api.post<T>(url, data, { withCredentials: true });
  return response.data;
};

const deleteRequest = async <T>(url: string): Promise<T> => {
  const response = await api.delete<T>(url, { withCredentials: true });
  return response.data;
};

const patchRequest = async <T>(url: string, data: object): Promise<T> => {
  const response = await api.patch<T>(url, data, { withCredentials: true });
  return response.data;
};

// -------------------------------------
// Academic (publicly managed entities)
// -------------------------------------
export const academicApi = {
  async post<T>(entity: AcademicEntityType, data: object): Promise<T> {
    const url = ACADEMIC_ROUTES[entity].post;
    return postRequest<T>(url, data);
  },
  async get<T>(entity: AcademicEntityType, id?: string): Promise<T> {
    const base = ACADEMIC_ROUTES[entity].get;
    const url = id ? `${base}/${id}` : base;
    return getRequest<T>(url);
  },
  async delete<T>(entity: AcademicEntityType, id: string): Promise<T> {
    const base = ACADEMIC_ROUTES[entity].delete;
    const url = `${base}/${id}`;
    return deleteRequest<T>(url);
  },
};

// --------------------
// Public lookup routes
// --------------------
// export const publicApi = {
//   getInstitutions: <T>() => getRequest<T>(PUBLIC_ROUTES.institutions),
//   getCourses: <T>(universityId: string) =>
//     getRequest<T>(`${PUBLIC_ROUTES.courses}/${universityId}`),
//   getDisciplines: <T>(u: string, c: string) =>
//     getRequest<T>(`${PUBLIC_ROUTES.disciplines}/${u}/${c}`),
//   getClasses: <T>(u: string, c: string) =>
//     getRequest<T>(`${PUBLIC_ROUTES.classes}/${u}/${c}`),
//   getProfessors: <T>(u: string, c?: string) =>
//     getRequest<T>(
//       c
//         ? `${PUBLIC_ROUTES.professors}/${u}/${c}`
//         : `${PUBLIC_ROUTES.professors}/${u}`
//     ),
//   getStudentsByClass: <T>(u: string, c: string, t: string) =>
//     getRequest<T>(`${PUBLIC_ROUTES.studentsByClass}/${u}/${c}/${t}`),
//   getStudentsByDiscipline: <T>(u: string, c: string, d: string) =>
//     getRequest<T>(`${PUBLIC_ROUTES.studentsByDiscipline}/${u}/${c}/${d}`),
//   getStudentsByCourse: <T>(u: string, c: string) =>
//     getRequest<T>(`${PUBLIC_ROUTES.studentsByCourse}/${u}/${c}`),

//   // !ROTAS DE TESTE
//   getStudentById: <T>(id: string) => getRequest<T>(`/public/student/${id}`),
//   getClassById: <T>(id: string) => getRequest<T>(`/public/class/${id}`),
//   getCourseById: <T>(id: string) => getRequest<T>(`/public/course/${id}`),
//   getDisciplineById: <T>(id: string) => getRequest<T>(`/public/discipline/${id}`),
//   getUniversityById: <T>(id: string) => getRequest<T>(`/public/university/${id}`),
// };

// --------------
// Admin routes
// --------------
export const adminApi = {
  createProfessor: <T>(data: object) =>
    postRequest<T>(ADMIN_ROUTES.createProfessor, data),

  deleteProfessor: <T>(professorId: string) =>
    deleteRequest<T>(
      ADMIN_ROUTES.deleteProfessor.replace(":professorId", professorId)
    ),

  listAllProfessors: <T>() => getRequest<T>(ADMIN_ROUTES.listAllProfessors),

  listProfessorsByUniversity: <T>(schoolId: string) =>
    getRequest<T>(
      ADMIN_ROUTES.listProfessorsByUniversity.replace(
        ":schoolId",
        schoolId
      )
    ),

  listProfessorsByCourse: <T>(courseId: string) =>
    getRequest<T>(
      ADMIN_ROUTES.listProfessorsByCourse.replace(":courseId", courseId)
    ),

  updateProfessorRole: <T>(id: string, action: "add" | "remove") =>
    patchRequest<T>(
      ADMIN_ROUTES.updateProfessorRole.replace(":id", id),
      { action }
    ),

  listStudents: <T>() => getRequest<T>(ADMIN_ROUTES.listStudents),
};

// --------------------
// Professor‐specific
// --------------------
export const professorApi = {
  listMyStudents: <T>() => getRequest<T>(PROFESSOR_ROUTES.listMyStudents),
};

// ---------------------------
// Course-Coordinator routes
// ---------------------------
export const coordinatorApi = {
  listMyProfessors: <T>() =>
    getRequest<T>(COORDINATOR_ROUTES.listMyProfessors),

  listMyStudents: <T>() =>
    getRequest<T>(COORDINATOR_ROUTES.listMyStudents),

  listStudentsByDiscipline: <T>(disciplineId: string) =>
    getRequest<T>(
      COORDINATOR_ROUTES.listStudentsByDiscipline.replace(
        ":disciplineId",
        disciplineId
      )
    ),
  listDisciplines: <T>() =>
    getRequest<T>(COORDINATOR_ROUTES.listDisciplines),
  listClasses: <T>() =>
    getRequest<T>(COORDINATOR_ROUTES.listClasses),
};

// --------------
// Rasa chatbot
// --------------
export const rasaApi = {
  sendMessage: <T>(message: string) =>
    postRequest<T>(RASA_ROUTES.talk, { message }),
  listarNiveis: <T>() => getRequest<T>(RASA_ROUTES.listarNiveis),
  definirNivel: <T>(nivel: string) =>
    postRequest<T>(RASA_ROUTES.definirNivel, { nivel }),
  listarOpcoes: <T>() => getRequest<T>(RASA_ROUTES.listarOpcoes),
  listarSubopcoes: <T>(categoria: string) =>
    postRequest<T>(RASA_ROUTES.listarSubopcoes, { categoria }),
  gerarPerguntas: <T>(pergunta: string) =>
    postRequest<T>(RASA_ROUTES.gerarPerguntas, { pergunta }),
  getGabarito: <T>() => getRequest<T>(RASA_ROUTES.getGabarito),
  verificarRespostas: <T>(respostas: string[]) =>
    postRequest<T>(RASA_ROUTES.verificarRespostas, { respostas }),
  actionConversar: <T>() =>
    postRequest<T>(RASA_ROUTES.actionConversar, { text: "conversar" }),
  actionPerguntar: <T>(message: string) =>
    postRequest<T>(RASA_ROUTES.actionPerguntar, { message }),
};

// --------------------------------------
// Interfaces para os parâmetros de logs
// --------------------------------------

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

// --------------
// Logs
// --------------
export const logApi = {
  // Métodos para resumos existentes
  getUniversitySummary: <T>(id: string) =>
    getRequest<T>(LOG_ROUTES.summary.university(id)),

  getCourseSummary: <T>(id: string) =>
    getRequest<T>(LOG_ROUTES.summary.course(id)),

  getClassSummary: <T>(id: string) =>
    getRequest<T>(LOG_ROUTES.summary.class(id)),

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
    let summaryData: any;

    switch (entityType) {
      case "university":
        summaryData = await getRequest<any>(LOG_ROUTES.summary.university(id));
        break;
      case "course":
        summaryData = await getRequest<any>(LOG_ROUTES.summary.course(id));
        break;
      case "class":
        summaryData = await getRequest<any>(LOG_ROUTES.summary.class(id));
        break;
      case "student":
        // Adiciona suporte para parâmetros adicionais ao buscar dados de um aluno
        summaryData = await postRequest<any>(LOG_ROUTES.summary.filteredStudent, {
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
    let summaryData: any;

    switch (entityType) {
      case "university":
        summaryData = await getRequest<any>(LOG_ROUTES.summary.university(id));
        break;
      case "course":
        summaryData = await getRequest<any>(LOG_ROUTES.summary.course(id));
        break;
      case "class":
        summaryData = await getRequest<any>(LOG_ROUTES.summary.class(id));
        break;
      case "student":
        // Adiciona suporte para parâmetros adicionais ao buscar dados de um aluno
        summaryData = await postRequest<any>(LOG_ROUTES.summary.filteredStudent, {
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
    let summaryData: any;

    switch (entityType) {
      case "university":
        summaryData = await getRequest<any>(LOG_ROUTES.summary.university(id));
        break;
      case "course":
        summaryData = await getRequest<any>(LOG_ROUTES.summary.course(id));
        break;
      case "class":
        summaryData = await getRequest<any>(LOG_ROUTES.summary.class(id));
        break;
      case "student":
        // Adiciona suporte para parâmetros adicionais ao buscar dados de um aluno
        summaryData = await postRequest<any>(LOG_ROUTES.summary.filteredStudent, {
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
            console.log(`logApi.get: Usando rota de resumo de universidade para ${metric}`);
            response = await getRequest<any>(LOG_ROUTES.summary.university(id));
            break;
          case "course":
            console.log(`logApi.get: Usando rota de resumo de curso para ${metric}`);
            response = await getRequest<any>(LOG_ROUTES.summary.course(id));
            break;
          case "class":
            console.log(`logApi.get: Usando rota de resumo de turma para ${metric}`);
            response = await getRequest<any>(LOG_ROUTES.summary.class(id));
            break;
          case "student":
            console.log(`logApi.get: Usando rota de resumo de estudante para ${metric}`);
            // Para estudante, usamos a rota filtered que é POST
            // Adiciona suporte para parâmetros adicionais
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
    // Modo de comparação - usando as novas APIs de comparação
    else if (mode === "comparison") {
      try {
        console.log(`logApi.get: Usando novas rotas de comparação para ${entity}`);

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
                totalUsageTime: entity1.usageTimeInSeconds || 0, usageTime: entity1.usageTime || {},
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

export default {
  academicApi,
  // publicApi,
  adminApi,
  professorApi,
  coordinatorApi,
  rasaApi,
  logApi
};