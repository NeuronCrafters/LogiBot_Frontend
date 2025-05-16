import { useEffect, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import type { FilterData } from "@/@types/FormsFilterTypes";
import type { Role } from "@/utils/searchEntitiesByFilter";

interface AcademicFilterProps {
  entityType: "student" | "class" | "course" | "university";
  multiple?: boolean;
  onSelect: (ids: string[]) => void;
}

type Option = { _id: string; name: string };

export function AcademicFilter({
  entityType,
  multiple = false,
  onSelect,
}: AcademicFilterProps) {
  const { get, set } = useDataCache<Option[]>();
  const { user } = useAuth();
  const rawRoles = Array.isArray(user?.role) ? user.role : [user?.role];
  const role = (rawRoles.find((r): r is string =>
    typeof r === "string" &&
    ["admin", "course-coordinator", "professor"].includes(r)
  ) ?? "admin") as Role;



  const [universities, setUniversities] = useState<Option[]>([]);
  const [courses, setCourses] = useState<Option[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [entities, setEntities] = useState<Option[]>([]);

  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const cacheKey = "universities";
    const cached = get(cacheKey);
    if (cached) {
      setUniversities(cached);
    } else {
      searchEntitiesByFilter(role, { filterType: "universities" })
        .then(({ items }) => {
          const formatted = items.map((i) => ({ _id: i.id, name: i.name }));
          set(cacheKey, formatted);
          setUniversities(formatted);
        })
        .catch(console.error);
    }
  }, [role]);

  useEffect(() => {
    if (selectedUniversity) {
      const cacheKey = `courses_${selectedUniversity}`;
      const cached = get(cacheKey);
      if (cached) {
        setCourses(cached);
      } else {
        searchEntitiesByFilter(role, {
          filterType: "courses",
          universityId: selectedUniversity,
        })
          .then(({ items }) => {
            const formatted = items.map((i) => ({ _id: i.id, name: i.name }));
            set(cacheKey, formatted);
            setCourses(formatted);
          })
          .catch(console.error);
      }
    } else {
      setCourses([]);
      setSelectedCourse("");
    }
  }, [selectedUniversity, role]);

  useEffect(() => {
    if (selectedUniversity && selectedCourse) {
      const cacheKey = `classes_${selectedUniversity}_${selectedCourse}`;
      const cached = get(cacheKey);
      if (cached) {
        setClasses(cached);
      } else {
        searchEntitiesByFilter(role, {
          filterType: "classes",
          universityId: selectedUniversity,
          courseId: selectedCourse,
        })
          .then(({ items }) => {
            const formatted = items.map((i) => ({ _id: i.id, name: i.name }));
            set(cacheKey, formatted);
            setClasses(formatted);
          })
          .catch(console.error);
      }
    } else {
      setClasses([]);
      setSelectedClass("");
    }
  }, [selectedCourse, selectedUniversity, role]);

  useEffect(() => {
    async function fetchEntities() {
      try {
        const filterData: FilterData = {
          filterType:
            entityType === "student"
              ? "students"
              : (entityType + "s") as FilterData["filterType"],
          universityId: selectedUniversity || undefined,
          courseId: selectedCourse || undefined,
          classId: selectedClass || undefined,
        };

        const { items } = await searchEntitiesByFilter(role, filterData);
        const formatted = items.map((i) => ({ _id: i.id, name: i.name }));
        setEntities(formatted);
      } catch (error) {
        console.error("Erro ao carregar entidade:", error);
      }
    }

    fetchEntities();
  }, [entityType, selectedUniversity, selectedCourse, selectedClass, role]);

  const toggleItem = (id: string) => {
    const updated = multiple
      ? selectedIds.includes(id)
        ? selectedIds.filter((i) => i !== id)
        : [...selectedIds, id]
      : [id];

    setSelectedIds(updated);
    onSelect(updated);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <select
          value={selectedUniversity}
          onChange={(e) => {
            setSelectedUniversity(e.target.value);
            setSelectedCourse("");
            setSelectedClass("");
            setSelectedIds([]);
            onSelect([]);
          }}
          className="p-2 rounded-md bg-[#141414] text-white border border-white/10"
        >
          <option value="">Selecione a Universidade</option>
          {universities.map((u) => (
            <option key={u._id} value={u._id}>{u.name}</option>
          ))}
        </select>

        {["course", "class", "student"].includes(entityType) && (
          <select
            value={selectedCourse}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              setSelectedClass("");
              setSelectedIds([]);
              onSelect([]);
            }}
            disabled={!selectedUniversity}
            className="p-2 rounded-md bg-[#141414] text-white border border-white/10"
          >
            <option value="">Selecione o Curso</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        )}

        {["class", "student"].includes(entityType) && (
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setSelectedIds([]);
              onSelect([]);
            }}
            disabled={!selectedCourse}
            className="p-2 rounded-md bg-[#141414] text-white border border-white/10"
          >
            <option value="">Selecione a Turma</option>
            {classes.map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
        )}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between bg-[#141414] text-white border border-white/10"
          >
            {selectedIds.length > 0
              ? `${selectedIds.length} selecionado(s)`
              : `Selecione ${entityType}`}
            <ChevronDown className="ml-2 h-4 w-4 text-white" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0 bg-[#1f1f1f] border border-white/10">
          <Command>
            <CommandInput placeholder="Buscar..." className="text-white" />
            <CommandEmpty className="text-sm text-white/60 px-2 py-4">Nenhum encontrado.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {entities.map((item) => (
                <CommandItem
                  key={item._id}
                  onSelect={() => toggleItem(item._id)}
                  className={cn(
                    "text-white hover:bg-white/5 cursor-pointer transition-colors rounded-md",
                    selectedIds.includes(item._id) && "bg-white/10"
                  )}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedIds.includes(item._id) ? "opacity-100" : "opacity-0"
                    )}
                  />
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
