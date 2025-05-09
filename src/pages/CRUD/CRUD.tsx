// src/pages/CRUD.tsx
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-Auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FormsHeader } from "../../components/components/Forms/FormsHeader";
import { FormsFilter } from "../../components/components/Forms/FormsFilter";
import { FormsList } from "../../components/components/Forms/FormsList";
import type { Item as OriginalItem } from "../../components/components/Forms/FormsList";
import { FormsCrud } from "../../components/components/Forms/FormsCrud";
import type { FilterData } from "../../@types/FormsFilterTypes";
import { publicApi, academicApi, adminApi } from "@/services/apiClient";
import {
  UniversityData,
  CourseData,
  ProfessorData,
  ClassData,
  DisciplineData,
} from "@/@types/FormsDataTypes";
import toast from "react-hot-toast";

interface Item extends OriginalItem {
  code?: string;
}

type Entity =
  | "university"
  | "course"
  | "discipline"
  | "class"
  | "professor"
  | "student";

interface RawItem {
  id?: string | number;
  _id?: string | number;
  name: string;
  code?: string;
}

function CRUD() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [currentEntity, setCurrentEntity] = useState<Entity>("university");
  const [modalOpen, setModalOpen] = useState(false);
  const [createdData, setCreatedData] = useState<any | null>(null);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const roles = Array.isArray(user?.role) ? user.role : [user?.role];
    if (
      roles.includes("admin") ||
      roles.includes("course-coordinator") ||
      roles.includes("professor")
    ) {
      setIsAllowed(true);
    } else {
      setIsAllowed(false);
    }
  }, [user]);

  if (!isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#141414] text-white">
        <p>Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  async function handleSearch(filterData: FilterData) {
    try {
      let data: RawItem[] = [];
      switch (filterData.filterType) {
        case "universities":
          data = await publicApi.getInstitutions<RawItem[]>();
          setCurrentEntity("university");
          break;
        case "courses":
          if (filterData.universityId) {
            data = await publicApi.getCourses<RawItem[]>(filterData.universityId);
            setCurrentEntity("course");
          }
          break;
        case "disciplines":
          if (filterData.universityId && filterData.courseId) {
            data = await publicApi.getDisciplines<RawItem[]>(
              filterData.universityId,
              filterData.courseId
            );
            setCurrentEntity("discipline");
          }
          break;
        case "classes":
          if (filterData.universityId && filterData.courseId) {
            data = await publicApi.getClasses<RawItem[]>(
              filterData.universityId,
              filterData.courseId
            );
            setCurrentEntity("class");
          }
          break;
        case "professors":
          if (filterData.universityId && filterData.courseId) {
            // lista professores do curso
            data = await adminApi.listProfessorsByCourse<RawItem[]>(filterData.courseId);
          } else if (filterData.universityId) {
            // lista professores da universidade
            data = await adminApi.listProfessorsByUniversity<RawItem[]>(
              filterData.universityId
            );
          }
          setCurrentEntity("professor");
          break;
        case "students":
          // lista alunos conforme papel do usuário
          data = await adminApi.listStudents<RawItem[]>();
          setCurrentEntity("student");
          break;
        default:
          console.error("Filtro inválido");
      }

      const mapped: Item[] = data.map((it, idx) => ({
        id: it.id ?? it._id ?? idx,
        name: it.name,
        code: it.code,
      }));
      setItems(mapped);
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
      let resp:
        | UniversityData
        | CourseData
        | ProfessorData
        | ClassData
        | DisciplineData;
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
          console.error("Entidade não suportada:", entity);
          return;
      }

      setCreatedData(resp);
      setModalOpen(true);
      toast.success("Cadastro realizado com sucesso!");
    } catch (err) {
      console.error("Erro ao criar item:", err);
      toast.error("Falha ao criar registro.");
    }
  }

  function handleEdit(it: Item) {
    setEditingItem(it);
  }

  function handleDelete(id: string | number) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function handleResetList() {
    setItems([]);
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
            onSubmit={(e, d) => handleCreateOrUpdate(e, d)}
            initialData={editingItem ?? undefined}
          />
        )}
        <FormsList
          entity={currentEntity}
          items={items}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
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
              {"code" in createdData && createdData.code && (
                <p>
                  <strong>Código:</strong> {createdData.code}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { CRUD };
