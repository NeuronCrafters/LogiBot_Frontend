import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-Auth";
import { academicFiltersApi } from "@/services/apiClient";
import { LogEntityType } from "@/services/api/api_routes";
import { AcademicDataResponse, Student } from "@/@types/AcademicData";

/* ---------- Props ---------- */
interface AcademicFilterProps {
  entityType: LogEntityType;
  multiple?: boolean;
  onSelect: (
    ids: string[],
    hierarchy?: {
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

/* ---------- Componente ---------- */
export function AcademicFilter({
  entityType,
  multiple = false,
  onSelect,
  additionalParams,
}: AcademicFilterProps) {
  /* ---------- Auth ---------- */
  const { user } = useAuth();

  /* ---------- Estados de UI ---------- */
  const [searchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [, setOpen] = useState(false);

  /* ---------- Query de dados acadêmicos ---------- */
  const { data, isLoading, error } = useQuery<AcademicDataResponse>({
    queryKey: ["academicData", user?._id],
    queryFn: academicFiltersApi.getAcademicData,
    staleTime: 1000 * 60 * 60 * 4,
  });

  if (!user) return null;

  /* ---------- Lógica de Roles ---------- */
  const roles = Array.isArray(user.role) ? user.role : [user.role];
  const isAdmin = roles.includes("admin");
  const isCoordinator = roles.includes("course-coordinator");
  const isProfessor = roles.includes("professor");

  /* ---------- IDs fixos do usuário ---------- */
  const first = <T,>(v: T | T[]) =>
    Array.isArray(v) ? (v.length ? v[0] : undefined) : v;

  const userUniversityId = first(user.schoolId) as string || "";

  const normalizeToId = (v: unknown): string => {
    if (typeof v === "string") return v.trim();

    if (v && typeof v === "object") {
      const obj = v as Record<string, any>;
      return (obj.id || obj._id || obj.$oid || "").toString().trim();
    }

    return "";
  };

  const collectIds = (input: unknown): string[] => {
    const arr = Array.isArray(input) ? input : input ? [input] : [];
    return [...new Set(
      arr
        .map(normalizeToId)
        .filter((id): id is string => id.length > 0)
    )];
  };

  const userCourseIds = collectIds(user?.courses?.length ? user.courses : user.courseId);

  // Disciplinas do professor
  const userDisciplineIds = useMemo(() => {
    if (!isProfessor) return [];
    return collectIds(
      user.disciplines ?? user.disciplineId ?? user.discipline
    );
  }, [user, isProfessor, user?._id]);

  /* ---------- Estados de seleção ---------- */
  const [selectedUniversity, setSelectedUniversity] = useState(
    additionalParams?.universityId || userUniversityId
  );

  // AUTO-SELECT se professor tiver apenas 1 curso
  const [selectedCourse, setSelectedCourse] = useState(
    additionalParams?.courseId ||
    (isProfessor && userCourseIds.length === 1 ? userCourseIds[0] : "")
  );

  const [selectedClass, setSelectedClass] = useState(
    additionalParams?.classId || ""
  );

  const [selectedDiscipline, setSelectedDiscipline] = useState("");

  /* ---------- Listas filtradas ---------- */
  const universities = useMemo(() => {
    const all = data?.data?.universities ?? [];
    if (isAdmin) return all;
    return all.filter((u) => u._id === userUniversityId);
  }, [data, isAdmin, userUniversityId, user?._id]);

  const courses = useMemo(() => {
    const uni = universities.find((u) => u._id === selectedUniversity);
    const all = uni?.courses ?? [];

    if (isAdmin) return all;
    if (isCoordinator) return all;
    if (isProfessor) {
      return all.filter((c) => userCourseIds.includes(c._id));
    }
    return [];
  }, [universities, selectedUniversity, isAdmin, isCoordinator, isProfessor, userCourseIds, user?._id]);

  const classes = useMemo(() => {
    const crs = courses.find((c) => c._id === selectedCourse);
    const all = crs?.classes ?? [];

    if (isAdmin || isCoordinator) return all;
    if (isProfessor) {
      return all.filter((classe) =>
        classe.disciplines?.some(d => userDisciplineIds.includes(d._id))
      );
    }
    return [];
  }, [courses, selectedCourse, isAdmin, isCoordinator, isProfessor, userDisciplineIds, user?._id]);


  const disciplines = useMemo(() => {
    const crs = courses.find((c) => c._id === selectedCourse);
    const all = crs?.disciplines ?? [];

    if (isAdmin || isCoordinator) return all;
    if (isProfessor) {
      return all.filter((disc) => userDisciplineIds.includes(disc._id));
    }
    return [];
  }, [courses, selectedCourse, isAdmin, isCoordinator, isProfessor, userDisciplineIds, user?._id]);

  /* ---------- Entidades finais ---------- */
  const entities = useMemo(() => {
    switch (entityType) {
      case "university":
        return universities;
      case "course":
        return courses;
      case "class":
        return classes;
      case "discipline":
        return disciplines;
      case "student": {
        if (isAdmin || isCoordinator) {
          const cls = classes.find((c) => c._id === selectedClass);
          return cls?.students ?? [];
        }
        if (isProfessor) {
          const allStudents: Student[] = [];
          if (selectedDiscipline) {
            classes.forEach((classe) => {
              if (
                classe.disciplines?.some(d => d._id === selectedDiscipline) &&
                classe.students
              ) {
                allStudents.push(...classe.students);
              }
            });
          }
          return allStudents.filter((student, index, self) =>
            index === self.findIndex((s) => s._id === student._id)
          );
        }
        return [];
      }
      default:
        return [];
    }
  }, [entityType, universities, courses, classes, disciplines, selectedClass, isAdmin, isCoordinator, isProfessor, user?._id, selectedDiscipline]);

  /* ---------- Filtro de busca ---------- */
  const filteredEntities = entities.filter((e) =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ---------- Helpers de seleção ---------- */
  // const selectionLimit = multiple ? 2 : 1;
  // const hasReachedLimit = selectedIds.length >= selectionLimit;

  const toggleItem = useCallback(
    (id: string) => {
      const updated = multiple
        ? selectedIds.includes(id)
          ? selectedIds.filter((i) => i !== id)
          : [...selectedIds, id]
        : [id];

      setSelectedIds(updated);

      const hierarchy = {
        universityId: selectedUniversity || undefined,
        courseId: selectedCourse || undefined,
        classId: selectedClass || undefined,
        disciplineId: entityType === 'discipline' ? id : selectedDiscipline || undefined,
      };

      onSelect(updated, hierarchy);

      if (!multiple) setOpen(false);
    },
    [multiple, selectedIds, selectedUniversity, selectedCourse, selectedClass, onSelect, entityType, selectedDiscipline]
  );

  const selectedNames = selectedIds
    .map((id) => entities.find((e) => e._id === id)?.name ?? id)
    .filter(Boolean);

  const showUniversitySelect =
    !["university"].includes(entityType) &&
    ["course", "class", "student", "discipline"].includes(entityType) &&
    !isProfessor;

  const showCourseSelect =
    !["course"].includes(entityType) &&
    ["class", "student", "discipline"].includes(entityType);

  // Não mostrar turma para professores
  const showClassSelect =
    !["class"].includes(entityType) &&
    ["student"].includes(entityType) &&
    (isAdmin || isCoordinator);

  /* ---------- Habilitação dos selects ---------- */
  const isUniversityEnabled = universities.length > 0;
  const isCourseEnabled = !!selectedUniversity && courses.length > 0;
  const isClassEnabled = !!selectedCourse && classes.length > 0;

  /* ---------- Pode mostrar o seletor final? ---------- */
  const canShowEntitySelector = () => {
    switch (entityType) {
      case "university":
        return isAdmin;
      case "course":
        return !!selectedUniversity;
      case "class":
        return !!selectedUniversity && !!selectedCourse;
      case "discipline":
        return !!selectedUniversity && !!selectedCourse;
      case "student":
        if (isProfessor) return !!selectedUniversity && !!selectedCourse && !!selectedDiscipline;
        return !!selectedUniversity && !!selectedCourse && !!selectedClass;
      default:
        return false;
    }
  };

  const handleDisciplineChange = (disciplineId: string) => {
    setSelectedDiscipline(disciplineId);
    setSelectedIds([]); // Limpa outras seleções
    onSelect([], {
      universityId: selectedUniversity,
      courseId: selectedCourse,
      disciplineId: disciplineId,
    });
  };

  console.log("🧩 AcademicFilter Debug", {
    user,
    userUniversityId,
    userCourseIds,
    userDisciplineIds,
    academicData: data?.data,
    universidades: universities,
    cursos: courses,
    disciplinas: disciplines,
    turmas: classes,
  });


  /* ---------- Render ---------- */
  if (error) return <div className="text-red-500">Erro ao carregar dados</div>;

  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="grid gap-4 md:grid-cols-4">
        {/* Select de Universidade */}
        {showUniversitySelect && (
          <select
            className={cn(
              "p-3 rounded-md bg-[#141414] text-white border border-white/10",
              !isUniversityEnabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={!isUniversityEnabled || isLoading}
            value={selectedUniversity}
            onChange={(e) => {
              setSelectedUniversity(e.target.value);
              setSelectedCourse("");
              setSelectedClass("");
              setSelectedIds([]);
              onSelect([], { universityId: e.target.value });
            }}
          >
            <option value="">
              {isAdmin ? "Selecione a Universidade" : universities[0]?.name || "Universidade"}
            </option>
            {universities.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>
        )}

        {/* Select de Curso */}
        {showCourseSelect && (
          <select
            className={cn(
              "p-3 rounded-md bg-[#141414] text-white border border-white/10",
              !isCourseEnabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={!isCourseEnabled || isLoading}
            value={selectedCourse}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              setSelectedClass("");
              setSelectedIds([]);
              onSelect([], {
                universityId: selectedUniversity,
                courseId: e.target.value,
              });
            }}
          >
            <option value="">
              {!selectedUniversity
                ? "Selecione a Universidade primeiro"
                : courses.length === 0
                  ? "Nenhum curso disponível"
                  : "Selecione o Curso"}
            </option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        {/* Select de Disciplina (para professor) */}
        {isProfessor && entityType === "student" && (
          <select
            className={cn(
              "p-3 rounded-md bg-[#141414] text-white border border-white/10",
              !isCourseEnabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={!isCourseEnabled || isLoading}
            value={selectedDiscipline}
            onChange={(e) => handleDisciplineChange(e.target.value)}
          >
            <option value="">Selecione a Disciplina</option>
            {disciplines.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
        )}

        {/* Select de Turma (não mostrado para professores) */}
        {showClassSelect && (
          <select
            className={cn(
              "p-3 rounded-md bg-[#141414] text-white border border-white/10",
              !isClassEnabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={!isClassEnabled || isLoading}
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setSelectedIds([]);
              onSelect([], {
                universityId: selectedUniversity,
                courseId: selectedCourse,
                classId: e.target.value,
              });
            }}
          >
            <option value="">
              {!selectedCourse
                ? "Selecione o Curso primeiro"
                : classes.length === 0
                  ? "Nenhuma turma disponível"
                  : "Selecione a Turma"}
            </option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        {/* Select final de entidade (ajustado para seguir padrão) */}
        {canShowEntitySelector() && (
          <select
            className={cn(
              "p-3 rounded-md bg-[#141414] text-white border border-white/10",
              (!canShowEntitySelector() || isLoading) && "opacity-50 cursor-not-allowed"
            )}
            disabled={!canShowEntitySelector() || isLoading}
            value={selectedIds[0] ?? ""}
            onChange={(e) => {
              const newId = e.target.value;
              toggleItem(newId);
            }}
          >
            <option value="">
              {isLoading
                ? "Carregando..."
                : `Selecione ${entityType === "student"
                  ? "o aluno"
                  : entityType === "discipline"
                    ? "a disciplina"
                    : entityType === "class"
                      ? "a turma"
                      : entityType === "course"
                        ? "o curso"
                        : "a universidade"
                }`}
            </option>
            {filteredEntities.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Tags quando múltiplo */}
      {multiple && selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {selectedNames.map((name, idx) => (
            <div
              key={selectedIds[idx]}
              className="flex items-center px-3 py-1 text-sm text-white rounded-full border bg-indigo-500/20 border-indigo-500/30"
            >
              {name}
              <button
                className="ml-2 hover:text-white/90"
                onClick={() => toggleItem(selectedIds[idx])}
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