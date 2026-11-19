import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { academicFiltersApi } from "@/services/apiClient";

/** Classes linked to a discipline, from the academic data the app already loads. */
export function useDisciplineClasses(disciplineId: string) {
  const academic = useQuery({
    queryKey: ["academicData"],
    queryFn: async () => (await academicFiltersApi.getAcademicData()).data,
    staleTime: 5 * 60 * 1000,
  });
  return useMemo(() => {
    const found: Array<{ id: string; name: string }> = [];
    if (!disciplineId) return found;
    for (const university of academic.data?.universities ?? []) {
      for (const course of university.courses ?? []) {
        for (const klass of (course.classes ?? []) as Array<{ _id?: string; id?: string; name: string; disciplines?: Array<{ _id?: string; id?: string }> }>) {
          const classId = klass._id ?? klass.id ?? "";
          if ((klass.disciplines ?? []).some((discipline) => (discipline._id ?? discipline.id) === disciplineId) && !found.some((item) => item.id === classId)) {
            found.push({ id: classId, name: klass.name });
          }
        }
      }
    }
    return found;
  }, [academic.data, disciplineId]);
}
