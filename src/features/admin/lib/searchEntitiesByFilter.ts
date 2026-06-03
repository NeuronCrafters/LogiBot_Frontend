import { coordinatorApi, professorApi, academicFiltersApi, adminApi } from "@/services/apiClient";
import { logger } from "@/shared/lib/logger";
import type { FilterData } from "@/features/dashboard/filterTypes";
import type { ListItem } from "@/features/admin/components/list/EntityTable";
import { toast } from "@/shared/lib/toast";

export type Role = "admin" | "course-coordinator" | "professor";

export type EntityType = "university" | "course" | "discipline" | "class" | "professor" | "student";

type ApiListResponse<T> = T[] | { data?: T[]; students?: T[] };
type RawStudent = {
  _id?: string;
  id?: string;
  name: string;
  email?: string;
  code?: string;
  course?: string;
  courseId?: string;
  disciplines?: Array<{ _id?: string; id?: string } | string>;
  classes?: string[];
};
type RawProfessor = {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role?: string | string[];
  course?: string;
  courseId?: string;
  courses?: string[];
};

function asArray<T>(value: ApiListResponse<T> | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.students)) return value.students;
  return [];
}

function itemId(item: { _id?: string; id?: string }) {
  return String(item._id || item.id || "");
}

function studentToListItem(student: RawStudent): ListItem {
  return {
    id: itemId(student),
    name: student.name,
    code: student.email || student.code,
    roles: ["Estudante"],
  };
}

function professorToListItem(professor: RawProfessor): ListItem {
  const rawRoles = Array.isArray(professor.role) ? professor.role : professor.role ? [professor.role] : ["professor"];
  return {
    id: itemId(professor),
    name: professor.name,
    code: professor.email,
    courseId: professor.course?.toString() || professor.courseId || professor.courses?.[0] || "",
    roles: rawRoles.map((role) => ({
      admin: "Administrador",
      professor: "Professor",
      "course-coordinator": "Coordenador de Curso",
      student: "Estudante",
    })[role] ?? role),
  };
}

function studentHasDiscipline(student: RawStudent, disciplineId: string) {
  return student.disciplines?.some((discipline) => {
    if (typeof discipline === "string") return discipline === disciplineId;
    return itemId(discipline) === disciplineId;
  }) ?? false;
}

export async function searchEntitiesByFilter(role: Role, filterData: FilterData): Promise<{ items: ListItem[]; entity: EntityType }> {
  try {
    let fetched: ListItem[] = [];
    let selectedEntity: EntityType = "student";

    if (role === "admin") {
      switch (filterData.filterType) {
        case "universities": {
          const academicData = await academicFiltersApi.getAcademicData();
          fetched = academicData.data.universities.map((i) => ({ id: i._id, name: i.name }));
          selectedEntity = "university";
          break;
        }
        case "courses": {
          if (!filterData.universityId) { toast.error("Universidade não selecionada"); return { items: [], entity: "student" }; }
          const academicData = await academicFiltersApi.getAcademicData();
          const university = academicData.data.universities.find((u) => u._id === filterData.universityId);
          if (!university) { toast.error("Universidade não encontrada"); return { items: [], entity: "student" }; }
          fetched = university.courses.map((c) => ({ id: c._id, name: c.name }));
          selectedEntity = "course";
          break;
        }
        case "disciplines": {
          if (!filterData.universityId || !filterData.courseId) { toast.error("Universidade e Curso obrigatórios"); return { items: [], entity: "student" }; }
          const academicData = await academicFiltersApi.getAcademicData();
          const university = academicData.data.universities.find((u) => u._id === filterData.universityId);
          const course = university?.courses.find((c) => c._id === filterData.courseId);
          if (!course) { toast.error("Curso não encontrado"); return { items: [], entity: "student" }; }
          fetched = course.disciplines.map((d) => ({ id: d._id, name: d.name, code: d.code }));
          selectedEntity = "discipline";
          break;
        }
        case "classes": {
          if (!filterData.universityId || !filterData.courseId) { toast.error("Universidade e Curso obrigatórios"); return { items: [], entity: "student" }; }
          const academicData = await academicFiltersApi.getAcademicData();
          const university = academicData.data.universities.find((u) => u._id === filterData.universityId);
          const course = university?.courses.find((c) => c._id === filterData.courseId);
          if (!course) { toast.error("Curso não encontrado"); return { items: [], entity: "student" }; }
          fetched = course.classes.map((c) => ({ id: c._id, name: c.name, classId: c._id }));
          selectedEntity = "class";
          break;
        }
        case "students":
        case "students-course":
        case "students-discipline": {
          let students = asArray<RawStudent>(await adminApi.listStudents<ApiListResponse<RawStudent>>());
          if (filterData.courseId) students = students.filter((s) => (s.course || s.courseId) === filterData.courseId);
          if (filterData.disciplineId) students = students.filter((s) => studentHasDiscipline(s, filterData.disciplineId!));
          fetched = students.map(studentToListItem);
          selectedEntity = "student";
          break;
        }
        case "students-class": {
          if (!filterData.classId) { toast.error("Selecione uma turma"); return { items: [], entity: "student" }; }
          const students = asArray<RawStudent>(await adminApi.listStudentsByClass(filterData.classId, filterData.courseId));
          fetched = students.map(studentToListItem);
          selectedEntity = "student";
          break;
        }
        case "professors": {
          if (!filterData.universityId) { toast.error("Universidade obrigatória"); return { items: [], entity: "student" }; }
          const professors = asArray<RawProfessor>(await adminApi.listProfessorsByUniversity<ApiListResponse<RawProfessor>>(filterData.universityId));
          fetched = professors.map(professorToListItem);
          selectedEntity = "professor";
          break;
        }
      }
    }

    if (role === "course-coordinator") {
      switch (filterData.filterType) {
        case "disciplines": {
          const disciplines = asArray<ListItem>(await coordinatorApi.listDisciplines<ApiListResponse<ListItem>>());
          fetched = disciplines.map((d) => ({ id: d.id, name: d.name, code: d.code }));
          selectedEntity = "discipline";
          break;
        }
        case "classes": {
          const classes = asArray<{ _id?: string; id?: string; name: string }>(await coordinatorApi.listClasses<ApiListResponse<{ _id?: string; id?: string; name: string }>>());
          fetched = classes.map((c) => ({ id: itemId(c), name: c.name, classId: itemId(c) }));
          selectedEntity = "class";
          break;
        }
        case "professors": {
          const professors = asArray<RawProfessor>(await coordinatorApi.listMyProfessors<ApiListResponse<RawProfessor>>());
          fetched = professors.map(professorToListItem);
          selectedEntity = "professor";
          break;
        }
        case "students-course": {
          const students = asArray<RawStudent>(await coordinatorApi.listMyStudents<ApiListResponse<RawStudent>>());
          fetched = students.map(studentToListItem);
          selectedEntity = "student";
          break;
        }
        case "students-discipline": {
          if (!filterData.disciplineId) { toast.error("Selecione uma disciplina"); return { items: [], entity: "student" }; }
          const students = asArray<RawStudent>(await coordinatorApi.listStudentsByDiscipline<ApiListResponse<RawStudent>>(filterData.disciplineId));
          fetched = students.map(studentToListItem);
          selectedEntity = "student";
          break;
        }
        case "students-class": {
          if (!filterData.classId) { toast.error("Selecione uma turma"); return { items: [], entity: "student" }; }
          const students = asArray<RawStudent>(await adminApi.listStudentsByClass(filterData.classId));
          fetched = students.map((student) => ({ ...studentToListItem(student), classId: filterData.classId }));
          selectedEntity = "student";
          break;
        }
      }
    }

    if (role === "professor") {
      switch (filterData.filterType) {
        case "students-discipline": {
          const raw = asArray<RawStudent>(await professorApi.listMyStudents<ApiListResponse<RawStudent>>());
          const filtered = filterData.disciplineId ? raw.filter((student) => studentHasDiscipline(student, filterData.disciplineId!)) : raw;
          fetched = filtered.map(studentToListItem);
          selectedEntity = "student";
          break;
        }
        case "students-class": {
          if (!filterData.classId) { toast.error("Selecione uma turma"); return { items: [], entity: "student" }; }
          const students = asArray<RawStudent>(await adminApi.listStudentsByClass(filterData.classId, undefined, filterData.disciplineId));
          fetched = students.map(studentToListItem);
          selectedEntity = "student";
          break;
        }
      }
    }

    return { items: fetched, entity: selectedEntity };
  } catch (err) {
    logger.error("Search", "Erro ao buscar dados.", err);
    toast.error("Erro ao buscar dados");
    return { items: [], entity: "student" };
  }
}
