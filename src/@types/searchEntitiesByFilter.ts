import { coordinatorApi, professorApi, publicApi, adminApi } from "@/services/apiClient";
import type { FilterData } from "@/@types/FormsFilterTypes";
import type { ListItem } from "@/components/components/Forms/FormsList";
import toast from "react-hot-toast";

type Role = "admin" | "course-coordinator" | "professor";

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
          const res = await publicApi.getInstitutions<{ _id: string; name: string }[]>();
          fetched = res.map((i) => ({ id: i._id, name: i.name }));
          selectedEntity = "university";
          break;
        }

        case "courses": {
          if (!filterData.universityId) {
            toast.error("Universidade não selecionada");
            return { items: [], entity: "student" };
          }
          const res = await publicApi.getCourses<{ _id: string; name: string }[]>(filterData.universityId);
          fetched = res.map((c) => ({ id: c._id, name: c.name }));
          selectedEntity = "course";
          break;
        }

        case "disciplines": {
          if (!filterData.universityId || !filterData.courseId) {
            toast.error("Universidade e Curso obrigatórios");
            return { items: [], entity: "student" };
          }
          const res = await publicApi.getDisciplines<{ _id: string; name: string }[]>(
            filterData.universityId,
            filterData.courseId
          );
          fetched = res.map((d) => ({ id: d._id, name: d.name }));
          selectedEntity = "discipline";
          break;
        }

        case "classes": {
          if (!filterData.universityId || !filterData.courseId) {
            toast.error("Universidade e Curso obrigatórios");
            return { items: [], entity: "student" };
          }
          const res = await publicApi.getClasses<{ _id: string; name: string }[]>(
            filterData.universityId,
            filterData.courseId
          );
          fetched = res.map((c) => ({ id: c._id, name: c.name }));
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
          const res = await publicApi.getProfessors<any[]>(filterData.universityId);
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
      }
    }

    if (role === "course-coordinator") {
      switch (filterData.filterType) {
        case "disciplines": {
          const res = await coordinatorApi.listDisciplines<{ _id: string; name: string }[]>();
          fetched = res.map((d) => ({ id: d._id, name: d.name }));
          selectedEntity = "discipline";
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
