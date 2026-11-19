import type { DashboardFilterParams } from "./api/dashboardApi";
import type { DashboardFilterState } from "./filterTypes";

type LegacyDashboardFilter = DashboardFilterState & {
  hierarchyParams: Omit<DashboardFilterParams, "startDate" | "endDate">;
  /** Period chosen on the dashboard (yyyy-mm-dd, both ends included). */
  period?: Pick<DashboardFilterParams, "startDate" | "endDate">;
};

export function dashboardFiltersFromLegacy(
  filter: LegacyDashboardFilter,
): DashboardFilterParams {
  const targetId = filter.ids.find((id) => id?.trim())?.trim();
  const filters: DashboardFilterParams = { ...filter.hierarchyParams };
  if (filter.period?.startDate) filters.startDate = filter.period.startDate;
  if (filter.period?.endDate) filters.endDate = filter.period.endDate;
  if (!targetId) return filters;

  if (filter.type === "student") filters.studentId = targetId;
  else if (filter.type === "university") filters.universityId = targetId;
  else if (filter.type === "course") filters.courseId = targetId;
  else if (filter.type === "class") filters.classId = targetId;
  else if (filter.type === "discipline") filters.disciplineId = targetId;

  return filters;
}
