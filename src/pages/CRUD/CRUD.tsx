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
import { publicApi, academicApi } from "@/services/apiClient";
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

    if (roles.includes("admin") || roles.includes("coordinator") || roles.includes("course-coordinator")) {
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

  async function handleSearch(filterData: FilterData): Promise<void> {
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
            data = await publicApi.getClasses<RawItem[]>(filterData.universityId, filterData.courseId);
            setCurrentEntity("class");
          }
          break;
        case "professors":
          if (filterData.universityId) {
            if (filterData.courseId) {
              data = await publicApi.getProfessors<RawItem[]>(filterData.universityId, filterData.courseId);
            } else {
              data = await publicApi.getProfessors<RawItem[]>(filterData.universityId);
            }
            setCurrentEntity("professor");
          }
          break;
        case "students-discipline":
          if (
            filterData.universityId &&
            filterData.courseId &&
            filterData.disciplineId
          ) {
            data = await publicApi.getStudentsByDiscipline<RawItem[]>(
              filterData.universityId,
              filterData.courseId,
              filterData.disciplineId
            );
            setCurrentEntity("student");
          }
          break;
        case "students-course":
          if (filterData.universityId && filterData.courseId) {
            data = await publicApi.getStudentsByCourse<RawItem[]>(filterData.universityId, filterData.courseId);
            setCurrentEntity("student");
          }
          break;
        default:
          console.error("Filtro inválido");
      }
      const mappedData: Item[] = data.map((item, index) => ({
        id: item.id ?? item._id ?? index,
        name: item.name,
        code: item.code ?? undefined,
      }));
      setItems(mappedData);
    } catch (error) {
      console.error("Erro ao buscar itens:", error);
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
  ): Promise<void> {
    try {
      let response:
        | UniversityData
        | CourseData
        | ProfessorData
        | ClassData
        | DisciplineData;

      switch (entity) {
        case "university":
          response = await academicApi.post<UniversityData>("university", item);
          break;
        case "course":
          response = await academicApi.post<CourseData>("course", item);
          break;
        case "class":
          response = await academicApi.post<ClassData>("class", item);
          break;
        case "discipline":
          response = await academicApi.post<DisciplineData>("discipline", item);
          break;
        case "professor":
          response = await academicApi.post<ProfessorData>("professor", item);
          break;
        default:
          console.error("Entidade não suportada para criação:", entity);
          return;
      }

      setCreatedData(response);
      setModalOpen(true);
      toast.success("Registro criado com sucesso!");
    } catch (error) {
      console.error("Erro ao criar item:", error);
      toast.error("Erro ao criar item.");
    }
  }

  function handleEdit(item: Item): void {
    setEditingItem(item);
  }

  function handleDelete(id: string | number): void {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  }

  function handleResetList(): void {
    setItems([]);
  }

  return (
    <div className="min-h-screen bg-[#141414] overflow-x-hidden">
      <FormsHeader />
      <div className="bg-[#141414]">
        <div className="px-4 py-8 max-w-screen-xl mx-auto">
          <h1 className="text-2xl font-bold mb-4 text-white font-Montserrat">
            Sistema de Gerenciamento do SAEL
          </h1>
          <FormsFilter onSearch={handleSearch} onReset={handleResetList} />
          {currentEntity !== "student" && currentEntity !== "professor" ? (
            <FormsCrud
              onSubmit={(entity, data) => handleCreateOrUpdate(entity, data)}
              initialData={editingItem || undefined}
            />
          ) : (
            currentEntity === "professor" && (
              <FormsCrud
                onSubmit={(entity, data) => handleCreateOrUpdate(entity, data)}
                initialData={editingItem || undefined}
              />
            )
          )}
          <FormsList
            entity={currentEntity}
            items={items}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#1f1f1f] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastro Realizado</DialogTitle>
            <DialogDescription className="text-slate-400">
              Veja abaixo os dados do item criado com sucesso.
            </DialogDescription>
          </DialogHeader>
          {createdData && (
            <div className="space-y-2 mt-2">
              <p><strong>ID:</strong> {createdData._id || createdData.id}</p>
              <p><strong>Nome:</strong> {createdData.name}</p>
              {createdData.code && <p><strong>Código:</strong> {createdData.code}</p>}
              {createdData.courseId && <p><strong>ID do Curso:</strong> {createdData.courseId}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { CRUD };
