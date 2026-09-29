import type {
  AcademicDataResponse,
  Class,
  Course,
  Discipline,
  Professor,
  Student,
  University,
} from "@/features/academic/api/academicFiltersApi";
import {
  CLASS_A_ID,
  CLASS_B_ID,
  COURSE_ID,
  DISC_ESTRUTURAS_ID,
  DISC_LOGICA_ID,
  PROFESSOR_ID,
  STUDENT_USER_ID,
  UNIVERSITY_ID,
} from "./ids";

export const CLASS_A_REGISTRATION_CODE = "LOGI-7F3K2Q";
export const CLASS_B_REGISTRATION_CODE = "LOGI-9B1M4X";

export const professor: Professor = {
  _id: PROFESSOR_ID,
  name: "Marcus Teixeira",
  email: "admin@logibot.dev",
  role: ["professor"],
};

const classAStudents: Student[] = [
  {
    _id: STUDENT_USER_ID,
    name: "Ana Beatriz Souza",
    email: "aluno@logibot.dev",
    status: "active",
  },
  { _id: "student-2", name: "Bruno Carvalho Lima", email: "bruno.lima@logibot.dev", status: "active" },
  { _id: "student-3", name: "Camila Ferreira Dias", email: "camila.dias@logibot.dev", status: "active" },
  { _id: "student-4", name: "Diego Martins Rocha", email: "diego.rocha@logibot.dev", status: "active" },
  { _id: "student-5", name: "Elisa Nogueira Pinto", email: "elisa.pinto@logibot.dev", status: "active" },
  { _id: "student-6", name: "Felipe Andrade Costa", email: "felipe.costa@logibot.dev", status: "dropped" },
];

const classBStudents: Student[] = [
  { _id: "student-7", name: "Gabriela Ramos Alves", email: "gabriela.alves@logibot.dev", status: "active" },
  { _id: "student-8", name: "Henrique Souza Melo", email: "henrique.melo@logibot.dev", status: "active" },
  { _id: "student-9", name: "Isabela Cristina Farias", email: "isabela.farias@logibot.dev", status: "graduated" },
  { _id: "student-10", name: "João Pedro Almeida", email: "joao.almeida@logibot.dev", status: "active" },
];

function dedupeStudents(students: Student[]): Student[] {
  const seen = new Set<string>();
  return students.filter((s) => (seen.has(s._id) ? false : (seen.add(s._id), true)));
}

const classA: Class = {
  _id: CLASS_A_ID,
  name: "Turma A - Lógica de Programação 2026.1",
  disciplines: [
    { _id: DISC_LOGICA_ID, name: "Lógica de Programação" },
    { _id: DISC_ESTRUTURAS_ID, name: "Estrutura de Dados" },
  ],
  students: classAStudents,
  registrationCode: CLASS_A_REGISTRATION_CODE,
};

const classB: Class = {
  _id: CLASS_B_ID,
  name: "Turma B - Lógica de Programação 2026.1",
  disciplines: [{ _id: DISC_LOGICA_ID, name: "Lógica de Programação" }],
  students: classBStudents,
  registrationCode: CLASS_B_REGISTRATION_CODE,
};

const disciplineLogica: Discipline = {
  _id: DISC_LOGICA_ID,
  name: "Lógica de Programação",
  classes: [
    { _id: CLASS_A_ID, name: classA.name },
    { _id: CLASS_B_ID, name: classB.name },
  ],
  professors: [professor],
  students: dedupeStudents([...classAStudents, ...classBStudents]),
};

const disciplineEstruturas: Discipline = {
  _id: DISC_ESTRUTURAS_ID,
  name: "Estrutura de Dados",
  classes: [{ _id: CLASS_A_ID, name: classA.name }],
  professors: [professor],
  students: classAStudents,
};

const course: Course = {
  _id: COURSE_ID,
  name: "Engenharia de Software",
  classes: [classA, classB],
  disciplines: [disciplineLogica, disciplineEstruturas],
  professors: [professor],
  students: dedupeStudents([...classAStudents, ...classBStudents]),
};

const university: University = {
  _id: UNIVERSITY_ID,
  name: "Universidade Federal de Tecnologia",
  courses: [course],
};

export const academicDataResponse: AcademicDataResponse = {
  success: true,
  data: { universities: [university] },
  summary: {
    universities: 1,
    courses: 1,
    classes: 2,
    disciplines: 2,
    professors: 1,
    students: course.students.length,
  },
  user: {
    _id: PROFESSOR_ID,
    name: professor.name,
    email: professor.email,
    role: ["admin"],
  },
  meta: { timestamp: new Date().toISOString(), version: "mock" },
};

export const allStudents: Student[] = course.students;
export const allProfessors: Professor[] = [professor];
export { classA, classB, disciplineLogica, disciplineEstruturas, course, university };
