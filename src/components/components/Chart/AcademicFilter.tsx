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
import { publicApi } from "@/services/apiClient";

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
  const [universities, setUniversities] = useState<Option[]>([]);
  const [courses, setCourses] = useState<Option[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [entities, setEntities] = useState<Option[]>([]);

  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  // Universidades
  useEffect(() => {
    publicApi.getInstitutions<Option[]>()
      .then(setUniversities)
      .catch(console.error);
  }, []);

  // Cursos
  useEffect(() => {
    if (selectedUniversity) {
      publicApi.getCourses<Option[]>(selectedUniversity)
        .then(setCourses)
        .catch(console.error);
    } else {
      setCourses([]);
      setSelectedCourse("");
    }
  }, [selectedUniversity]);

  // Turmas
  useEffect(() => {
    if (selectedUniversity && selectedCourse) {
      publicApi.getClasses<Option[]>(selectedUniversity, selectedCourse)
        .then(setClasses)
        .catch(console.error);
    } else {
      setClasses([]);
      setSelectedClass("");
    }
  }, [selectedCourse]);

  // Carrega a entidade principal final com base no tipo
  useEffect(() => {
    async function fetchEntities() {
      try {
        let result: Option[] = [];

        if (entityType === "student" && selectedUniversity && selectedCourse && selectedClass) {
          result = await publicApi.getStudentsByClass<Option[]>(selectedUniversity, selectedCourse, selectedClass);
        } else if (entityType === "class" && selectedUniversity && selectedCourse) {
          result = await publicApi.getClasses<Option[]>(selectedUniversity, selectedCourse);
        } else if (entityType === "course" && selectedUniversity) {
          result = await publicApi.getCourses<Option[]>(selectedUniversity);
        } else if (entityType === "university") {
          result = await publicApi.getInstitutions<Option[]>();
        }

        setEntities(result);
      } catch (error) {
        console.error("Erro ao carregar entidade:", error);
      }
    }

    fetchEntities();
  }, [entityType, selectedUniversity, selectedCourse, selectedClass]);

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
      {/* Filtros encadeados */}
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

      {/* Entidade final (popover de seleção) */}
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
