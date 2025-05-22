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
          const university = academicData.data.universities.find(u => u._id === filterData.universityId);
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
          const university = academicData.data.universities.find(u => u._id === filterData.universityId);
          if (!university) {
            toast.error("Universidade não encontrada");
            return { items: [], entity: "student" };
          }
          const course = university.courses.find(c => c._id === filterData.courseId);
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
          const university = academicData.data.universities.find(u => u._id === filterData.universityId);
          if (!university) {
            toast.error("Universidade não encontrada");
            return { items: [], entity: "student" };
          }
          const course = university.courses.find(c => c._id === filterData.courseId);
          if (!course) {
            toast.error("Curso não encontrado");
            return { items: [], entity: "student" };
          }
          fetched = course.classes.map((c) => ({ id: c._id, name: c.name }));
          selectedEntity = "class";
          break;
        }

        case "students":
        case "students-course":
        case "students-discipline": {
          let students = await adminApi.listStudents<any[]>();
          if (filterData.courseId) {
            students = students.filter((s) => s.course === filterData.courseId);
          }
          if (filterData.disciplineId) {
            students = students.filter((s) =>
              s.disciplines?.some((d: any) => d._id === filterData.disciplineId)
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

        case "professors": {
          if (!filterData.universityId) {
            toast.error("Universidade obrigatória");
            return { items: [], entity: "student" };
          }
          const academicData = await academicFiltersApi.getAcademicData();
          const university = academicData.data.universities.find(u => u._id === filterData.universityId);
          if (!university) {
            toast.error("Universidade não encontrada");
            return { items: [], entity: "student" };
          }

          // Coleta todos os professores de todos os cursos da universidade
          const allProfessors: any[] = [];
          university.courses.forEach(course => {
            course.professors.forEach(prof => {
              // Evita duplicatas
              if (!allProfessors.find(p => p._id === prof._id)) {
                allProfessors.push(prof);
              }
            });
          });

          fetched = allProfessors.map((p) => {
            const rawRoles: string[] = Array.isArray(p.role)
              ? p.role
              : p.role
                ? [p.role]
                : [];

            return {
              id: p._id,
              name: p.name,
              code: p.email,
              courseId: p.course ?? p.courseId ?? "",
              roles: rawRoles.map((r) => {
                switch (r) {
                  case "admin":
                    return "Administrador";
                  case "professor":
                    return "Professor";
                  case "course-coordinator":
                    return "Coordenador de Curso";
                  case "student":
                    return "Estudante";
                  default:
                    return r;
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
          const res = await coordinatorApi.listDisciplines<{ _id: string; name: string; code?: string }[]>();
          fetched = res.map((d) => ({
            id: d._id,
            name: d.name,
            code: d.code
          }));
          selectedEntity = "discipline";
          break;
        }

        case "classes": {
          const res = await coordinatorApi.listClasses<{ _id: string; name: string }[]>();
          fetched = res.map((c) => ({ id: c._id, name: c.name }));
          selectedEntity = "class";
          break;
        }

        case "professors": {
          const res = await coordinatorApi.listMyProfessors<any[]>();
          fetched = res.map((p) => {
            const rawRoles: string[] = Array.isArray(p.role)
              ? p.role
              : p.role
                ? [p.role]
                : [];

            return {
              id: p._id,
              name: p.name,
              code: p.email,
              courseId: p.course ?? p.courseId ?? "",
              roles: rawRoles.map((r) => {
                switch (r) {
                  case "admin":
                    return "Administrador";
                  case "professor":
                    return "Professor";
                  case "course-coordinator":
                    return "Coordenador de Curso";
                  case "student":
                    return "Estudante";
                  default:
                    return r;
                }
              }),
            };
          });
          selectedEntity = "professor";
          break;
        }

        case "students-course": {
          const res = await coordinatorApi.listMyStudents<any[]>();
          fetched = res.map((s) => ({
            id: s._id,
            name: s.name,
            code: s.email,
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
          const res = await coordinatorApi.listStudentsByDiscipline<any[]>(filterData.disciplineId);
          fetched = res.map((s) => ({
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

    if (role === "professor" && filterData.filterType === "students-discipline") {
      const res = await professorApi.listMyStudents<any[]>();
      fetched = res.map((s) => ({
        id: s._id,
        name: s.name,
        code: s.email,
        roles: ["Estudante"],
      }));
      selectedEntity = "student";
    }

    return { items: fetched, entity: selectedEntity };
  } catch (err) {
    console.error("Erro ao buscar dados:", err);
    toast.error("Erro ao buscar dados");
    return { items: [], entity: "student" };
  }
}