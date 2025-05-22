import { api } from "@/services/api/api";
import { ACADEMICFILTER_ROUTES } from './api_routes';

export interface AcademicDataResponse {
  success: boolean;
  data: {
    universities: University[];
  };
  summary: DataSummary;
  user: UserInfo;
  meta: ResponseMeta;
}

export interface University {
  _id: string;
  name: string;
  courses: Course[];
}

export interface Course {
  _id: string;
  name: string;
  classes: Class[];
  disciplines: Discipline[];
  professors: Professor[];
  students: Student[];
}

export interface Class {
  _id: string;
  name: string;
  disciplines: BasicInfo[];
  students: Student[];
}

export interface Discipline {
  _id: string;
  name: string;
  code: string;
  classes: BasicInfo[];
  professors: Professor[];
  students: StudentWithClass[];
}

export interface Professor {
  _id: string;
  name: string;
  email: string;
  role: string[];
  photo?: string;
  disciplines?: BasicInfo[];
}

export interface Student {
  _id: string;
  name: string;
  email: string;
  status: 'active' | 'graduated' | 'dropped';
  photo?: string;
  level?: string;
}

export interface StudentWithClass extends Student {
  class: BasicInfo;
  disciplines?: BasicInfo[];
}

export interface BasicInfo {
  _id: string;
  name: string;
  code?: string;
}

export interface DataSummary {
  universities: number;
  courses: number;
  classes: number;
  disciplines: number;
  professors: number;
  students: number;
  userLevel: 'ADMIN' | 'COORDINATOR' | 'PROFESSOR';
}

export interface UserInfo {
  _id: string;
  name: string;
  email: string;
  role: string[];
  permissions: UserPermissions;
  accessLevel: string;
  context: {
    school: string;
    course?: string;
    disciplines: number;
  };
}

export interface UserPermissions {
  canViewAllUniversities: boolean;
  canViewAllCourses: boolean;
  canViewOwnCourse: boolean;
  canViewClasses: boolean;
  canViewDisciplines: boolean;
  canViewStudents: boolean;
  canViewProfessors: boolean;
  canViewAnalytics: boolean;
  canExportData: boolean;
  // Permissões de gestão
  canCreateCourse: boolean;
  canEditCourse: boolean;
  canCreateClass: boolean;
  canEditClass: boolean;
  canCreateDiscipline: boolean;
  canEditDiscipline: boolean;
  canManageStudents: boolean;
  canManageProfessors: boolean;
  canAssignProfessors: boolean;
  canManageEnrollments: boolean;
  // Permissões de relatórios
  canGenerateReports: boolean;
  canViewDetailedAnalytics: boolean;
  canExportStudentData: boolean;
  // Permissões específicas de professor
  canViewOwnDisciplines: boolean;
  canManageOwnDisciplineStudents: boolean;
  canViewStudentProgress: boolean;
}

export interface ResponseMeta {
  timestamp: string;
  version: string;
  source: string;
}

// ============================================
// HELPER DE REQUISIÇÃO
// ============================================

const getRequest = async <T>(url: string): Promise<T> => {
  const response = await api.get<T>(url, { withCredentials: true });
  return response.data;
};

// ============================================
// API CLIENT PRINCIPAL
// ============================================

export const academicFiltersApi = {
  // Função principal - busca todos os dados de uma vez
  getAcademicData: (): Promise<AcademicDataResponse> =>
    getRequest<AcademicDataResponse>(ACADEMICFILTER_ROUTES.academicData),

  // ============================================
  // HELPERS PARA FILTRAR DADOS LOCALMENTE
  // ============================================

  // Universidades (direto dos dados carregados)
  getUniversities: async (): Promise<University[]> => {
    const response = await academicFiltersApi.getAcademicData();
    return response.data.universities;
  },

  // Cursos por universidade (filtro local)
  getCourses: async (universityId: string): Promise<Course[]> => {
    const response = await academicFiltersApi.getAcademicData();
    const university = response.data.universities.find(u => u._id === universityId);
    return university?.courses || [];
  },

  // Turmas por curso (filtro local)
  getClasses: async (universityId: string, courseId: string): Promise<Class[]> => {
    const response = await academicFiltersApi.getAcademicData();
    const university = response.data.universities.find(u => u._id === universityId);
    const course = university?.courses.find(c => c._id === courseId);
    return course?.classes || [];
  },

  // Disciplinas por curso (filtro local)
  getDisciplines: async (universityId: string, courseId: string): Promise<Discipline[]> => {
    const response = await academicFiltersApi.getAcademicData();
    const university = response.data.universities.find(u => u._id === universityId);
    const course = university?.courses.find(c => c._id === courseId);
    return course?.disciplines || [];
  },

  // Professores por universidade/curso (filtro local)
  getProfessors: async (universityId: string, courseId?: string): Promise<Professor[]> => {
    const response = await academicFiltersApi.getAcademicData();
    const university = response.data.universities.find(u => u._id === universityId);

    if (courseId) {
      const course = university?.courses.find(c => c._id === courseId);
      return course?.professors || [];
    }

    // Todos os professores da universidade
    const allProfessors: Professor[] = [];
    university?.courses.forEach(course => {
      allProfessors.push(...course.professors);
    });

    // Remove duplicatas
    return allProfessors.filter((prof, index, self) =>
      self.findIndex(p => p._id === prof._id) === index
    );
  },

  // Estudantes por turma (filtro local)
  getStudentsByClass: async (universityId: string, courseId: string, classId: string): Promise<Student[]> => {
    const response = await academicFiltersApi.getAcademicData();
    const university = response.data.universities.find(u => u._id === universityId);
    const course = university?.courses.find(c => c._id === courseId);
    const classData = course?.classes.find(cl => cl._id === classId);
    return classData?.students || [];
  },

  // Estudantes por disciplina (filtro local)
  getStudentsByDiscipline: async (universityId: string, courseId: string, disciplineId: string): Promise<StudentWithClass[]> => {
    const response = await academicFiltersApi.getAcademicData();
    const university = response.data.universities.find(u => u._id === universityId);
    const course = university?.courses.find(c => c._id === courseId);
    const discipline = course?.disciplines.find(d => d._id === disciplineId);
    return discipline?.students || [];
  },

  // Estudantes por curso (filtro local)
  getStudentsByCourse: async (universityId: string, courseId: string): Promise<Student[]> => {
    const response = await academicFiltersApi.getAcademicData();
    const university = response.data.universities.find(u => u._id === universityId);
    const course = university?.courses.find(c => c._id === courseId);
    return course?.students || [];
  },

  // ============================================
  // BUSCA POR ID (FILTROS LOCAIS)
  // ============================================

  findUniversityById: async (id: string): Promise<University | null> => {
    const response = await academicFiltersApi.getAcademicData();
    return response.data.universities.find(u => u._id === id) || null;
  },

  findCourseById: async (id: string): Promise<Course | null> => {
    const response = await academicFiltersApi.getAcademicData();

    for (const university of response.data.universities) {
      const course = university.courses.find(c => c._id === id);
      if (course) return course;
    }
    return null;
  },

  findClassById: async (id: string): Promise<Class | null> => {
    const response = await academicFiltersApi.getAcademicData();

    for (const university of response.data.universities) {
      for (const course of university.courses) {
        const classData = course.classes.find(c => c._id === id);
        if (classData) return classData;
      }
    }
    return null;
  },

  findDisciplineById: async (id: string): Promise<Discipline | null> => {
    const response = await academicFiltersApi.getAcademicData();

    for (const university of response.data.universities) {
      for (const course of university.courses) {
        const discipline = course.disciplines.find(d => d._id === id);
        if (discipline) return discipline;
      }
    }
    return null;
  },

  findProfessorById: async (id: string): Promise<Professor | null> => {
    const response = await academicFiltersApi.getAcademicData();

    for (const university of response.data.universities) {
      for (const course of university.courses) {
        const professor = course.professors.find(p => p._id === id);
        if (professor) return professor;
      }
    }
    return null;
  },

  findStudentById: async (id: string): Promise<Student | null> => {
    const response = await academicFiltersApi.getAcademicData();

    for (const university of response.data.universities) {
      for (const course of university.courses) {
        // Busca em estudantes do curso
        const student = course.students.find(s => s._id === id);
        if (student) return student;

        // Busca em estudantes das turmas
        for (const classData of course.classes) {
          const classStudent = classData.students.find(s => s._id === id);
          if (classStudent) return classStudent;
        }

        // Busca em estudantes das disciplinas
        for (const discipline of course.disciplines) {
          const disciplineStudent = discipline.students.find(s => s._id === id);
          if (disciplineStudent) return disciplineStudent;
        }
      }
    }
    return null;
  },


  // Obter resumo dos dados
  getSummary: async (): Promise<DataSummary> => {
    const response = await academicFiltersApi.getAcademicData();
    return response.summary;
  },

  // Obter permissões do usuário
  getUserPermissions: async (): Promise<UserPermissions> => {
    const response = await academicFiltersApi.getAcademicData();
    return response.user.permissions;
  },

  // Obter contexto do usuário
  getUserContext: async (): Promise<UserInfo> => {
    const response = await academicFiltersApi.getAcademicData();
    return response.user;
  },

  // Verificar se usuário pode ver determinado recurso
  canUserView: async (resource: keyof UserPermissions): Promise<boolean> => {
    const response = await academicFiltersApi.getAcademicData();
    return response.user.permissions[resource];
  }
};