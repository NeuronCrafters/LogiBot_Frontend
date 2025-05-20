import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-Auth";
import { searchEntitiesByFilter } from "@/utils/searchEntitiesByFilter";
import { LogEntityType } from "@/services/api/api_routes";
import { FilterData, Role } from "@/@types/ChartsType";

interface AcademicFilterProps {
  entityType: LogEntityType;
  multiple?: boolean;
  onSelect: (ids: string[]) => void;
}

type Option = { _id: string; name: string };

export function AcademicFilter({ entityType, multiple = false, onSelect }: AcademicFilterProps) {
  const { user } = useAuth();
  const rawRoles = Array.isArray(user?.role) ? user.role : [user?.role];
  const role = (rawRoles.find((r): r is Role =>
    ["admin", "course-coordinator", "professor"].includes(r || "")
  ) ?? "admin") as Role;

  const [universities, setUniversities] = useState<Option[]>([]);
  const [courses, setCourses] = useState<Option[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [entities, setEntities] = useState<Option[]>([]);

  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState({
    universities: false,
    courses: false,
    classes: false,
    entities: false,
  });
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Função para buscar dados
  const fetchData = async (
    fetchFn: () => Promise<Option[]>,
    setState: (data: Option[]) => void,
    field: keyof typeof loading
  ) => {
    setLoading(prev => ({ ...prev, [field]: true }));
    try {
      const data = await fetchFn();
      if (data.length > 0) {
        setState(data);
      } else {
        setState([]);
      }
    } catch (err) {
      console.error(`Erro ao buscar ${field}:`, err);
      setState([]);
    } finally {
      setLoading(prev => ({ ...prev, [field]: false }));
    }
  };

  // Buscar universidades
  useEffect(() => {
    fetchData(
      async () => {
        const { items } = await searchEntitiesByFilter(role, { filterType: "universities" });
        return items.map(i => ({ _id: i.id, name: i.name }));
      },
      setUniversities,
      "universities"
    );
  }, [role]);

  // Buscar cursos
  useEffect(() => {
    if (!selectedUniversity) {
      setCourses([]);
      return;
    }

    fetchData(
      async () => {
        const { items } = await searchEntitiesByFilter(role, {
          filterType: "courses",
          universityId: selectedUniversity,
        });
        return items.map(i => ({ _id: i.id, name: i.name }));
      },
      setCourses,
      "courses"
    );
  }, [selectedUniversity, role]);

  // Buscar turmas
  useEffect(() => {
    if (!selectedUniversity || !selectedCourse) {
      setClasses([]);
      return;
    }

    fetchData(
      async () => {
        const { items } = await searchEntitiesByFilter(role, {
          filterType: "classes",
          universityId: selectedUniversity,
          courseId: selectedCourse,
        });
        return items.map(i => ({ _id: i.id, name: i.name }));
      },
      setClasses,
      "classes"
    );
  }, [selectedUniversity, selectedCourse, role]);

  // Buscar entidades
  useEffect(() => {
    const fetchEntities = async () => {
      // Mapeamento para os tipos corretos esperados pela função searchEntitiesByFilter
      const filterTypeMap: Record<LogEntityType, FilterData['filterType']> = {
        "student": "students",
        "class": "classes",
        "course": "courses",
        "university": "universities",
        "discipline": "disciplines"
      };

      const filterType = filterTypeMap[entityType] || "students";

      setLoading(prev => ({ ...prev, entities: true }));

      try {
        const filterData: FilterData = {
          filterType,
          universityId: selectedUniversity || undefined,
          courseId: selectedCourse || undefined,
          classId: selectedClass || undefined,
          searchTerm: searchTerm || undefined,
        };

        const { items } = await searchEntitiesByFilter(role, filterData);
        const formatted = items.map(i => ({ _id: i.id, name: i.name }));
        setEntities(formatted);
      } catch (error) {
        console.error("Erro ao carregar entidades:", error);
        setEntities([]);
      } finally {
        setLoading(prev => ({ ...prev, entities: false }));
      }
    };

    fetchEntities();
  }, [entityType, selectedUniversity, selectedCourse, selectedClass, role]);

  // Função para filtrar entidades por termo de busca
  const filteredEntities = entities.filter(entity =>
    entity.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleItem = (id: string) => {
    const updated = multiple
      ? selectedIds.includes(id)
        ? selectedIds.filter(i => i !== id)
        : [...selectedIds, id]
      : [id];

    console.log("AcademicFilter - Item selecionado:", id, "Nova lista:", updated);
    setSelectedIds(updated);

    // Notificar o componente pai imediatamente
    onSelect(updated);

    if (!multiple) setOpen(false);
  };

  const isCoursesDisabled = !selectedUniversity || loading.universities || courses.length === 0;
  const isClassesDisabled = !selectedCourse || loading.courses || classes.length === 0;
  const isEntitiesDisabled =
    (entityType === "course" && !selectedUniversity) ||
    (entityType === "class" && (!selectedUniversity || !selectedCourse)) ||
    (entityType === "student" && (!selectedUniversity || !selectedCourse)) ||
    loading.entities;

  // Encontrar nomes para entidades selecionadas
  const selectedNames = selectedIds.map(id => {
    const entity = entities.find(e => e._id === id);
    return entity ? entity.name : id;
  });

  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <select
            value={selectedUniversity}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedUniversity(val);
              setSelectedCourse("");
              setSelectedClass("");
              setSelectedIds([]);
              onSelect([]);
            }}
            className="p-2 rounded-md bg-[#141414] text-white border border-white/10 w-full"
            disabled={loading.universities}
          >
            <option value="">Selecione a Universidade</option>
            {universities.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select>
          {loading.universities && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
            </div>
          )}
        </div>

        {["course", "class", "student"].includes(entityType) && (
          <div className="relative">
            <select
              value={selectedCourse}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedCourse(val);
                setSelectedClass("");
                setSelectedIds([]);
                onSelect([]);
              }}
              disabled={isCoursesDisabled}
              className={cn("p-2 rounded-md bg-[#141414] text-white border border-white/10 w-full", isCoursesDisabled && "opacity-50")}
            >
              <option value="">Selecione o Curso</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            {loading.courses && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
              </div>
            )}
          </div>
        )}

        {["class", "student"].includes(entityType) && (
          <div className="relative">
            <select
              value={selectedClass}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedClass(val);
                setSelectedIds([]);
                onSelect([]);
              }}
              disabled={isClassesDisabled}
              className={cn("p-2 rounded-md bg-[#141414] text-white border border-white/10 w-full", isClassesDisabled && "opacity-50")}
            >
              <option value="">Selecione a Turma</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            {loading.classes && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={isEntitiesDisabled}
            className={cn("w-full justify-between bg-[#141414] text-white border border-white/10", isEntitiesDisabled && "opacity-50")}
          >
            {selectedIds.length > 0
              ? multiple
                ? `${selectedIds.length} selecionado(s)`
                : selectedNames[0] || selectedIds[0]
              : `Selecione ${entityType === "student" ? "o aluno" :
                entityType === "class" ? "a turma" :
                  entityType === "course" ? "o curso" : "a universidade"}`}
            {loading.entities ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <ChevronDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-[#1f1f1f] border border-white/10">
          <Command>
            <CommandInput
              placeholder="Buscar..."
              className="text-white"
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandEmpty className="text-sm text-white/60 px-2 py-4">
              {loading.entities ? "Carregando..." : "Nenhum encontrado."}
            </CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {filteredEntities.map(item => (
                <CommandItem
                  key={item._id}
                  onSelect={() => toggleItem(item._id)}
                  className={cn("text-white hover:bg-white/5 cursor-pointer transition-colors", selectedIds.includes(item._id) && "bg-white/10")}
                >
                  <Check className={cn("mr-2 h-4 w-4", selectedIds.includes(item._id) ? "opacity-100" : "opacity-0")} />
                  {item.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedIds.length > 0 && multiple && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedNames.map((name, index) => (
            <div key={selectedIds[index]} className="bg-indigo-500/20 border border-indigo-500/30 text-white px-2 py-1 rounded-md text-sm flex items-center">
              {name}
              <button
                onClick={() => toggleItem(selectedIds[index])}
                className="ml-2 text-white/70 hover:text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}