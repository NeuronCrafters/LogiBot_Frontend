import { api } from "@/services/api/api";
import {
  ACADEMIC_ROUTES,
  PUBLIC_ROUTES,
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
export const publicApi = {
  getInstitutions: <T>() => getRequest<T>(PUBLIC_ROUTES.institutions),
  getCourses: <T>(universityId: string) =>
    getRequest<T>(`${PUBLIC_ROUTES.courses}/${universityId}`),
  getDisciplines: <T>(u: string, c: string) =>
    getRequest<T>(`${PUBLIC_ROUTES.disciplines}/${u}/${c}`),
  getClasses: <T>(u: string, c: string) =>
    getRequest<T>(`${PUBLIC_ROUTES.classes}/${u}/${c}`),
  getProfessors: <T>(u: string, c?: string) =>
    getRequest<T>(
      c
        ? `${PUBLIC_ROUTES.professors}/${u}/${c}`
        : `${PUBLIC_ROUTES.professors}/${u}`
    ),
  getStudentsByClass: <T>(u: string, c: string, t: string) =>
    getRequest<T>(`${PUBLIC_ROUTES.studentsByClass}/${u}/${c}/${t}`),
  getStudentsByDiscipline: <T>(u: string, c: string, d: string) =>
    getRequest<T>(`${PUBLIC_ROUTES.studentsByDiscipline}/${u}/${c}/${d}`),
  getStudentsByCourse: <T>(u: string, c: string) =>
    getRequest<T>(`${PUBLIC_ROUTES.studentsByCourse}/${u}/${c}`),

  // !ROTAS DE TESTE
  getStudentById: <T>(id: string) => getRequest<T>(`/public/student/${id}`),
  getClassById: <T>(id: string) => getRequest<T>(`/public/class/${id}`),
  getCourseById: <T>(id: string) => getRequest<T>(`/public/course/${id}`),
  getDisciplineById: <T>(id: string) => getRequest<T>(`/public/discipline/${id}`),
  getUniversityById: <T>(id: string) => getRequest<T>(`/public/university/${id}`),
};

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

// --------------
// Logs
// --------------
export const logApi = {
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

    // Para modo individual
    if (mode === "individual") {
      const id = idOrIds as string;

      // Caso especial para dados adaptados - mapeando métricas para as rotas de resumo disponíveis
      if (metric === "accuracy" || metric === "usage" || metric === "subjects") {
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
            return {
              subjectFrequency: response.mostAccessedSubjects?.reduce((acc: Record<string, number>, item: any) => {
                acc[item.subject] = item.count;
                return acc;
              }, {}) || {},
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

      console.error(`logApi.get: Rota específica para ${entity}/${metric} não implementada`);
      throw new Error(`Rota específica para ${entity}/${metric} não implementada`);
    }
    // Para modo de comparação
    else {
      try {
        console.log(`logApi.get: Modo de comparação ainda não suportado completamente`);
        // Vamos adaptar a comparação também usando as rotas de resumo
        if (Array.isArray(idOrIds) && idOrIds.length > 0) {
          // Para simplificar, vamos buscar dados de cada ID individualmente e formatá-los para comparação
          const results = await Promise.all(idOrIds.map(async (id) => {
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
                return null;
            }

            return { id, ...response };
          }));

          const validResults = results.filter(Boolean);
          console.log(`logApi.get: Resultados de comparação:`, validResults);

          return validResults as unknown as T;
        }

        return [] as unknown as T;
      } catch (error) {
        console.error(`logApi.get: Erro no modo de comparação para ${entity}/${metric}:`, error);
        throw error;
      }
    }
  },
};