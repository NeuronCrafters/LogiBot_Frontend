import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-Auth";
import { academicFiltersApi } from "@/services/apiClient";
import { LogEntityType } from "@/services/api/api_routes";
import { AcademicDataResponse, Student } from "@/@types/AcademicData";

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

export function AcademicFilter({
  entityType,
  multiple = false,
  onSelect,
  additionalParams,
}: AcademicFilterProps) {

  const { user } = useAuth();
  const [searchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [, setOpen] = useState(false);
  const { data, isLoading, error } = useQuery<AcademicDataResponse>({
    queryKey: ["academicData", user?._id],
    queryFn: academicFiltersApi.getAcademicData,
    staleTime: 0,
  });

  if (!user) return null;

  const roles = Array.isArray(user.role) ? user.role : [user.role];
  const isAdmin = roles.includes("admin");
  const isCoordinator = roles.includes("course-coordinator");
  const isProfessor = roles.includes("professor");

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

  const userDisciplineIds = useMemo(() => {
    if (!isProfessor) return [];
    return collectIds(
      user.disciplines ?? user.disciplineId ?? user.discipline
    );
  }, [user, isProfessor, user?._id]);

  const [selectedUniversity, setSelectedUniversity] = useState(
    additionalParams?.universityId || userUniversityId
  );

  const [selectedCourse, setSelectedCourse] = useState(
    additionalParams?.courseId ||
    (isProfessor && userCourseIds.length === 1 ? userCourseIds[0] : "")
  );

  const [selectedClass, setSelectedClass] = useState(
    additionalParams?.classId || ""
  );

  const [selectedDiscipline, setSelectedDiscipline] = useState("");

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

  const filteredEntities = entities.filter((e) =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const showClassSelect =
    !["class"].includes(entityType) &&
    ["student"].includes(entityType) &&
    (isAdmin || isCoordinator);

  const isUniversityEnabled = universities.length > 0;
  const isCourseEnabled = !!selectedUniversity && courses.length > 0;
  const isClassEnabled = !!selectedCourse && classes.length > 0;
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
    setSelectedIds([]);
    onSelect([], {
      universityId: selectedUniversity,
      courseId: selectedCourse,
      disciplineId: disciplineId,
    });
  };

  if (error) return <div className="text-red-500">Erro ao carregar dados</div>;

  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
        {showUniversitySelect && (
          <select
            className={cn(
              "w-full h-12 px-3 rounded-md bg-[#141414] text-white border border-white/10 focus:ring-2 focus:ring-white outline-none",
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
            <option value="" className="bg-[#1f1f1f]">
              {isAdmin ? "Selecione a Universidade" : universities[0]?.name || "Universidade"}
            </option>
            {universities.map((u) => (
              <option key={u._id} value={u._id} className="bg-[#1f1f1f]">
                {u.name}
              </option>
            ))}
          </select>
        )}

        {showCourseSelect && (
          <select
            className={cn(
              "w-full h-12 px-3 rounded-md bg-[#141414] text-white border border-white/10 focus:ring-2 focus:ring-white outline-none",
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
            <option value="" className="bg-[#1f1f1f]">
              {!selectedUniversity
                ? "Selecione a Universidade..."
                : courses.length === 0
                  ? "Nenhum curso disponível"
                  : "Selecione o Curso"}
            </option>
            {courses.map((c) => (
              <option key={c._id} value={c._id} className="bg-[#1f1f1f]">
                {c.name}
              </option>
            ))}
          </select>
        )}

        {isProfessor && entityType === "student" && (
          <select
            className={cn(
              "w-full h-12 px-3 rounded-md bg-[#141414] text-white border border-white/10 focus:ring-2 focus:ring-white outline-none",
              !isCourseEnabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={!isCourseEnabled || isLoading}
            value={selectedDiscipline}
            onChange={(e) => handleDisciplineChange(e.target.value)}
          >
            <option value="" className="bg-[#1f1f1f]">Selecione a Disciplina</option>
            {disciplines.map((d) => (
              <option key={d._id} value={d._id} className="bg-[#1f1f1f]">
                {d.name}
              </option>
            ))}
          </select>
        )}

        {showClassSelect && (
          <select
            className={cn(
              "w-full h-12 px-3 rounded-md bg-[#141414] text-white border border-white/10 focus:ring-2 focus:ring-white outline-none",
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
            <option value="" className="bg-[#1f1f1f]">
              {!selectedCourse
                ? "Selecione o Curso..."
                : classes.length === 0
                  ? "Nenhuma turma disponível"
                  : "Selecione a Turma"}
            </option>
            {classes.map((c) => (
              <option key={c._id} value={c._id} className="bg-[#1f1f1f]">
                {c.name}
              </option>
            ))}
          </select>
        )}

        {canShowEntitySelector() && (
          <select
            className={cn(
              "w-full h-12 px-3 rounded-md bg-[#141414] text-white border border-white/10 focus:ring-2 focus:ring-white outline-none",
              (!canShowEntitySelector() || isLoading) && "opacity-50 cursor-not-allowed"
            )}
            disabled={!canShowEntitySelector() || isLoading}
            value={selectedIds[0] ?? ""}
            onChange={(e) => {
              const newId = e.target.value;
              toggleItem(newId);
            }}
          >
            <option value="" className="bg-[#1f1f1f]">
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
              <option key={item._id} value={item._id} className="bg-[#1f1f1f]">
                {item.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {multiple && selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 w-full">
          {selectedNames.map((name, idx) => (
            <div
              key={selectedIds[idx]}
              className="flex items-center px-3 py-1 text-sm text-white rounded-full border bg-indigo-500/20 border-indigo-500/30 max-w-full"
            >
              <span className="truncate max-w-[200px]">{name}</span>
              <button
                className="ml-2 hover:text-white/90 shrink-0"
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