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
// export const logApi = {
//   get: <T>(entity: LogEntityType, metric: LogMetricType, mode: LogModeType, idOrIds: string | string[]): Promise<T> => {
//     if (mode === "individual") {
//       const route = LOG_ROUTES[entity][metric](idOrIds as string);
//       return getRequest<T>(route);
//     } else {
//       const route = LOG_ROUTES[entity].compare[metric];
//       return postRequest<T>(route, { ids: idOrIds });
//     }
//   },
// };

export const logApi = {
  get: <T>(entity: LogEntityType, metric: LogMetricType, mode: LogModeType, idOrIds: string | string[]): Promise<T> => {
    if (mode === "individual") {
      const route = LOG_ROUTES[entity][metric](idOrIds as string);
      return getRequest<T>(route);
    } else {
      const route = LOG_ROUTES[entity].compare[metric];
      return postRequest<T>(route, { ids: idOrIds });
    }
  },
};
