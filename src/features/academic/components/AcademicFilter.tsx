import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Select } from "@/components/ui/select";
import { academicFiltersApi } from "@/services/apiClient";
import { LogEntityType } from "@/services/api/api_routes";
import { AcademicDataResponse, Student } from "@/features/academic/types";

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
    },
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
  const userUniversityId = (first(user.schoolId) as string) || "";

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
    return [
      ...new Set(
        arr.map(normalizeToId).filter((id): id is string => id.length > 0),
      ),
    ];
  };

  const userCourseIds = collectIds(
    user?.courses?.length ? user.courses : user.courseId,
  );
  const userClassIds = collectIds(
    user?.classes?.length ? user.classes : (user.classId ?? user.class),
  );

  const userDisciplineIds = useMemo(() => {
    if (!isProfessor) return [];
    return collectIds(user.disciplines ?? user.disciplineId ?? user.discipline);
  }, [user, isProfessor, user?._id]);

  const [selectedUniversity, setSelectedUniversity] = useState(
    additionalParams?.universityId || userUniversityId,
  );
  const [selectedCourse, setSelectedCourse] = useState(
    additionalParams?.courseId ||
      (isProfessor && userCourseIds.length === 1 ? userCourseIds[0] : ""),
  );
  const [selectedClass, setSelectedClass] = useState(
    additionalParams?.classId || "",
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
    if (isProfessor) return all.filter((c) => userCourseIds.includes(c._id));
    return [];
  }, [
    universities,
    selectedUniversity,
    isAdmin,
    isCoordinator,
    isProfessor,
    userCourseIds,
    user?._id,
  ]);

  const classes = useMemo(() => {
    const crs = courses.find((c) => c._id === selectedCourse);
    const all = crs?.classes ?? [];
    if (isAdmin || isCoordinator) return all;
    if (isProfessor)
      return all.filter(
        (classe) =>
          userClassIds.includes(classe._id) ||
          classe.disciplines?.some((d) => userDisciplineIds.includes(d._id)),
      );
    return [];
  }, [
    courses,
    selectedCourse,
    isAdmin,
    isCoordinator,
    isProfessor,
    userClassIds,
    userDisciplineIds,
    user?._id,
  ]);

  const disciplines = useMemo(() => {
    const crs = courses.find((c) => c._id === selectedCourse);
    const all = crs?.disciplines ?? [];
    if (isAdmin || isCoordinator) return all;
    if (isProfessor) {
      return all.filter(
        (disc) =>
          userDisciplineIds.includes(disc._id) ||
          crs?.classes?.some(
            (classe) =>
              userClassIds.includes(classe._id) &&
              classe.disciplines?.some((item) => item._id === disc._id),
          ),
      );
    }
    return [];
  }, [
    courses,
    selectedCourse,
    isAdmin,
    isCoordinator,
    isProfessor,
    userClassIds,
    userDisciplineIds,
    user?._id,
  ]);

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
          classes.forEach((classe) => {
            if (selectedClass && classe._id !== selectedClass) return;
            if (
              selectedDiscipline &&
              !classe.disciplines?.some((d) => d._id === selectedDiscipline)
            )
              return;
            if (classe.students) allStudents.push(...classe.students);
          });
          return allStudents.filter(
            (student, index, self) =>
              index === self.findIndex((s) => s._id === student._id),
          );
        }
        return [];
      }
      default:
        return [];
    }
  }, [
    entityType,
    universities,
    courses,
    classes,
    disciplines,
    selectedClass,
    isAdmin,
    isCoordinator,
    isProfessor,
    user?._id,
    selectedDiscipline,
  ]);

  const filteredEntities = entities.filter((e) =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()),
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
        disciplineId:
          entityType === "discipline" ? id : selectedDiscipline || undefined,
      };
      onSelect(updated, hierarchy);
      if (!multiple) setOpen(false);
    },
    [
      multiple,
      selectedIds,
      selectedUniversity,
      selectedCourse,
      selectedClass,
      onSelect,
      entityType,
      selectedDiscipline,
    ],
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
    (isAdmin || isCoordinator || isProfessor);

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
        if (isProfessor) return !!selectedUniversity && !!selectedCourse;
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
      disciplineId,
    });
  };

  if (error) return <div className="text-red-500">Failed to load data</div>;

  return (
    <div className="w-full">
      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-4">
        {showUniversitySelect && (
          <Select
            disabled={!isUniversityEnabled || isLoading}
            value={selectedUniversity}
            onChange={(v) => {
              setSelectedUniversity(v);
              setSelectedCourse("");
              setSelectedClass("");
              setSelectedDiscipline("");
              setSelectedIds([]);
              onSelect([], { universityId: v });
            }}
            placeholder={isAdmin ? "Select the University" : universities[0]?.name || "University"}
            options={universities.map((u) => ({ value: u._id, label: u.name }))}
          />
        )}

        {showCourseSelect && (
          <Select
            disabled={!isCourseEnabled || isLoading}
            value={selectedCourse}
            onChange={(v) => {
              setSelectedCourse(v);
              setSelectedClass("");
              setSelectedDiscipline("");
              setSelectedIds([]);
              onSelect([], { universityId: selectedUniversity, courseId: v });
            }}
            placeholder={!selectedUniversity ? "Select the University..." : courses.length === 0 ? "No program available" : "Select the Program"}
            options={courses.map((c) => ({ value: c._id, label: c.name }))}
          />
        )}

        {isProfessor && entityType === "student" && (
          <Select
            disabled={!isCourseEnabled || isLoading}
            value={selectedDiscipline}
            onChange={handleDisciplineChange}
            placeholder="Select the Subject"
            options={disciplines.map((d) => ({ value: d._id, label: d.name }))}
          />
        )}

        {showClassSelect && (
          <Select
            disabled={!isClassEnabled || isLoading}
            value={selectedClass}
            onChange={(v) => {
              setSelectedClass(v);
              setSelectedIds([]);
              onSelect([], { universityId: selectedUniversity, courseId: selectedCourse, classId: v });
            }}
            placeholder={!selectedCourse ? "Select the Program..." : classes.length === 0 ? "No class available" : "Select the Class"}
            options={classes.map((c) => ({ value: c._id, label: c.name }))}
          />
        )}

        {canShowEntitySelector() && (
          <Select
            disabled={!canShowEntitySelector() || isLoading}
            value={selectedIds[0] ?? ""}
            onChange={(v) => { if (v) toggleItem(v); }}
            placeholder={isLoading ? "Loading..." : `Select ${entityType === "student" ? "the student" : entityType === "discipline" ? "the subject" : entityType === "class" ? "the class" : entityType === "course" ? "the program" : "the university"}`}
            options={filteredEntities.map((item) => ({ value: item._id, label: item.name }))}
          />
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
    </div>
  );
}
