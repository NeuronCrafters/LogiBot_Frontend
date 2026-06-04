import { useCallback, useEffect, useState } from "react";
import { addDays, formatISODate } from "@/shared/lib/formatDate";
import { BarChart2, Filter, MousePointer2 } from "lucide-react";
import { Typograph } from "@/shared/components/Typography";
import { DashboardFilter } from "@/features/dashboard/components/DashboardFilter";
import type { DashboardFilterState } from "@/features/dashboard/filterTypes";
import { LogEntityType, LogModeType } from "@/services/api/api_routes";
import { DashboardFilterParams } from "@/features/dashboard/api/dashboardApi";
import { UsageChart } from "@/features/dashboard/components/charts/UsageChart";
import { CorrectWrongChart } from "@/features/dashboard/components/charts/CorrectWrongChart";
import { CategoryChart } from "@/features/dashboard/components/charts/CategoryChart";
import { EffortMatrixChart } from "@/features/dashboard/components/charts/EffortMatrixChart";
import { ProficiencyRadarChart } from "@/features/dashboard/components/charts/ProficiencyRadarChart";
import { LearningJourneyChart } from "@/features/dashboard/components/charts/LearningJourneyChart";
import { AccessPatternChart } from "@/features/dashboard/components/charts/AccessPatternChart";
import { GeneralScoreChart } from "@/features/dashboard/components/charts/GeneralScoreChart";

type DateRange = { from?: Date; to?: Date };

export function Dashboard() {
  const [dashboardFilters, setDashboardFilters] =
    useState<DashboardFilterParams>({});
  const [legacyFilter, setLegacyFilter] = useState<
    DashboardFilterState & {
      hierarchyParams: Omit<DashboardFilterParams, "startDate" | "endDate">;
    }
  >({ type: "student", ids: [], mode: "individual", hierarchyParams: {} });
  const [dateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [hasSelection, setHasSelection] = useState(false);
  const [, setKey] = useState(0);

  const updateAllFilters = useCallback(
    (
      currentLegacyFilter: typeof legacyFilter,
      currentDateRange: typeof dateRange,
    ) => {
      const validIds = currentLegacyFilter.ids.filter(
        (id) => id && id.trim() !== "",
      );
      const mainId = validIds[0] || "";
      const newDashboardFilters: DashboardFilterParams = {
        ...currentLegacyFilter.hierarchyParams,
        startDate: currentDateRange?.from
          ? formatISODate(currentDateRange.from)
          : undefined,
        endDate: currentDateRange?.to
          ? formatISODate(currentDateRange.to)
          : undefined,
      };
      if (currentLegacyFilter.type === "student") {
        newDashboardFilters.studentId = mainId;
      } else if (mainId) {
        newDashboardFilters[
          `${currentLegacyFilter.type}Id` as keyof DashboardFilterParams
        ] = mainId;
      }
      setDashboardFilters(newDashboardFilters);
      setHasSelection(!!mainId);
      setKey((k) => k + 1);
    },
    [],
  );

  const handleEntityFilterChange = useCallback(
    (
      type: LogEntityType,
      ids: string[],
      mode: LogModeType,
      hierarchyParams?: Omit<DashboardFilterParams, "startDate" | "endDate">,
    ) => {
      const newLegacyFilter = {
        type,
        ids: ids.filter((id) => id && id.trim() !== ""),
        mode,
        hierarchyParams: hierarchyParams || {},
      };
      setLegacyFilter(newLegacyFilter);
      updateAllFilters(newLegacyFilter, dateRange);
    },
    [dateRange, updateAllFilters],
  );

  useEffect(() => {
    if (hasSelection) updateAllFilters(legacyFilter, dateRange);
  }, [dateRange, hasSelection, legacyFilter, updateAllFilters]);

  return (
    <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <section className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <BarChart2 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-[Poppins] text-2xl font-semibold text-white">
                  Dashboard de atividades
                </h1>
                <p className="mt-2 font-[Poppins] text-sm leading-relaxed text-zinc-400">
                  Visualize métricas detalhadas por entidade e período.
                </p>
              </div>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/10 bg-neutral-950/60 px-3 py-2 font-[Poppins] text-xs font-medium text-zinc-400">
              <Filter className="h-4 w-4 text-blue-400" />
              Filtros obrigatórios
            </div>
          </div>
        </section>

        <DashboardFilter onChange={handleEntityFilterChange} />

        {!hasSelection ? (
          <div className="flex min-h-[16rem] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#1f1f1f] p-8 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-zinc-500">
              <MousePointer2 className="h-5 w-5" />
            </div>
            <Typograph
              text="Selecione uma entidade para visualizar os dados"
              variant="text7"
              colorText="text-zinc-400"
              weight="medium"
              fontFamily="poppins"
            />
          </div>
        ) : (
          <div className="space-y-6">
            <UsageChart filter={legacyFilter} />
            {legacyFilter.type === "student" && (
              <AccessPatternChart filters={dashboardFilters} />
            )}
            <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
              <div className="h-full">
                <CorrectWrongChart filter={legacyFilter} />
              </div>
              <div className="h-full">
                <GeneralScoreChart filters={dashboardFilters} />
              </div>
              <div className="h-full">
                <CategoryChart filter={legacyFilter} />
              </div>
              <div className="h-full">
                <ProficiencyRadarChart filters={dashboardFilters} />
              </div>
            </div>
            <EffortMatrixChart filters={dashboardFilters} />
            <LearningJourneyChart filters={dashboardFilters} />
          </div>
        )}
      </div>
    </main>
  );
}
