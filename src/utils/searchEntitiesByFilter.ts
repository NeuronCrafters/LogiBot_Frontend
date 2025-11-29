import { coordinatorApi, professorApi, academicFiltersApi, adminApi } from "@/services/apiClient";
import type { FilterData } from "@/@types/ChartsType";
import type { ListItem } from "@/components/components/Forms/Lists/FormsList";
import toast from "react-hot-toast";

export type Role = "admin" | "course-coordinator" | "professor";

export type EntityType =
  | "university"
  | "course"
  | "discipline"
  | "class"
  | "professor"
  | "student";

type RawStudent = {
  _id: string;
  name: string;
  email: string;
  course?: string;
  disciplines?: { _id: string }[];
  classes?: string[];
};


export async function searchEntitiesByFilter(
  role: Role,
  filterData: FilterData
): Promise<{ items: ListItem[]; entity: EntityType }> {
  try {
    let fetched: ListItem[] = [];
    let selectedEntity: EntityType = "student";

    if (role === "admin") {
      switch (filterData.filterType) {
        case "universities": {
          const academicData = await academicFiltersApi.getAcademicData();
          const universities = academicData.data.universities;
          fetched = universities.map((i) => ({ id: i._id, name: i.name }));
          selectedEntity = "university";
          break;
        }

        case "courses": {
          if (!filterData.universityId) {
            toast.error("Universidade não selecionada");
            return { items: [], entity: "student" };
          }
          const academicData = await academicFiltersApi.getAcademicData();
          const university = academicData.data.universities.find(
            (u) => u._id === filterData.universityId
          );
          if (!university) {
            toast.error("Universidade não encontrada");
            return { items: [], entity: "student" };
          }
          fetched = university.courses.map((c) => ({ id: c._id, name: c.name }));
          selectedEntity = "course";
          break;
        }

        case "disciplines": {
          if (!filterData.universityId || !filterData.courseId) {
            toast.error("Universidade e Curso obrigatórios");
            return { items: [], entity: "student" };
          }
          const academicData = await academicFiltersApi.getAcademicData();
          const university = academicData.data.universities.find(
            (u) => u._id === filterData.universityId
          );
          if (!university) {
            toast.error("Universidade não encontrada");
            return { items: [], entity: "student" };
          }
          const course = university.courses.find(
            (c) => c._id === filterData.courseId
          );
          if (!course) {
            toast.error("Curso não encontrado");
            return { items: [], entity: "student" };
          }
          fetched = course.disciplines.map((d) => ({
            id: d._id,
            name: d.name,
            code: d.code
          }));
          selectedEntity = "discipline";
          break;
        }

        case "classes": {
          if (!filterData.universityId || !filterData.courseId) {
            toast.error("Universidade e Curso obrigatórios");
            return { items: [], entity: "student" };
          }
          const academicData = await academicFiltersApi.getAcademicData();
          const university = academicData.data.universities.find(
            (u) => u._id === filterData.universityId
          );
          if (!university) {
            toast.error("Universidade não encontrada");
            return { items: [], entity: "student" };
          }
          const course = university.courses.find(
            (c) => c._id === filterData.courseId
          );
          if (!course) {
            toast.error("Curso não encontrado");
            return { items: [], entity: "student" };
          }
          fetched = course.classes.map((c) => ({ id: c._id, name: c.name, classId: c._id }));
          selectedEntity = "class";
          break;
        }

        case "students":
        case "students-course":
        case "students-discipline": {
          let students: RawStudent[] =
            await adminApi.listStudents<RawStudent[]>();
          if (filterData.courseId) {
            students = students.filter(
              (s) => s.course === filterData.courseId
            );
          }
          if (filterData.disciplineId) {
            students = students.filter(
              (s) =>
                Array.isArray(s.disciplines) &&
                s.disciplines.some((d) => d._id === filterData.disciplineId)
            );
          }
          fetched = students.map((s) => ({
            id: s._id,
            name: s.name,
            code: s.email,
            roles: ["Estudante"],
          }));
          selectedEntity = "student";
          break;
        }

        case "students-class": {
          if (!filterData.classId) {
            toast.error("Selecione uma turma");
            return { items: [], entity: "student" };
          }
          const rawByClass = (await adminApi.listStudentsByClass(
            filterData.classId,
            filterData.courseId
          )) as RawStudent[];
          fetched = rawByClass.map((s) => ({
            id: s._id,
            name: s.name,
            code: s.email,
            roles: ["Estudante"],
          }));
          selectedEntity = "student";
          break;
        }
        case "professors": {
          if (!filterData.universityId) {
            toast.error("Universidade obrigatória");
            return { items: [], entity: "student" };
          }

          const profs = await adminApi.listProfessorsByUniversity<
            {
              _id: string;
              name: string;
              email: string;
              role: string | string[];
              course?: string;
              courseId?: string;
            }[]
          >(filterData.universityId);

          fetched = profs.map((p) => {
            const rawRoles = Array.isArray(p.role) ? p.role : [p.role];
            return {
              id: p._id,
              name: p.name,
              code: p.email,
              courseId: p.course?.toString() || p.courseId || "",
              roles: rawRoles.map((r) => {
                switch (r) {
                  case "admin": return "Administrador";
                  case "professor": return "Professor";
                  case "course-coordinator": return "Coordenador de Curso";
                  case "student": return "Estudante";
                  default: return r;
                }
              }),
            };
          });
          selectedEntity = "professor";
          break;
        }

      }
    }

    if (role === "course-coordinator") {
      switch (filterData.filterType) {
        case "disciplines": {
          const res = await coordinatorApi.listDisciplines<ListItem[]>();
          fetched = res.map((d) => ({ id: d.id, name: d.name, code: d.code }));
          selectedEntity = "discipline";
          break;
        }

        case "classes": {
          type RawClass = {
            _id: string;
            name: string;
          };

          const res = await coordinatorApi.listClasses<RawClass[]>();

          fetched = res.map((c) => ({
            id: c._id,
            name: c.name,
            classId: c._id
          }));

          selectedEntity = "class";
          break;
        }

        case "professors": {
          type RawCoordinatorProfessor = {
            _id: string;
            name: string;
            email: string;
            role: string | string[];
            course?: string;
            courses?: string[];
          };

          const res = await coordinatorApi.listMyProfessors<RawCoordinatorProfessor[]>();

          fetched = res.map((p) => {
            const rawRoles = Array.isArray(p.role) ? p.role : [p.role];

            return {
              id: p._id,
              name: p.name,
              code: p.email,
              courseId: p.course || (p.courses && p.courses[0] ? String(p.courses[0]) : ""),
              roles: rawRoles.map((r) => {
                switch (r) {
                  case "admin": return "Administrador";
                  case "professor": return "Professor";
                  case "course-coordinator": return "Coordenador de Curso";
                  default: return r;
                }
              }),
            };
          });

          selectedEntity = "professor";
          break;
        }

        case "students-course": {
          const res = await coordinatorApi.listMyStudents<ListItem[]>();
          fetched = res.map((s) => ({
            id: s.id,
            name: s.name,
            code: s.code,
            roles: ["Estudante"],
          }));
          selectedEntity = "student";
          break;
        }

        case "students-discipline": {
          if (!filterData.disciplineId) {
            toast.error("Selecione uma disciplina");
            return { items: [], entity: "student" };
          }
          const res = await coordinatorApi.listStudentsByDiscipline<RawStudent[]>(
            filterData.disciplineId
          );
          fetched = res.map((s) => ({
            id: s._id,
            name: s.name,
            code: s.email,
            roles: ["Estudante"],
          }));
          selectedEntity = "student";
          break;
        }

        case "students-class": {
          if (!filterData.classId) {
            toast.error("Selecione uma turma");
            return { items: [], entity: "student" };
          }
          const rawByClass = (await adminApi.listStudentsByClass(
            filterData.classId
          )) as RawStudent[];

          fetched = rawByClass.map((s) => ({
            id: s._id,
            name: s.name,
            code: s.email,
            roles: ["Estudante"],
            classId: filterData.classId
          }));
          selectedEntity = "student";
          break;
        }
      }
    }

    if (role === "professor") {
      switch (filterData.filterType) {

        case "students-discipline": {
          const raw = (await professorApi.listMyStudents()) as RawStudent[];

          let filtered = raw;

          if (filterData.disciplineId) {
            filtered = raw.filter((s) =>
              s.disciplines?.some((d: any) => {
                const idToCheck = d._id || d;

                return String(idToCheck) === String(filterData.disciplineId);
              })
            );
          }

          fetched = filtered.map((s) => ({
            id: s._id,
            name: s.name,
            code: s.email,
            roles: ["Estudante"],
          }));
          selectedEntity = "student";
          break;
        }

        case "students-class": {
          if (!filterData.classId) {
            toast.error("Selecione uma turma");
            return { items: [], entity: "student" };
          }
          const rawByClass = (await adminApi.listStudentsByClass(
            filterData.classId,
            undefined,
            filterData.disciplineId
          )) as RawStudent[];

          fetched = rawByClass.map((s) => ({
            id: s._id,
            name: s.name,
            code: s.email,
            roles: ["Estudante"],
          }));
          selectedEntity = "student";
          break;
        }
      }
    }

    return { items: fetched, entity: selectedEntity };
  } catch (err) {
    console.error("erro ao buscar dados:", err);
    toast.error("Erro ao buscar dados");
    return { items: [], entity: "student" };
  }
}