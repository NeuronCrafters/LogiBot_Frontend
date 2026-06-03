import { api } from "@/shared/api/httpClient";

// ─── Entity types (mirror what buildAcademicFilters returns) ────────────────

export interface BasicInfo {
  _id: string;
  name: string;
  code?: string;
}

export interface Student {
  _id: string;
  name: string;
  email: string;
  status: "active" | "graduated" | "dropped";
  photo?: string;
  level?: string;
}

export interface Professor {
  _id: string;
  name: string;
  email: string;
  role: string[];
  photo?: string;
}

export interface Class {
  _id: string;
  name: string;
  disciplines: BasicInfo[];
  students: Student[];
  code?: string;
}

export interface Discipline {
  _id: string;
  name: string;
  code: string;
  classes: BasicInfo[];
  professors: Professor[];
  students: Student[];
}

export interface Course {
  _id: string;
  name: string;
  classes: Class[];
  disciplines: Discipline[];
  professors: Professor[];
  students: Student[];
}

export interface University {
  _id: string;
  name: string;
  courses: Course[];
}

// ─── Response envelope (matches backend academicFiltersService exactly) ─────

export interface DataSummary {
  universities: number;
  courses: number;
  classes: number;
  disciplines: number;
  professors: number;
  students: number;
}

export interface AcademicDataResponse {
  success: boolean;
  data: { universities: University[] };
  summary: DataSummary;
  user: { _id: string; name: string; email: string; role: string[] };
  meta: { timestamp: string; version: string };
}

// ─── HTTP helper ─────────────────────────────────────────────────────────────

const getRequest = async <T>(url: string): Promise<T> => {
  const response = await api.get<T>(url, { withCredentials: true });
  return response.data;
};

// ─── API ─────────────────────────────────────────────────────────────────────

export const academicFiltersApi = {
  getAcademicData: (): Promise<AcademicDataResponse> =>
    getRequest<AcademicDataResponse>("/academic/filters"),

  // ── Convenience getters (all derived from the single cached endpoint) ───

  getUniversities: async (): Promise<University[]> => {
    const res = await academicFiltersApi.getAcademicData();
    return res.data.universities;
  },

  getCourses: async (universityId: string): Promise<Course[]> => {
    const res = await academicFiltersApi.getAcademicData();
    return res.data.universities.find((u) => u._id === universityId)?.courses ?? [];
  },

  getClasses: async (universityId: string, courseId: string): Promise<Class[]> => {
    const res = await academicFiltersApi.getAcademicData();
    const uni = res.data.universities.find((u) => u._id === universityId);
    return uni?.courses.find((c) => c._id === courseId)?.classes ?? [];
  },

  getDisciplines: async (universityId: string, courseId: string): Promise<Discipline[]> => {
    const res = await academicFiltersApi.getAcademicData();
    const uni = res.data.universities.find((u) => u._id === universityId);
    return uni?.courses.find((c) => c._id === courseId)?.disciplines ?? [];
  },

  getProfessors: async (universityId: string, courseId?: string): Promise<Professor[]> => {
    const res = await academicFiltersApi.getAcademicData();
    const uni = res.data.universities.find((u) => u._id === universityId);
    if (!uni) return [];
    if (courseId) return uni.courses.find((c) => c._id === courseId)?.professors ?? [];
    const seen = new Set<string>();
    return uni.courses.flatMap((c) => c.professors).filter((p) => {
      if (seen.has(p._id)) return false;
      seen.add(p._id);
      return true;
    });
  },

  getStudentsByClass: async (universityId: string, courseId: string, classId: string): Promise<Student[]> => {
    const res = await academicFiltersApi.getAcademicData();
    const uni = res.data.universities.find((u) => u._id === universityId);
    const course = uni?.courses.find((c) => c._id === courseId);
    return course?.classes.find((cl) => cl._id === classId)?.students ?? [];
  },

  getStudentsByDiscipline: async (universityId: string, courseId: string, disciplineId: string): Promise<Student[]> => {
    const res = await academicFiltersApi.getAcademicData();
    const uni = res.data.universities.find((u) => u._id === universityId);
    const course = uni?.courses.find((c) => c._id === courseId);
    return course?.disciplines.find((d) => d._id === disciplineId)?.students ?? [];
  },

  getStudentsByCourse: async (universityId: string, courseId: string): Promise<Student[]> => {
    const res = await academicFiltersApi.getAcademicData();
    const uni = res.data.universities.find((u) => u._id === universityId);
    return uni?.courses.find((c) => c._id === courseId)?.students ?? [];
  },

  getSummary: async (): Promise<DataSummary> => {
    const res = await academicFiltersApi.getAcademicData();
    return res.summary;
  },

  // ── Find-by-ID helpers ───────────────────────────────────────────────────

  findUniversityById: async (id: string): Promise<University | null> => {
    const res = await academicFiltersApi.getAcademicData();
    return res.data.universities.find((u) => u._id === id) ?? null;
  },

  findCourseById: async (id: string): Promise<Course | null> => {
    const res = await academicFiltersApi.getAcademicData();
    for (const uni of res.data.universities) {
      const course = uni.courses.find((c) => c._id === id);
      if (course) return course;
    }
    return null;
  },

  findClassById: async (id: string): Promise<Class | null> => {
    const res = await academicFiltersApi.getAcademicData();
    for (const uni of res.data.universities)
      for (const course of uni.courses) {
        const cls = course.classes.find((c) => c._id === id);
        if (cls) return cls;
      }
    return null;
  },

  findDisciplineById: async (id: string): Promise<Discipline | null> => {
    const res = await academicFiltersApi.getAcademicData();
    for (const uni of res.data.universities)
      for (const course of uni.courses) {
        const disc = course.disciplines.find((d) => d._id === id);
        if (disc) return disc;
      }
    return null;
  },

  findProfessorById: async (id: string): Promise<Professor | null> => {
    const res = await academicFiltersApi.getAcademicData();
    for (const uni of res.data.universities)
      for (const course of uni.courses) {
        const prof = course.professors.find((p) => p._id === id);
        if (prof) return prof;
      }
    return null;
  },

  findStudentById: async (id: string): Promise<Student | null> => {
    const res = await academicFiltersApi.getAcademicData();
    for (const uni of res.data.universities)
      for (const course of uni.courses) {
        const s = course.students.find((st) => st._id === id);
        if (s) return s;
        for (const cls of course.classes) {
          const cs = cls.students.find((st) => st._id === id);
          if (cs) return cs;
        }
      }
    return null;
  },
};
