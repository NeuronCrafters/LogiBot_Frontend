export type AcademicEntityType =
  | "university"
  | "course"
  | "class"
  | "discipline";

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
  }
};

export const PUBLIC_ROUTES = {
  institutions: "/public/institutions",
  courses: "/public/courses",
  disciplines: "/public/disciplines",
  classes: "/public/classes",
  professors: "/public/professors",
  studentsByClass: "/public/students/by-class",
  studentsByDiscipline: "/public/students/by-discipline",
  studentsByCourse: "/public/students/by-course",
};

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
