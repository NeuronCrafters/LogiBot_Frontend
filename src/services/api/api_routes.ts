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

export type LogMetricType =
  | "accuracy"
  | "usage"
  | "subjects";

export type LogModeType =
  | "individual"
  | "comparison";

export const ACADEMIC_ROUTES: Record<
  AcademicEntityType,
  { post: string; get: string; delete: string }
> = {
  university: {
    post: "/academic-institution/university",
    get: "/academic-institution/university",
    delete: "/academic-institution/university",
  },
  course: {
    post: "/academic-institution/course",
    get: "/academic-institution/course",
    delete: "/academic-institution/course",
  },
  class: {
    post: "/academic-institution/class",
    get: "/academic-institution/class",
    delete: "/academic-institution/class",
  },
  discipline: {
    post: "/academic-institution/discipline",
    get: "/academic-institution/discipline",
    delete: "/academic-institution/discipline",
  },
};

// export const PUBLIC_ROUTES = {
//   institutions: "/public/institutions",
//   courses: "/public/courses",
//   disciplines: "/public/disciplines",
//   classes: "/public/classes",
//   professors: "/public/professors",
//   studentsByClass: "/public/students/by-class",
//   studentsByDiscipline: "/public/students/by-discipline",
//   studentsByCourse: "/public/students/by-course",
// };

export const RASA_ROUTES = {
  talk: "/sael/talk",
  listarNiveis: "/sael/action/listar_niveis",
  definirNivel: "/sael/action/definir_nivel",
  listarOpcoes: "/sael/action/listar_opcoes",
  listarSubopcoes: "/sael/action/listar_subopcoes",
  gerarPerguntas: "/sael/action/gerar_perguntas",
  getGabarito: "/sael/action/gabarito",
  verificarRespostas: "/sael/action/send",
  actionConversar: "/sael/action/conversar",
  actionPerguntar: "/sael/action/perguntar",
};

export const ADMIN_ROUTES = {
  createProfessor: "/admin/professor",
  deleteProfessor: "/admin/professor/:professorId",
  listAllProfessors: "/admin/professors",
  listProfessorsByUniversity: "/admin/university/:schoolId/professors",
  listProfessorsByCourse: "/admin/course/:courseId/professors",
  updateProfessorRole: "/admin/professor/:id/role",
  listStudents: "/admin/students",
} as const;

export const PROFESSOR_ROUTES = {
  listMyStudents: "/admin/professor/students",
} as const;

export const COORDINATOR_ROUTES = {
  listMyProfessors: "/admin/coordinator/professors",
  listMyStudents: "/admin/coordinator/students",
  listStudentsByDiscipline:
    "/admin/coordinator/students/discipline/:disciplineId",
  listDisciplines: "/admin/coordinator/disciplines",
  listClasses: "/admin/coordinator/classes",
} as const;

export const LOG_ROUTES = {
  student: {
    accuracy: (id: string) => `/logs/student/${id}/accuracy`,
    usage: (id: string) => `/logs/student/${id}/usage`,
    subjects: (id: string) => `/logs/student/${id}/subjects/summary`,
    compare: {
      accuracy: `/logs/student/compare/accuracy`,
      usage: `/logs/student/compare/usage`,
      subjects: `/logs/student/compare/subjects/summary`,
    },
  },
  class: {
    accuracy: (id: string) => `/logs/class/${id}/accuracy`,
    usage: (id: string) => `/logs/class/${id}/usage`,
    subjects: (id: string) => `/logs/class/${id}/subjects/summary`,
    compare: {
      accuracy: `/logs/class/compare/accuracy`,
      usage: `/logs/class/compare/usage`,
      subjects: `/logs/class/compare/subjects/summary`,
    },
  },
  course: {
    accuracy: (id: string) => `/logs/course/${id}/accuracy`,
    usage: (id: string) => `/logs/course/${id}/usage`,
    subjects: (id: string) => `/logs/course/${id}/subjects/summary`,
    compare: {
      accuracy: `/logs/course/compare/accuracy`,
      usage: `/logs/course/compare/usage`,
      subjects: `/logs/course/compare/subjects/summary`,
    },
  },
  discipline: {
    accuracy: (id: string) => `/logs/discipline/${id}/accuracy`,
    usage: (id: string) => `/logs/discipline/${id}/usage`,
    subjects: (id: string) => `/logs/discipline/${id}/subjects/summary`,
    compare: {
      accuracy: `/logs/discipline/compare/accuracy`,
      usage: `/logs/discipline/compare/usage`,
      subjects: `/logs/discipline/compare/subjects/summary`,
    },
  },
  university: {
    accuracy: (id: string) => `/logs/university/${id}/accuracy`,
    usage: (id: string) => `/logs/university/${id}/usage`,
    subjects: (id: string) => `/logs/university/${id}/subjects/summary`,
    compare: {
      accuracy: `/logs/university/compare/accuracy`,
      usage: `/logs/university/compare/usage`,
      subjects: `/logs/university/compare/subjects/summary`,
    },
  },
  summary: {
    university: (id: string) => `/logs/university/${id}/summary`,
    course: (id: string) => `/logs/course/${id}/summary`,
    class: (id: string) => `/logs/class/${id}/summary`,
    filteredStudent: `/logs/student/summary/filtered`,
  },
  comparison: {
    universities: `/logs/comparison/universities`,
    courses: `/logs/comparison/courses`,
    classes: `/logs/comparison/classes`,
    students: `/logs/comparison/students`,
  }
} as const;

export const USER_ANALYSIS_ROUTES = {
  addInteraction: "/useranalysis/interaction",
} as const;
