import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-Auth";
import { academicFiltersApi } from "@/services/apiClient";
import { LogEntityType } from "@/services/api/api_routes";
import { FilterType, Role } from "@/@types/ChartsType";
import { AcademicDataResponse } from "@/@types/AcademicData";

interface AcademicFilterProps {
  entityType: LogEntityType;
  multiple?: boolean;
  onSelect: (
    ids: string[],
    hierarchyInfo?: {
      universityId?: string;
      courseId?: string;
      classId?: string;
      disciplineId?: string;
    }
  ) => void;
  additionalParams?: {
    universityId?: string;
    courseId?: string;
    classId?: string;
  };
}

type Option = { _id: string; name: string };
type University = { _id: string; name: string; courses: Course[] };
type Course = { _id: string; name: string; classes: Class[] };
type Class = { _id: string; name: string; students: Student[] };
type Student = { _id: string; name: string };

export function AcademicFilter({
  entityType,
  multiple = false,
  onSelect,
  additionalParams,
}: AcademicFilterProps) {
  const { user } = useAuth();
  const rawRoles = Array.isArray(user?.role) ? user.role : [user?.role];
  const role = (rawRoles.find((r): r is Role =>
    ["admin", "course-coordinator", "professor"].includes(r || "")
  ) ?? "admin") as Role;

  const universityRef = useRef<string>("");
  const courseRef = useRef<string>("");
  const classRef = useRef<string>("");

  const [selectedUniversity, setSelectedUniversity] = useState(
    additionalParams?.universityId || ""
  );
  const [selectedCourse, setSelectedCourse] = useState(
    additionalParams?.courseId || ""
  );
  const [selectedClass, setSelectedClass] = useState(
    additionalParams?.classId || ""
  );
  const [selectedDiscipline, setSelectedDiscipline] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: academicData,
    isLoading,
    error,
  } = useQuery<AcademicDataResponse>({
    queryKey: ["academicData"],
    queryFn: academicFiltersApi.getAcademicData,
    staleTime: 4 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  useEffect(() => {
    universityRef.current = selectedUniversity;
    courseRef.current = selectedCourse;
    classRef.current = selectedClass;
  }, [selectedUniversity, selectedCourse, selectedClass]);

  const universities = useMemo(
    () =>
      academicData?.data?.universities?.map((u) => ({
        _id: u._id,
        name: u.name,
        courses: u.courses || [],
      })) || [],
    [academicData]
  );

  const courses = useMemo(() => {
    const university = universities.find((u) => u._id === selectedUniversity);
    return university?.courses?.map((c) => ({
      _id: c._id,
      name: c.name,
      classes: c.classes || [],
    })) || [];
  }, [universities, selectedUniversity]);

  const classes = useMemo(() => {
    const course = courses.find((c) => c._id === selectedCourse);
    return course?.classes?.map((cl) => ({
      _id: cl._id,
      name: cl.name,
      students: cl.students || [],
    })) || [];
  }, [courses, selectedCourse]);

  const entities = useMemo(() => {
    switch (entityType) {
      case "university":
        return universities;
      case "course":
        return courses;
      case "class":
        return classes;
      case "student":
        const selected = classes.find((c) => c._id === selectedClass);
        return selected?.students?.map((s) => ({
          _id: s._id,
          name: s.name,
        })) || [];
      default:
        return [];
    }
  }, [entityType, universities, courses, classes, selectedClass]);

  const filteredEntities = useMemo(
    () =>
      entities.filter((entity) =>
        entity.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [entities, searchTerm]
  );

  const toggleItem = useCallback(
    (id: string) => {
      const updated = multiple
        ? selectedIds.includes(id)
          ? selectedIds.filter((i) => i !== id)
          : [...selectedIds, id]
        : [id];

      setSelectedIds(updated);

      const hierarchyInfo = {
        universityId: selectedUniversity || undefined,
        courseId: selectedCourse || undefined,
        classId: selectedClass || undefined,
        disciplineId: selectedDiscipline || undefined,
      };

      onSelect(updated, hierarchyInfo);

      if (!multiple) setOpen(false);
    },
    [
      multiple,
      selectedIds,
      selectedUniversity,
      selectedCourse,
      selectedClass,
      selectedDiscipline,
      onSelect,
    ]
  );

  const isCoursesDisabled =
    !selectedUniversity || isLoading || universities.length === 0;
  const isClassesDisabled =
    !selectedCourse || isLoading || courses.length === 0;
  const isEntitiesDisabled =
    (entityType === "course" && !selectedUniversity) ||
    (entityType === "class" && (!selectedUniversity || !selectedCourse)) ||
    (entityType === "student" && !selectedClass) ||
    isLoading;

  const selectedNames = selectedIds.map((id) => {
    const entity = entities.find((e) => e._id === id);
    return entity ? entity.name : id;
  });

  const selectionLimit = multiple ? 2 : 1;
  const hasReachedLimit = selectedIds.length >= selectionLimit;

  if (error) return <div>Erro ao carregar dados</div>;

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Universidade */}
        <div className="relative">
          <select
            value={selectedUniversity}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedUniversity(val);
              setSelectedCourse("");
              setSelectedClass("");
              setSelectedDiscipline("");
              setSelectedIds([]);
              onSelect([], { universityId: val });
            }}
            className="p-2 rounded-md bg-[#141414] text-white border border-white/10 w-full"
            disabled={isLoading}
          >
            <option value="">Selecione a Universidade</option>
            {universities.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>
          {isLoading && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
            </div>
          )}
        </div>

        {/* Curso */}
        {["course", "class", "student", "discipline"].includes(entityType) && (
          <div className="relative">
            <select
              value={selectedCourse}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedCourse(val);
                setSelectedClass("");
                setSelectedDiscipline("");
                setSelectedIds([]);
                onSelect([], {
                  universityId: selectedUniversity,
                  courseId: val,
                });
              }}
              disabled={isCoursesDisabled}
              className={cn(
                "p-2 rounded-md bg-[#141414] text-white border border-white/10 w-full",
                isCoursesDisabled && "opacity-50"
              )}
            >
              <option value="">Selecione o Curso</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            {isLoading && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
              </div>
            )}
          </div>
        )}

        {/* Turma */}
        {["class", "student"].includes(entityType) && (
          <div className="relative">
            <select
              value={selectedClass}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedClass(val);
                setSelectedIds([]);
                onSelect([], {
                  universityId: selectedUniversity,
                  courseId: selectedCourse,
                  classId: val,
                });
              }}
              disabled={isClassesDisabled}
              className={cn(
                "p-2 rounded-md bg-[#141414] text-white border border-white/10 w-full",
                isClassesDisabled && "opacity-50"
              )}
            >
              <option value="">Selecione a Turma</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            {isLoading && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Entidades */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={isEntitiesDisabled}
            className={cn(
              "w-full justify-between bg-[#141414] text-white border border-white/10",
              isEntitiesDisabled && "opacity-50"
            )}
          >
            {selectedIds.length > 0
              ? multiple
                ? `${selectedIds.length} selecionado(s)`
                : selectedNames[0] || selectedIds[0]
              : `Selecione ${entityType === "student"
                ? "o aluno"
                : entityType === "class"
                  ? "a turma"
                  : entityType === "course"
                    ? "o curso"
                    : "a universidade"
              }`}
            {isLoading ? (
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
              {isLoading ? "Carregando..." : "Nenhum encontrado."}
            </CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {filteredEntities.map((item) => {
                const isSelected = selectedIds.includes(item._id);
                const isDisabled = hasReachedLimit && !isSelected && multiple;
                return (
                  <CommandItem
                    key={item._id}
                    onSelect={() => !isDisabled && toggleItem(item._id)}
                    className={cn(
                      "text-white hover:bg-white/5 cursor-pointer transition-colors",
                      isSelected && "bg-white/10",
                      isDisabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {item.name}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedIds.length > 0 && multiple && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedNames.map((name, index) => (
            <div
              key={selectedIds[index]}
              className="bg-indigo-500/20 border border-indigo-500/30 text-white px-2 py-1 rounded-md text-sm flex items-center"
            >
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

      {multiple && (
        <div className="text-xs text-white/60 mt-1">
          {selectedIds.length === 0
            ? "Selecione exatamente duas entidades para comparação"
            : selectedIds.length === 1
              ? "Selecione mais uma entidade para comparação"
              : "Comparação disponível com as entidades selecionadas"}
        </div>
      )}
    </motion.div>
  );
}
