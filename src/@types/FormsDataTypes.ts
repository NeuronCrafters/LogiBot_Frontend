export interface UniversityData {
  id?: string | number;
  name: string;
}

export interface CourseData {
  id?: string | number;
  name: string;
  universityId: string;
}

export interface ProfessorData {
  id?: string | number;
  name: string;
  email: string;
  universityId: string;
  courseId?: string;
}

export interface ClassData {
  id?: string | number;
  name: string;
  courseId: string;
}

export interface DisciplineData {
  id?: string | number;
  name: string;
  courseId: string;
  classIds: string[];
  professorIds: string[];
}
