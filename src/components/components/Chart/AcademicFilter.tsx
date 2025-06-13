import { useState, useMemo, useCallback, useEffect } from "react";
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

// type Option = { _id: string; name: string };
// type University = { _id: string; name: string; courses: Course[] };
// type Course = { _id: string; name: string; classes: Class[] };
// type Class = { _id: string; name: string; students: Student[] };
// type Student = { _id: string; name: string };

export function AcademicFilter({
  entityType,
  multiple = false,
  onSelect,
  additionalParams,
}: AcademicFilterProps) {
  const { user } = useAuth();
  if (!user) return null;

  // Determinar o papel do usuário seguindo o padrão estabelecido
  const roles = Array.isArray(user.role) ? user.role : [user.role];
  const isAdmin = roles.includes("admin");
  const isCoordinator = roles.includes("course-coordinator");
  const isProfessor = roles.includes("professor");

  // Valores fixos do usuário baseado na interface User correta
  const userUniversityId = user.school ||
    (Array.isArray(user.schoolId) ? user.schoolId[0] : user.schoolId) ||
    (typeof user.schoolName === 'string' ? user.schoolName :
      Array.isArray(user.schoolName) ? user.schoolName[0] : "") || "";

  const userCourseId: string = (() => {
    const extractId = (value: unknown): string => {
      if (Array.isArray(value)) return extractId(value[0]);
      if (value && typeof value === 'object' && 'id' in value && typeof (value as any).id === 'string') {
        return (value as any).id;
      }
      if (typeof value === 'string') return value;
      return '';
    };

    return (
      extractId(user.courseId) ||
      extractId(user.course) ||
      extractId(user.courses)
    );
  })();

  const userClassIds = (() => {
    if (user.classId) {
      const classIds = Array.isArray(user.classId) ? user.classId : [user.classId];
      return classIds.map(id => {
        if (typeof id === 'object' && id !== null && 'id' in Array(id)) {
          return (id as { id: string }).id;
        }
        return id as string;
      });
    }
    if (user.class) {
      const classes = Array.isArray(user.class) ? user.class : [user.class];
      return classes.map(cls => {
        if (typeof cls === 'object' && cls !== null && 'id' in Array(cls)) {
          return (cls as { id: string }).id;
        }
        return cls as string;
      });
    }
    return [];
  })();

  const [selectedUniversity, setSelectedUniversity] = useState(
    additionalParams?.universityId || ""
  );
  const [selectedCourse, setSelectedCourse] = useState(
    additionalParams?.courseId || ""
  );
  const [selectedClass, setSelectedClass] = useState(
    additionalParams?.classId || ""
  );
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

  // Debug: mostrar dados do usuário para verificar
  useEffect(() => {
    console.log("🔍 Debug User Data:", {
      user: {
        school: user.school,
        schoolId: user.schoolId,
        schoolName: user.schoolName,
        courseId: user.courseId,
        course: user.course,
        courses: user.courses,
        classId: user.classId,
        class: user.class,
      },
      computed: {
        userUniversityId,
        userCourseId,
        userClassIds,
      },
      isAdmin,
      isCoordinator,
      isProfessor,
    });

    // Log adicional para identificar campo correto da universidade
    console.log("🎯 Campos de universidade disponíveis:", {
      school: user.school,
      schoolId: user.schoolId,
      schoolName: user.schoolName,
    });
  }, [user, userUniversityId, userCourseId, userClassIds, isAdmin, isCoordinator, isProfessor]);

  // Filtrar universidades baseado no papel do usuário
  const universities = useMemo(() => {
    const allUniversities = academicData?.data?.universities?.map((u) => ({
      _id: u._id,
      name: u.name,
      courses: u.courses || [],
    })) || [];

    if (isAdmin) {
      return allUniversities; // Admin vê todas
    }

    // Coordenador e Professor só veem SUA universidade
    if (userUniversityId) {
      return allUniversities.filter(u => u._id === userUniversityId);
    }

    return [];
  }, [academicData, isAdmin, userUniversityId]);

  // Filtrar cursos baseado no papel do usuário
  const courses = useMemo(() => {
    const university = universities.find((u) => u._id === selectedUniversity);
    const allCourses = university?.courses?.map((c) => ({
      _id: c._id,
      name: c.name,
      classes: c.classes || [],
    })) || [];

    if (isAdmin) {
      return allCourses; // Admin vê todos os cursos da universidade selecionada
    }

    // Coordenador e Professor só veem SEU curso
    if (userCourseId) {
      return allCourses.filter(c => c._id === userCourseId);
    }

    return [];
  }, [universities, selectedUniversity, isAdmin, userCourseId]);

  // Filtrar turmas baseado no papel do usuário
  const classes = useMemo(() => {
    const course = courses.find((c) => c._id === selectedCourse);
    const allClasses = course?.classes?.map((cl) => ({
      _id: cl._id,
      name: cl.name,
      students: cl.students || [],
    })) || [];

    if (isAdmin) {
      return allClasses; // Admin vê todas as turmas do curso selecionado
    }

    if (isCoordinator) {
      return allClasses; // Coordenador vê todas as turmas do SEU curso
    }

    if (isProfessor) {
      // Professor só vê SUAS turmas (onde ministra)
      if (Array.isArray(userClassIds) && userClassIds.length > 0) {
        return allClasses.filter(cl => userClassIds.includes(cl._id));
      }
    }

    return [];
  }, [courses, selectedCourse, isAdmin, isCoordinator, isProfessor, userClassIds]);

  // Debug: mostrar dados filtrados
  useEffect(() => {
    console.log("📊 Debug Filtered Data:", {
      entityType,
      selectedValues: { selectedUniversity, selectedCourse, selectedClass },
      availableData: {
        universities: universities.map(u => ({ id: u._id, name: u.name })),
        courses: courses.map(c => ({ id: c._id, name: c.name })),
        classes: classes.map(cl => ({ id: cl._id, name: cl.name })),
      },
    });
  }, [entityType, universities, courses, classes, selectedUniversity, selectedCourse, selectedClass]);

  // Entidades finais para seleção
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

  // Resetar seleções quando mudar o tipo de entidade
  useEffect(() => {
    setSelectedIds([]);
    if (isAdmin) {
      setSelectedUniversity("");
      setSelectedCourse("");
    }
    setSelectedClass("");
    setSearchTerm("");
  }, [entityType, isAdmin]);

  // Efeito cascata: limpar seleções dependentes
  useEffect(() => {
    if (isAdmin) {
      setSelectedCourse("");
    }
    setSelectedClass("");
    setSelectedIds([]);
  }, [selectedUniversity, isAdmin]);

  useEffect(() => {
    setSelectedClass("");
    setSelectedIds([]);
  }, [selectedCourse]);

  useEffect(() => {
    setSelectedIds([]);
  }, [selectedClass]);

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
      onSelect,
    ]
  );

  const selectedNames = selectedIds.map((id) => {
    const entity = entities.find((e) => e._id === id);
    return entity ? entity.name : id;
  });

  const selectionLimit = multiple ? 2 : 1;
  const hasReachedLimit = selectedIds.length >= selectionLimit;

  // Verificar se pode mostrar o seletor final baseado nas regras de permissão
  const canShowEntitySelector = () => {
    switch (entityType) {
      case "university":
        return isAdmin; // Só admin pode ver dados de universidade
      case "course":
        return !!selectedUniversity; // Precisa ter universidade selecionada
      case "class":
        return !!selectedUniversity && !!selectedCourse; // Precisa ter universidade e curso
      case "student":
        return !!selectedUniversity && !!selectedCourse && !!selectedClass; // Precisa ter tudo selecionado
      default:
        return false;
    }
  };

  // Verificar quais selects mostrar baseado no entityType (SEMPRE os mesmos para todos)
  const shouldShowUniversitySelect = () => {
    return ["course", "class", "student"].includes(entityType);
  };

  const shouldShowCourseSelect = () => {
    return ["class", "student"].includes(entityType);
  };

  const shouldShowClassSelect = () => {
    return ["student"].includes(entityType);
  };

  if (error) return <div className="text-red-400">Erro ao carregar dados</div>;

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Indicador do nível de acesso */}
      {/* <div className="px-3 py-2 text-xs border rounded-md text-white/60 bg-white/5 border-white/10">
        <span className="font-medium">Nível de acesso:</span> {
          isAdmin ? "Administrador (acesso total)" :
            isCoordinator ? "Coordenador (limitado ao seu curso)" :
              "Professor (limitado às suas turmas)"
        }
      </div> */}

      {/* Grid de Hierarquia */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {/* Universidade */}
        {shouldShowUniversitySelect() && (
          <div className="relative">
            {/* <label className="block mb-2 text-sm font-medium text-white/70">
              Universidade
              {!isAdmin && (
                <span className="ml-1 text-blue-400">(Sua universidade)</span>
              )}
            </label> */}
            <select
              value={selectedUniversity}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedUniversity(val);
                onSelect([], { universityId: val });
              }}
              className="p-3 rounded-md bg-[#141414] text-white border border-white/10 w-full focus:border-indigo-500 focus:outline-none transition-colors"
              disabled={isLoading}
            >
              <option value="">Selecione a Universidade</option>
              {universities.length === 0 && !isLoading && (
                <option value="" disabled>
                  {isAdmin ? "Carregando universidades..." : "Sua universidade não foi encontrada"}
                </option>
              )}
              {universities.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
            {isLoading && (
              <div className="absolute transform -translate-y-1/2 right-3 top-1/2">
                <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
              </div>
            )}
          </div>
        )}

        {/* Curso */}
        {shouldShowCourseSelect() && (
          <div className="relative">
            {/* <label className="block mb-2 text-sm font-medium text-white/70">
              Curso
              {isCoordinator && (
                <span className="ml-1 text-blue-400">(Curso que coordena)</span>
              )}
              {isProfessor && (
                <span className="ml-1 text-blue-400">(Curso onde ministra)</span>
              )}
            </label> */}
            <select
              value={selectedCourse}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedCourse(val);
                onSelect([], {
                  universityId: selectedUniversity,
                  courseId: val,
                });
              }}
              disabled={!selectedUniversity || isLoading}
              className={cn(
                "p-3 rounded-md bg-[#141414] text-white border border-white/10 w-full focus:border-indigo-500 focus:outline-none transition-colors",
                (!selectedUniversity || isLoading) && "opacity-50 cursor-not-allowed"
              )}
            >
              <option value="">
                {!selectedUniversity ? "Primeiro selecione a Universidade" : "Selecione o Curso"}
              </option>
              {courses.length === 0 && selectedUniversity && !isLoading && (
                <option value="" disabled>
                  {isAdmin ? "Nenhum curso encontrado" : "Seu curso não foi encontrado"}
                </option>
              )}
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Turma */}
        {shouldShowClassSelect() && (
          <div className="relative">
            {/* <label className="block mb-2 text-sm font-medium text-white/70">
              Turma
              {isCoordinator && (
                <span className="ml-1 text-blue-400">(Turmas do seu curso)</span>
              )}
              {isProfessor && (
                <span className="ml-1 text-blue-400">(Suas turmas)</span>
              )}
            </label> */}
            <select
              value={selectedClass}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedClass(val);
                onSelect([], {
                  universityId: selectedUniversity,
                  courseId: selectedCourse,
                  classId: val,
                });
              }}
              disabled={!selectedCourse || isLoading}
              className={cn(
                "p-3 rounded-md bg-[#141414] text-white border border-white/10 w-full focus:border-indigo-500 focus:outline-none transition-colors",
                (!selectedCourse || isLoading) && "opacity-50 cursor-not-allowed"
              )}
            >
              <option value="">
                {!selectedCourse ? "Primeiro selecione o Curso" : "Selecione a Turma"}
              </option>
              {classes.length === 0 && selectedCourse && !isLoading && (
                <option value="" disabled>
                  {isAdmin ? "Nenhuma turma encontrada" :
                    isProfessor ? "Suas turmas não foram encontradas" :
                      "Turmas do curso não encontradas"}
                </option>
              )}
              {classes.map((c: any) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Seletor Final */}
        <div className="relative">
          {/* <label className="block mb-2 text-sm font-medium text-white/70">
            {entityType === "student"
              ? "Aluno(s)"
              : entityType === "class"
                ? "Turma(s)"
                : entityType === "course"
                  ? "Curso(s)"
                  : "Universidade(s)"}
          </label> */}

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                disabled={!canShowEntitySelector() || isLoading}
                className={cn(
                  "w-full justify-between bg-[#141414] text-white border border-white/10 p-3 h-[52px] focus:border-indigo-500 transition-colors",
                  (!canShowEntitySelector() || isLoading) && "opacity-50 cursor-not-allowed"
                )}
              >
                <span className="truncate">
                  {selectedIds.length > 0
                    ? multiple
                      ? `${selectedIds.length} selecionado(s)`
                      : selectedNames[0] || selectedIds[0]
                    : !canShowEntitySelector()
                      ? "Complete a seleção anterior"
                      : `Selecione ${entityType === "student"
                        ? "o aluno"
                        : entityType === "class"
                          ? "a turma"
                          : entityType === "course"
                            ? "o curso"
                            : "a universidade"
                      }`}
                </span>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-2 shrink-0" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-[#1f1f1f] border border-white/10">
              <Command>
                <CommandInput
                  placeholder="Buscar..."
                  className="text-white border-0"
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                <CommandEmpty className="px-4 py-6 text-sm text-center text-white/60">
                  {isLoading ? "Carregando..." : "Nenhum encontrado."}
                </CommandEmpty>
                <CommandGroup className="max-h-[300px] overflow-y-auto">
                  {filteredEntities.map((item: any) => {
                    const isSelected = selectedIds.includes(item._id);
                    const isDisabled = hasReachedLimit && !isSelected && multiple;
                    return (
                      <CommandItem
                        key={item._id}
                        onSelect={() => !isDisabled && toggleItem(item._id)}
                        className={cn(
                          "text-white hover:bg-white/5 cursor-pointer transition-colors px-4 py-3",
                          isSelected && "bg-indigo-500/20",
                          isDisabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Check
                          className={cn(
                            "mr-3 h-4 w-4 text-indigo-400",
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
        </div>
      </div>

      {/* Tags dos Selecionados */}
      {selectedIds.length > 0 && multiple && (
        <div className="flex flex-wrap gap-2">
          {selectedNames.map((name, index) => (
            <div
              key={selectedIds[index]}
              className="flex items-center px-3 py-1 text-sm text-white border rounded-full bg-indigo-500/20 border-indigo-500/30"
            >
              {name}
              <button
                onClick={() => toggleItem(selectedIds[index])}
                className="ml-2 transition-colors text-white/70 hover:text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Mensagem de Status para Comparação */}
      {/* {multiple && (
        <div className={cn(
          "text-xs p-3 rounded-md border transition-colors",
          selectedIds.length === 0
            ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
            : selectedIds.length === 1
              ? "text-blue-400 bg-blue-400/10 border-blue-400/20"
              : "text-green-400 bg-green-400/10 border-green-400/20"
        )}>
          {selectedIds.length === 0
            ? "Selecione exatamente duas entidades para comparação"
            : selectedIds.length === 1
              ? "Selecione mais uma entidade para completar a comparação"
              : "Comparação disponível com as entidades selecionadas"}
        </div>
      )} */}
    </motion.div>
  );
}