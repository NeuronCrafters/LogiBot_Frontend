export type AcademicEntityType =
  | "university"
  | "course"
  | "class"
  | "discipline";

export type LogEntityType =
  | "student"
  | "class"
  | "course"
  | "discipline"
  | "university";

export type LogMetricType = "accuracy" | "usage" | "subjects";

export type LogModeType = "individual" | "comparison";

export const ACADEMIC_ROUTES: Record<
  AcademicEntityType,
  { post: string; get: string; delete: string; patch: string }
> = {
  university: {
    post: "/academic/universities",
    get: "/academic/universities",
    delete: "/academic/universities",
    patch: "/academic/universities",
  },
  course: {
    post: "/academic/courses",
    get: "/academic/universities",
    delete: "/academic/courses",
    patch: "/academic/courses",
  },
  class: {
    post: "/academic/classes",
    get: "/academic/courses",
    delete: "/academic/classes",
    patch: "/academic/classes",
  },
  discipline: {
    post: "/academic/disciplines",
    get: "/academic/disciplines",
    delete: "/academic/disciplines",
    patch: "/academic/disciplines",
  },
};

export const DISCIPLINE_PROFESSOR_ROUTES = {
  attach: "/academic/disciplines/:disciplineId/professors",
  detach: "/academic/disciplines/:disciplineId/professors/:professorId",
} as const;

export const CLASS_DISCIPLINE_ROUTES = {
  attach: "/academic/classes/:classId/disciplines",
  detach: "/academic/classes/:classId/disciplines/:disciplineId",
  regenerateCode: "/academic/classes/:classId/registration-code",
} as const;

export const ACADEMICFILTER_ROUTES = {
  academicData: "/academic/filters",
};

export const RASA_ROUTES = {
  talk: "/chat/messages",
  listarNiveis: "/quiz/levels",
  definirNivel: "/quiz/level",
  listarOpcoes: "/quiz/categories",
  listarSubopcoes: "/quiz/subcategories",
  gerarPerguntas: "/quiz/questions",
  getGabarito: "/quiz/answer-key",
  verificarRespostas: "/quiz/answers",
  actionConversar: "/chat/messages",
  actionPerguntar: "/chat/messages",
};

export const ADMIN_ROUTES = {
  createProfessor: "/admin/professors",
  deleteProfessor: "/admin/professors/:professorId",
  updateProfessor: "/admin/professors/:professorId",
  listAllProfessors: "/admin/professors",
  listProfessorsByUniversity: "/admin/universities/:schoolId/professors",
  listProfessorsByCourse: "/admin/courses/:courseId/professors",
  updateProfessorRole: "/admin/professors/:id/role",
  listStudents: "/admin/students",
  listStudentsByClass: "/admin/classes/:classId/students",
  deleteStudent: "/admin/students/:studentId",
} as const;

export const PROFESSOR_ROUTES = {
  listMyStudents: "/admin/professor-students",
} as const;

export const COORDINATOR_ROUTES = {
  listMyProfessors: "/admin/coordinator/professors",
  listMyStudents: "/admin/coordinator/students",
  listStudentsByDiscipline:
    "/admin/coordinator/disciplines/:disciplineId/students",
  listDisciplines: "/admin/coordinator/disciplines",
  listClasses: "/admin/coordinator/classes",
} as const;

export const LOG_ROUTES = {
  student: {
    accuracy: (id: string) => `/logs/students/${id}/accuracy`,
    usage: (id: string) => `/logs/students/${id}/usage`,
    subjects: (id: string) => `/logs/students/${id}/subjects/summary`,
  },
  class: {
    accuracy: (id: string) => `/logs/classes/${id}/accuracy`,
    usage: (id: string) => `/logs/classes/${id}/usage`,
    subjects: (id: string) => `/logs/classes/${id}/subjects/summary`,
  },
  course: {
    accuracy: (id: string) => `/logs/courses/${id}/accuracy`,
    usage: (id: string) => `/logs/courses/${id}/usage`,
    subjects: (id: string) => `/logs/courses/${id}/subjects/summary`,
  },
  discipline: {
    accuracy: (id: string) => `/logs/disciplines/${id}/accuracy`,
    usage: (id: string) => `/logs/disciplines/${id}/usage`,
    subjects: (id: string) => `/logs/disciplines/${id}/subjects/summary`,
  },
  university: {
    accuracy: (id: string) => `/logs/universities/${id}/accuracy`,
    usage: (id: string) => `/logs/universities/${id}/usage`,
    subjects: (id: string) => `/logs/universities/${id}/subjects/summary`,
  },
  summary: {
    university: (id: string) => `/logs/universities/${id}/summary`,
    course: (id: string) => `/logs/courses/${id}/summary`,
    class: (id: string) => `/logs/classes/${id}/summary`,
    discipline: (id: string) => `/logs/disciplines/${id}/summary`,
    filteredStudent: `/logs/students/summary`,
  },
} as const;

export const PROFESSOR_LOG_ROUTES = {
  listStudentsByDiscipline: (disciplineId: string) =>
    `/logs/professor/students?disciplineId=${disciplineId}`,
  getStudentDetails: (studentId: string, disciplineId: string) =>
    `/logs/professor/students/${studentId}?disciplineId=${disciplineId}`,
} as const;

export const USER_ANALYSIS_ROUTES = {
  addInteraction: "/analytics/interaction",
  addSubjectClicks: "/analytics/subject-clicks",
} as const;
