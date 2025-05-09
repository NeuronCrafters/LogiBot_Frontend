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
import { FormsList } from "@/components/components/Forms/FormsList";
import type { FilterData } from "@/@types/FormsFilterTypes";
import { publicApi, adminApi, academicApi } from "@/services/apiClient";
import {
  UniversityData,
  CourseData,
  ProfessorData,
  ClassData,
  DisciplineData,
} from "@/@types/FormsDataTypes";
import toast from "react-hot-toast";

// --- Tipagens auxiliares ---

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

// Extendemos Item para poder guardar roles (professor e student)
interface Item {
  id: string;
  name: string;
  code?: string;
  roles?: string[];
}

type Entity =
  | "university"
  | "course"
  | "discipline"
  | "class"
  | "professor"
  | "student";

// Formato local de professor para o modal
interface LocalProfessor {
  _id: string;
  name: string;
  email: string;
  roles: string[];
}

// Função de mapeamento interno→display
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

  // Estados principais
  const [items, setItems] = useState<Item[]>([]);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [currentEntity, setCurrentEntity] = useState<Entity>("university");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createdData, setCreatedData] = useState<any>(null);
  const [isAllowed, setIsAllowed] = useState(false);

  // Modal de edição de papel
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [profData, setProfData] = useState<LocalProfessor | null>(null);
  const [roleAction, setRoleAction] = useState<"add" | "remove">("add");

  useEffect(() => {
    setIsAllowed(
      userRoles.includes("admin") ||
      userRoles.includes("course-coordinator") ||
      userRoles.includes("professor")
    );
  }, [userRoles]);

  if (!isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#141414] text-white">
        <p>Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  // --- Busca & filtro ---
  async function handleSearch(filterData: FilterData) {
    try {
      let studentData: StudentRaw[] = [];
      let profDataArr: ProfessorData[] = [];
      let genericData: GenericRaw[] = [];

      switch (filterData.filterType) {
        case "students":
        case "students-course":
        case "students-discipline": {
          // 1) busca sempre todos
          studentData = await adminApi.listStudents<StudentRaw[]>();
          // 2) aplica filtros
          if (filterData.filterType === "students-course" && filterData.courseId) {
            studentData = studentData.filter(s => s.course === filterData.courseId);
          }
          if (filterData.filterType === "students-discipline" && filterData.disciplineId) {
            studentData = studentData.filter(s =>
              s.disciplines.some(d => d._id === filterData.disciplineId)
            );
          }
          setCurrentEntity("student");
          break;
        }

        case "professors": {
          // 1) busca conforme filtros
          if (filterData.universityId && filterData.courseId) {
            profDataArr = await adminApi.listProfessorsByCourse<ProfessorData[]>(
              filterData.courseId
            );
          } else if (filterData.universityId) {
            profDataArr = await adminApi.listProfessorsByUniversity<ProfessorData[]>(
              filterData.universityId
            );
          } else {
            profDataArr = await adminApi.listAllProfessors<ProfessorData[]>();
          }
          setCurrentEntity("professor");
          break;
        }

        // restantes genéricos
        case "universities":
          genericData = await publicApi.getInstitutions<GenericRaw[]>();
          setCurrentEntity("university");
          break;
        case "courses":
          if (filterData.universityId) {
            genericData = await publicApi.getCourses<GenericRaw[]>(
              filterData.universityId
            );
            setCurrentEntity("course");
          }
          break;
        case "disciplines":
          if (filterData.universityId && filterData.courseId) {
            genericData = await publicApi.getDisciplines<GenericRaw[]>(
              filterData.universityId,
              filterData.courseId
            );
            setCurrentEntity("discipline");
          }
          break;
        case "classes":
          if (filterData.universityId && filterData.courseId) {
            genericData = await publicApi.getClasses<GenericRaw[]>(
              filterData.universityId,
              filterData.courseId
            );
            setCurrentEntity("class");
          }
          break;
        default:
          console.error("Filtro inválido:", filterData.filterType);
      }

      // --- Mapeamento final para items ---
      if (currentEntity === "student") {
        setItems(
          studentData.map(s => ({
            id: s._id,
            name: s.name,
            code: s.email,
            roles: ["Estudante"],
          }))
        );
      } else if (currentEntity === "professor") {
        setItems(
          profDataArr.map(p => {
            // garantir array de roles
            const raw = (p as any).role as string | string[];
            const arr = Array.isArray(raw) ? raw : [raw];
            return {
              id: String(p._id),
              name: p.name,
              code: p.email,
              roles: arr.map(humanRole),
            };
          })
        );
      } else {
        setItems(
          genericData.map(g => ({
            id: g._id,
            name: g.name,
            code: g.code,
          }))
        );
      }

    } catch (err) {
      console.error("Erro ao buscar itens:", err);
      toast.error("Falha ao buscar dados.");
    }
  }

  // --- Criação / atualização genérica ---
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
          resp = await academicApi.post<DisciplineData>("discipline", item);
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

  // --- Editar: professor abre modal de role; demais reutilizam FormsCrud ---
  async function handleEdit(item: Item) {
    if (currentEntity === "professor" && userRoles.includes("admin")) {
      // busca todos para achar o selecionado
      const all = await adminApi.listAllProfessors<ProfessorData[]>();
      const p = all.find(x => String(x._id) === item.id);
      if (!p) {
        toast.error("Professor não encontrado.");
        return;
      }
      const raw = (p as any).role as string | string[];
      const arr = Array.isArray(raw) ? raw : [raw];
      setProfData({
        _id: String(p._id),
        name: p.name,
        email: p.email,
        roles: arr.map(humanRole),
      });
      // define ação inicial
      setRoleAction(arr.includes("course-coordinator") ? "remove" : "add");
      setRoleModalOpen(true);
    } else {
      setEditingItem(item);
    }
  }

  // --- Deletar ---
  async function handleDelete(id: string) {
    try {
      if (currentEntity === "professor") {
        await adminApi.deleteProfessor(id);
        toast.success("Professor removido com sucesso!");
      }
      setItems(prev => prev.filter(it => it.id !== id));
    } catch {
      toast.error("Falha ao deletar.");
    }
  }

  function handleResetList() {
    setItems([]);
  }

  // --- Aplica mudança de papel ---
  async function applyRoleChange() {
    if (!profData) return;
    const isCoord = profData.roles.includes("Coordenador de Curso");
    if ((roleAction === "add" && isCoord) || (roleAction === "remove" && !isCoord)) {
      return;
    }
    try {
      await adminApi.updateProfessorRole(
        profData._id,
        roleAction
      );
      toast.success(
        roleAction === "add"
          ? "Coordenador de Curso adicionado!"
          : "Coordenador de Curso removido!"
      );
      setRoleModalOpen(false);
      // refrescar listagem
      handleSearch({ filterType: "professors" });
    } catch (e: any) {
      toast.error(e.message || "Falha ao atualizar papel.");
    }
  }

  return (
    <div className="min-h-screen bg-[#141414] overflow-x-hidden">
      <FormsHeader />

      <div className="px-4 py-8 max-w-screen-xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-white font-Montserrat">
          Sistema de Gerenciamento do SAEL
        </h1>

        <FormsFilter onSearch={handleSearch} onReset={handleResetList} />

        {currentEntity !== "student" && (
          <FormsCrud
            onSubmit={handleCreateOrUpdate}
            initialData={
              editingItem
                ? { type: currentEntity, data: editingItem as any }
                : undefined
            }
          />
        )}

        <FormsList
          entity={currentEntity}
          items={items}
          onEdit={handleEdit}
          onDelete={handleDelete}
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
              <p><strong>ID:</strong> {createdData._id ?? createdData.id}</p>
              <p><strong>Nome:</strong> {createdData.name}</p>
              {createdData.code && <p><strong>Código:</strong> {createdData.code}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de alteração de papel */}
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
              <p><strong>Professor:</strong> {profData.name}</p>
              <p><strong>Email:</strong> {profData.email}</p>
              <p><strong>Papeis atuais:</strong> {profData.roles.join(", ")}</p>

              <fieldset className="flex flex-col gap-2 mt-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="roleAction"
                    value="add"
                    checked={roleAction === "add"}
                    onChange={() => setRoleAction("add")}
                  />
                  Adicionar Coordenador de Curso
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="roleAction"
                    value="remove"
                    checked={roleAction === "remove"}
                    onChange={() => setRoleAction("remove")}
                  />
                  Remover Coordenador de Curso
                </label>
              </fieldset>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRoleModalOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  disabled={
                    (roleAction === "add" && profData.roles.includes("Coordenador de Curso")) ||
                    (roleAction === "remove" && !profData.roles.includes("Coordenador de Curso"))
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
    </div>
  );
}
