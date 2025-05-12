
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-Auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormsHeader } from "@/components/components/Forms/FormsHeader";
import { FormsFilter } from "@/components/components/Forms/FormsFilter";
import { FormsCrud } from "@/components/components/Forms/FormsCrud";
import { FormsList, ListItem } from "@/components/components/Forms/FormsList";
import type { FilterData } from "@/@types/FormsFilterTypes";
import {
  adminApi,
  professorApi,
  coordinatorApi,
  academicApi,
  publicApi,
} from "@/services/apiClient";
import {
  UniversityData,
  CourseData,
  ProfessorData,
  ClassData,
  DisciplineData,
} from "@/@types/FormsDataTypes";
import toast from "react-hot-toast";

interface StudentRaw {
  _id: string;
  name: string;
  email: string;
  course: string;
  disciplines: Array<{ _id: string; name: string; code: string }>;
}
interface GenericRaw {
  _id: string;
  name: string;
  code?: string;
}

interface Item extends ListItem {
  roles?: string[];
}

type Entity =
  | "university"
  | "course"
  | "discipline"
  | "class"
  | "professor"
  | "student";

interface LocalProfessor {
  _id: string;
  name: string;
  email: string;
  roles: string[];
}

const humanRole = (r: string) => {
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
};

export function CRUD() {
  const { user } = useAuth();
  if (!user) return null;

  const userRoles = Array.isArray(user.role) ? user.role : [user.role];
  const isAdmin = userRoles.includes("admin");
  const isCoordinator = userRoles.includes("course-coordinator");
  const isProfessor = userRoles.includes("professor");

  const [items, setItems] = useState<Item[]>([]);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [currentEntity, setCurrentEntity] = useState<Entity>("university");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createdData, setCreatedData] = useState<any>(null);
  const [isAllowed, setIsAllowed] = useState(false);

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [profData, setProfData] = useState<LocalProfessor | null>(null);
  const [roleAction, setRoleAction] = useState<"add" | "remove">("add");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setIsAllowed(isAdmin || isCoordinator || isProfessor);
  }, [isAdmin, isCoordinator, isProfessor]);

  if (!isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#141414] text-white">
        <p>Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  async function handleSearch(filterData: FilterData) {
    try {
      let fetched: any[] = [];
      let entity: Entity = "student";

      if (isCoordinator) {
        switch (filterData.filterType) {
          case "professors": {
            const profs = await coordinatorApi.listMyProfessors<ProfessorData[]>();
            fetched = profs.map((p) => {
              const rawRoles: string[] = Array.isArray(p.role) ? p.role : p.role ? [p.role] : [];
              return {
                id: String(p._id),
                name: p.name,
                code: p.email,
                roles: rawRoles.map(humanRole),
              };
            });
            entity = "professor";
            break;
          }

          case "disciplines": {
            // lista disciplinas do curso do coordenador
            const discs = await coordinatorApi.listDisciplines<DisciplineData[]>();
            fetched = discs.map((d) => ({
              id: String(d._id),
              name: d.name,
              code: (d as any).code ?? d._id,
            }));
            entity = "discipline";
            break;
          }

          case "classes": {
            // lista turmas do curso do coordenador
            const cls = await coordinatorApi.listClasses<ClassData[]>();
            fetched = cls.map((c) => ({
              id: String(c._id),
              name: c.name,
              code: (c as any).code ?? c._id,
            }));
            entity = "class";
            break;
          }

          case "students-course": {
            const studs = await coordinatorApi.listMyStudents<StudentRaw[]>();
            fetched = studs.map((s) => ({
              id: s._id,
              name: s.name,
              code: s.email,
              roles: ["Estudante"],
            }));
            entity = "student";
            break;
          }

          case "students-discipline": {
            if (!filterData.disciplineId) {
              toast.error("Selecione uma disciplina.");
              return;
            }
            const studs =
              await coordinatorApi.listStudentsByDiscipline<StudentRaw[]>(
                filterData.disciplineId
              );
            fetched = studs.map((s) => ({
              id: s._id,
              name: s.name,
              code: s.email,
              roles: ["Estudante"],
            }));
            entity = "student";
            break;
          }

          default:
            fetched = [];
        }

      } else if (isProfessor) {
        const studs = await professorApi.listMyStudents<StudentRaw[]>();
        fetched = studs.map((s) => ({
          id: s._id,
          name: s.name,
          code: s.email,
          roles: ["Estudante"],
        }));
        entity = "student";

      } else if (isAdmin) {
        switch (filterData.filterType) {
          case "students":
          case "students-course":
          case "students-discipline": {
            let studs = await adminApi.listStudents<StudentRaw[]>();
            if (
              filterData.filterType === "students-course" &&
              filterData.courseId
            ) {
              studs = studs.filter((s) => s.course === filterData.courseId);
            }
            if (
              filterData.filterType === "students-discipline" &&
              filterData.disciplineId
            ) {
              studs = studs.filter((s) =>
                s.disciplines.some((d) => d._id === filterData.disciplineId)
              );
            }
            fetched = studs.map((s) => ({
              id: s._id,
              name: s.name,
              code: s.email,
              roles: ["Estudante"],
            }));
            entity = "student";
            break;
          }
          case "professors": {
            let profs: ProfessorData[];
            if (filterData.courseId) {
              profs = await adminApi.listProfessorsByCourse<ProfessorData[]>(
                filterData.courseId
              );
            } else if (filterData.universityId) {
              profs = await adminApi.listProfessorsByUniversity<ProfessorData[]>(
                filterData.universityId
              );
            } else {
              profs = await adminApi.listAllProfessors<ProfessorData[]>();
            }
            fetched = profs.map((p) => {
              const rawRoles: string[] = Array.isArray(p.role)
                ? p.role
                : p.role
                  ? [p.role]
                  : [];
              return {
                id: String(p._id),
                name: p.name,
                code: p.email,
                roles: rawRoles.map(humanRole),
              };
            });
            entity = "professor";
            break;
          }
          case "universities": {
            const unis = await publicApi.getInstitutions<GenericRaw[]>();
            fetched = unis.map((u) => ({
              id: u._id,
              name: u.name,
              code: u.code ?? u._id,
            }));
            entity = "university";
            break;
          }
          case "courses": {
            if (!filterData.universityId) return;
            const courses = await publicApi.getCourses<GenericRaw[]>(
              filterData.universityId
            );
            fetched = courses.map((c) => ({
              id: c._id,
              name: c.name,
              code: c.code ?? c._id,
            }));
            entity = "course";
            break;
          }
          case "disciplines": {
            if (!filterData.universityId || !filterData.courseId) return;
            const discs = await publicApi.getDisciplines<GenericRaw[]>(
              filterData.universityId,
              filterData.courseId
            );
            fetched = discs.map((d) => ({
              id: d._id,
              name: d.name,
              code: d.code,
            }));
            entity = "discipline";
            break;
          }
          case "classes": {
            if (!filterData.universityId || !filterData.courseId) return;
            const cls = await publicApi.getClasses<GenericRaw[]>(
              filterData.universityId,
              filterData.courseId
            );
            fetched = cls.map((c) => ({
              id: c._id,
              name: c.name,
              code: c.code ?? c._id,
            }));
            entity = "class";
            break;
          }
          default:
            fetched = [];
        }
      }

      setItems(fetched);
      setCurrentEntity(entity);
    } catch (err) {
      console.error("Erro ao buscar itens:", err);
      toast.error("Falha ao buscar dados.");
    }
  }

  async function handleCreateOrUpdate(
    entity: Entity,
    item:
      | UniversityData
      | CourseData
      | ProfessorData
      | ClassData
      | DisciplineData
  ) {
    try {
      let resp;
      switch (entity) {
        case "university":
          resp = await academicApi.post<UniversityData>("university", item);
          break;
        case "course":
          resp = await academicApi.post<CourseData>("course", item);
          break;
        case "class":
          resp = await academicApi.post<ClassData>("class", item);
          break;
        case "discipline":
          resp = await academicApi.post<DisciplineData>(
            "discipline",
            item
          );
          break;
        case "professor":
          resp = await adminApi.createProfessor<ProfessorData>(item);
          break;
        default:
          return;
      }
      setCreatedData(resp);
      setCreateModalOpen(true);
      toast.success("Cadastro realizado com sucesso!");
    } catch (err) {
      console.error("Erro ao criar item:", err);
      toast.error("Falha ao criar registro.");
    }
  }

  async function handleEdit(item: Item) {
    if (currentEntity === "professor" && isAdmin) {
      const all = await adminApi.listAllProfessors<ProfessorData[]>();
      const p = all.find((x) => String(x._id) === item.id);
      if (!p) {
        toast.error("Professor não encontrado.");
        return;
      }
      const rawRoles: string[] = Array.isArray(p.role)
        ? p.role
        : p.role
          ? [p.role]
          : [];
      const labels = rawRoles.map((r) => humanRole(r));
      setProfData({
        _id: String(p._id),
        name: p.name,
        email: p.email,
        roles: labels,
      });
      setRoleAction(labels.includes("Coordenador de Curso") ? "remove" : "add");
      setRoleModalOpen(true);
    } else {
      setEditingItem(item);
    }
  }

  async function handleDelete(id: string) {
    try {
      if (currentEntity === "professor") {
        await adminApi.deleteProfessor(id);
        toast.success("Professor removido com sucesso!");
      }
      setItems((prev) => prev.filter((it) => it.id !== id));
    } catch {
      toast.error("Falha ao deletar.");
    }
  }

  function confirmDelete(id: string) {
    setToDeleteId(id);
    setDeleteModalOpen(true);
  }

  function cancelDelete() {
    setToDeleteId(null);
    setDeleteModalOpen(false);
  }

  async function doDelete() {
    if (!toDeleteId) return;
    await handleDelete(toDeleteId);
    cancelDelete();
  }

  function handleResetList() {
    setItems([]);
  }

  async function applyRoleChange() {
    if (!profData) return;
    const hasCoord = profData.roles.includes("Coordenador de Curso");
    if ((roleAction === "add" && hasCoord) || (roleAction === "remove" && !hasCoord)) {
      return;
    }
    try {
      await adminApi.updateProfessorRole(profData._id, roleAction);
      toast.success(
        roleAction === "add"
          ? "Coordenador de Curso adicionado!"
          : "Coordenador de Curso removido!"
      );
      setRoleModalOpen(false);
      handleSearch({ filterType: "professors" } as FilterData);
    } catch (e: any) {
      toast.error(e.message || "Falha ao atualizar papel.");
    }
  }

  return (
    <div className="min-h-screen bg-[#141414] overflow-x-auto">
      <FormsHeader />

      <div className="px-4 py-8 max-w-screen-xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-white font-Montserrat">
          Sistema de Gerenciamento do SAEL
        </h1>

        {currentEntity !== "student" && isAdmin && (
          <FormsCrud
            onSubmit={handleCreateOrUpdate}
            initialData={
              editingItem
                ? { type: currentEntity, data: editingItem as any }
                : undefined
            }
          />
        )}

        <FormsFilter onSearch={handleSearch} onReset={handleResetList} />

        <FormsList
          entity={currentEntity}
          items={items}
          onEdit={handleEdit}
          onDelete={confirmDelete}
        />
      </div>

      {/* Modal de criação */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="bg-[#1f1f1f] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastro Concluído</DialogTitle>
            <DialogDescription className="text-slate-400">
              Detalhes do item criado:
            </DialogDescription>
          </DialogHeader>
          {createdData && (
            <div className="mt-2 space-y-2">
              <p>
                <strong>ID:</strong> {createdData._id ?? createdData.id}
              </p>
              <p>
                <strong>Nome:</strong> {createdData.name}
              </p>
              {createdData.code && (
                <p>
                  <strong>Código:</strong> {createdData.code}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de mudança de papel */}
      <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
        <DialogContent className="bg-[#1f1f1f] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar Papel do Professor</DialogTitle>
            <DialogDescription className="text-slate-400">
              Confirme abaixo.
            </DialogDescription>
          </DialogHeader>
          {profData && (
            <div className="mt-4 space-y-4">
              <p>
                <strong>Professor:</strong> {profData.name}
              </p>
              <p>
                <strong>Email:</strong> {profData.email}
              </p>
              <p>
                <strong>Papeis atuais:</strong> {profData.roles.join(", ")}
              </p>
              <fieldset className="flex flex-col gap-2 mt-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="roleAction"
                    value="add"
                    checked={roleAction === "add"}
                    onChange={() => setRoleAction("add")}
                  />{" "}
                  Adicionar Coordenador de Curso
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="roleAction"
                    value="remove"
                    checked={roleAction === "remove"}
                    onChange={() => setRoleAction("remove")}
                  />{" "}
                  Remover Coordenador de Curso
                </label>
              </fieldset>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRoleModalOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  disabled={
                    (roleAction === "add" &&
                      profData.roles.includes("Coordenador de Curso")) ||
                    (roleAction === "remove" &&
                      !profData.roles.includes("Coordenador de Curso"))
                  }
                  onClick={applyRoleChange}
                >
                  Aplicar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de delete */}
      <Dialog open={deleteModalOpen} onOpenChange={cancelDelete}>
        <DialogContent className="bg-[#1f1f1f] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar deleção</DialogTitle>
            <DialogDescription className="text-slate-400">
              Tem certeza que deseja deletar este registro?
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={cancelDelete}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={doDelete}>
              Deletar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
