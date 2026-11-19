import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { academicFiltersApi } from "@/services/apiClient";

/** Disciplines linked to the signed-in staff member (same rule as the quiz management page). */
export function useManagedDisciplines() {
  const { user } = useAuth();
  const ids = useMemo(() => {
    const raw = user?.disciplines as unknown;
    if (!raw) return [] as string[];
    const list = Array.isArray(raw) ? raw : [raw];
    return list
      .map((item) => (typeof item === "string" ? item : (item as { id?: string; _id?: string })?.id ?? (item as { _id?: string })?._id ?? ""))
      .filter(Boolean) as string[];
  }, [user]);
  const academic = useQuery({
    queryKey: ["academicData"],
    queryFn: async () => (await academicFiltersApi.getAcademicData()).data,
    staleTime: 5 * 60 * 1000,
  });
  const disciplines = useMemo(() => {
    const found: Array<{ id: string; name: string }> = [];
    for (const university of academic.data?.universities ?? []) {
      for (const course of university.courses ?? []) {
        for (const discipline of course.disciplines ?? []) {
          if (ids.includes(discipline._id) && !found.some((item) => item.id === discipline._id)) found.push({ id: discipline._id, name: discipline.name });
        }
      }
    }
    return found;
  }, [academic.data, ids]);
  return { disciplines, isLoading: academic.isLoading };
}
