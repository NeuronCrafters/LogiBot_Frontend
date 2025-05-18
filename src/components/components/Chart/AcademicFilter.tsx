import { useEffect, useState, useCallback } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useDataCache } from "@/hooks/use-DataCache";
import { useAuth } from "@/hooks/use-Auth";
import { searchEntitiesByFilter } from "@/utils/searchEntitiesByFilter";
import type { FilterData } from "@/@types/ChartsType";
import { LogEntityType } from "@/services/api/api_routes";
import { debounce } from "@/utils/debounce";
import { isCacheValid } from "@/utils/isCacheValid";

const TTL = 5 * 60 * 1000;

interface AcademicFilterProps {
  entityType: LogEntityType;
  multiple?: boolean;
  onSelect: (ids: string[]) => void;
}

type Option = { _id: string; name: string };
type Role = "admin" | "course-coordinator" | "professor";

export function AcademicFilter({ entityType, multiple = false, onSelect }: AcademicFilterProps) {
  const { get, set, getTimestamp } = useDataCache<Option[]>();
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

  // Busca genérica com TTL
  const fetchWithCache = async (
    key: string,
    fetchFn: () => Promise<Option[]>,
    setState: (data: Option[]) => void,
    field: keyof typeof loading
  ) => {
    const cached = get(key, true);
    const timestamp = getTimestamp(key);

    if (cached && isCacheValid(cached, TTL, timestamp)) {
      setState(cached);
      return;
    }

    setLoading(prev => ({ ...prev, [field]: true }));
    try {
      const data = await fetchFn();
      if (data.length > 0) {
        set(key, data, true);
        setState(data);
      }
    } catch (err) {
      console.error(`Erro ao buscar ${field}:`, err);
    } finally {
      setLoading(prev => ({ ...prev, [field]: false }));
    }
  };

  useEffect(() => {
    fetchWithCache(
      "universities",
      async () => {
        const { items } = await searchEntitiesByFilter(role, { filterType: "universities" });
        return items.map(i => ({ _id: i.id, name: i.name }));
      },
      setUniversities,
      "universities"
    );
  }, [role]);

  useEffect(() => {
    if (!selectedUniversity) {
      setCourses([]);
      return;
    }

    fetchWithCache(
      `courses_${selectedUniversity}`,
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

  useEffect(() => {
    if (!selectedUniversity || !selectedCourse) {
      setClasses([]);
      return;
    }

    fetchWithCache(
      `classes_${selectedUniversity}_${selectedCourse}`,
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

  const debouncedFetchEntities = useCallback(
    debounce(async () => {
      const filterType =
        entityType === "student" ? "students" :
          entityType === "class" ? "classes" :
            entityType === "course" ? "courses" :
              "universities";

      const cacheKey = `entities_${entityType}_${selectedUniversity}_${selectedCourse}_${selectedClass}`;
      const cached = get(cacheKey);
      const timestamp = getTimestamp(cacheKey);

      if (cached && isCacheValid(cached, TTL, timestamp)) {
        setEntities(cached);
        return;
      }

      setLoading(prev => ({ ...prev, entities: true }));

      try {
        const filterData: FilterData = {
          filterType,
          universityId: selectedUniversity || undefined,
          courseId: selectedCourse || undefined,
          classId: selectedClass || undefined,
        };

        const { items } = await searchEntitiesByFilter(role, filterData);
        const formatted = items.map(i => ({ _id: i.id, name: i.name }));

        if (formatted.length > 0) {
          set(cacheKey, formatted, false);
          setEntities(formatted);
        } else {
          setEntities([]);
        }
      } catch (error) {
        console.error("Erro ao carregar entidades:", error);
        setEntities([]);
      } finally {
        setLoading(prev => ({ ...prev, entities: false }));
      }
    }, 300),
    [entityType, selectedUniversity, selectedCourse, selectedClass, role]
  );

  useEffect(() => {
    debouncedFetchEntities();
  }, [debouncedFetchEntities]);

  const toggleItem = (id: string) => {
    const updated = multiple
      ? selectedIds.includes(id)
        ? selectedIds.filter(i => i !== id)
        : [...selectedIds, id]
      : [id];

    setSelectedIds(updated);
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

  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        >
          <option value="">Selecione a Universidade</option>
          {universities.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
        </select>

        {["course", "class", "student"].includes(entityType) && (
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
        )}

        {["class", "student"].includes(entityType) && (
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
              ? `${selectedIds.length} selecionado(s)`
              : `Selecione ${entityType === "student" ? "o aluno" :
                entityType === "class" ? "a turma" :
                  entityType === "course" ? "o curso" : "a universidade"}`}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-[#1f1f1f] border border-white/10">
          <Command>
            <CommandInput placeholder="Buscar..." className="text-white" />
            <CommandEmpty className="text-sm text-white/60 px-2 py-4">Nenhum encontrado.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {entities.map(item => (
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
    </motion.div>
  );
}
