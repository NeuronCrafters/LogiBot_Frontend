import { api } from "@/services/api/api";
import {
  ACADEMIC_ROUTES,
  RASA_ROUTES,
  ADMIN_ROUTES,
  PROFESSOR_ROUTES,
  COORDINATOR_ROUTES,
  LOG_ROUTES,
  AcademicEntityType,
  // LogEntityType,
  // LogMetricType,
  // LogModeType
} from "./api/api_routes";
import { academicFiltersApi } from "./api/api_academicFilters";

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


// --------------
// AcademicFilter routes
// --------------
export { academicFiltersApi };


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

  // listStudentsByClass: (
  //   classId: string,
  //   courseId?: string,
  // ): Promise<Array<{
  //   id: any;
  //   code: any; _id: string; name: string; email: string
  // }>> => {
  //   const base = ADMIN_ROUTES.listStudentsByClass.replace(":classId", classId);
  //   const url = courseId ? `${base}?courseId=${courseId}` : base;
  //   return getRequest(url);
  // },

  listStudentsByClass: (
    classId: string,
    courseId?: string,
    disciplineId?: string
  ): Promise<Array<{
    id: any;
    code: any; _id: string; name: string; email: string
  }>> => {
    const base = ADMIN_ROUTES.listStudentsByClass.replace(":classId", classId);

    const params = new URLSearchParams();

    if (courseId) params.append("courseId", courseId);
    if (disciplineId) params.append("disciplineId", disciplineId);

    const queryString = params.toString();
    const url = queryString ? `${base}?${queryString}` : base;

    return getRequest(url);
  },

  deleteStudent: <T>(studentId: string): Promise<T> =>
    deleteRequest<T>(`${ADMIN_ROUTES.deleteStudent}?studentId=${studentId}`),
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

// --------------
// Logs
// --------------
export const logApi = {
  getUniversitySummary: <T>(id: string) =>
    getRequest<T>(LOG_ROUTES.summary.university(id)),

  getCourseSummary: <T>(id: string) =>
    getRequest<T>(LOG_ROUTES.summary.course(id)),

  getClassSummary: <T>(id: string) =>
    getRequest<T>(LOG_ROUTES.summary.class(id)),

  getDisciplineSummary: <T>(id: string) =>
    getRequest<T>(LOG_ROUTES.summary.discipline(id)),

  getFilteredStudentSummary: <T>(body: FilteredStudentSummaryParams) =>
    postRequest<T>(LOG_ROUTES.summary.filteredStudent, body),

  getStudentAccuracy: <T>(id: string) =>
    getRequest<T>(LOG_ROUTES.student.accuracy(id)),

  getStudentUsage: <T>(id: string) =>
    getRequest<T>(LOG_ROUTES.student.usage(id)),

  getStudentSubjects: <T>(id: string) =>
    getRequest<T>(LOG_ROUTES.student.subjects(id)),

  getClassAccuracy: <T>(id: string) =>
    getRequest<T>(LOG_ROUTES.class.accuracy(id)),

  getClassUsage: <T>(id: string) =>
    getRequest<T>(LOG_ROUTES.class.usage(id)),

  getClassSubjects: <T>(id: string) =>
    getRequest<T>(LOG_ROUTES.class.subjects(id)),

  getCourseAccuracy: <T>(id: string) =>
    getRequest<T>(LOG_ROUTES.course.accuracy(id)),

  getCourseUsage: <T>(id: string) =>
    getRequest<T>(LOG_ROUTES.course.usage(id)),

  getCourseSubjects: <T>(id: string) =>
    getRequest<T>(LOG_ROUTES.course.subjects(id)),

  getDisciplineAccuracy: <T>(id: string) =>
    getRequest<T>(LOG_ROUTES.discipline.accuracy(id)),

  getDisciplineUsage: <T>(id: string) =>
    getRequest<T>(LOG_ROUTES.discipline.usage(id)),

  getDisciplineSubjects: <T>(id: string) =>
    getRequest<T>(LOG_ROUTES.discipline.subjects(id)),

  getUniversityAccuracy: <T>(id: string) =>
    getRequest<T>(LOG_ROUTES.university.accuracy(id)),

  getUniversityUsage: <T>(id: string) =>
    getRequest<T>(LOG_ROUTES.university.usage(id)),

  getUniversitySubjects: <T>(id: string) =>
    getRequest<T>(LOG_ROUTES.university.subjects(id)),
};



export default {
  academicApi,
  academicFiltersApi,
  adminApi,
  professorApi,
  coordinatorApi,
  rasaApi,
  logApi
};