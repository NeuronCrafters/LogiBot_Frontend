import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { BarChart, Bar, CartesianGrid, XAxis } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { api } from "@/shared/api/httpClient";
import type { DashboardFilterState } from "@/features/dashboard/filterTypes";
import { ChartDownloadButton } from "../ChartDownloadButton";
import { ChartLoader, ChartError, NoData } from "../ChartStates";
import { dashboardFiltersFromLegacy } from "../../insightFilters";

export function formatTimeWithDays(seconds: number): string {
  const totalSeconds = Math.floor(seconds);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${days}:${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

interface UsageChartProps {
  filter: DashboardFilterState & {
    hierarchyParams: {
      universityId?: string;
      courseId?: string;
      classId?: string;
      disciplineId?: string;
    };
  };
}

function useUsageData(filter: UsageChartProps["filter"]) {
  const validIds = Array.isArray(filter.ids)
    ? filter.ids.filter((id) => typeof id === "string" && id.trim() !== "")
    : [];
  const mainId = validIds[0] || "";
  const isStudent = filter.type === "student";
  const { universityId, courseId, classId, disciplineId } =
    filter.hierarchyParams;
  const hasRequiredIds = !!universityId;

  return useQuery({
    queryKey: [
      "usage",
      filter.type,
      mainId,
      universityId,
      courseId,
      classId,
      disciplineId,
    ],
    queryFn: async () => {
      if (!mainId)
        throw new Error(`Insufficient IDs for type: ${filter.type}`);
      if (isStudent) {
        const response = await api.post("/logs/students/summary", {
          universityId,
          courseId,
          classId,
          studentId: mainId,
          disciplineId,
        });
        return {
          totalUsageTime: response.data.usageTimeInSeconds,
          usageTime: response.data.usageTime,
          dailyUsage: response.data.dailyUsage || [],
          sessions: response.data.sessions || [],
        };
      }
      const urls: Record<string, string> = {
        university: `/logs/universities/${mainId}/summary`,
        course: `/logs/courses/${mainId}/summary`,
        class: `/logs/classes/${mainId}/summary`,
        discipline: `/logs/disciplines/${mainId}/summary`,
      };
      const url = urls[filter.type];
      if (!url)
        throw new Error(`Unsupported entity type: ${filter.type}`);
      const response = await api.get(url);
      return {
        totalUsageTime: response.data.usageTimeInSeconds,
        usageTime: response.data.usageTime,
        dailyUsage: response.data.dailyUsage || [],
        sessions: response.data.sessions || [],
      };
    },
    enabled: hasRequiredIds,
    staleTime: 15 * 60 * 1_000,
    gcTime: 30 * 60 * 1_000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

export function UsageChart({ filter }: UsageChartProps) {
  const {
    data: usageData,
    isLoading,
    isError,
    error,
    refetch,
  } = useUsageData(filter);
  const hasRequiredIds = !!filter.hierarchyParams.universityId;
  const chartConfig = useMemo(
    () => ({ usage: { label: "Minutes", color: "#3b82f6" } }),
    [],
  );
  const chartData = useMemo(() => {
    if (
      !usageData ||
      !Array.isArray(usageData.dailyUsage) ||
      usageData.dailyUsage.length === 0
    )
      return [];
    return [...usageData.dailyUsage].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }, [usageData]);
  const hasData = chartData.length > 0;
  const formattedTime = useMemo(
    () => formatTimeWithDays(usageData?.totalUsageTime ?? 0),
    [usageData],
  );

  return (
    <Card
      id="usage-chart"
      className="bg-[#1f1f1f] border-white/10 flex flex-col"
    >
      <CardHeader className="relative flex flex-col items-stretch p-0 space-y-0 border-b border-white/10">
        <div className="flex items-start justify-between px-6 py-5 pr-36">
          <div>
            <CardTitle className="text-white font-[Poppins]">
              Daily Usage Time
            </CardTitle>
            <CardDescription className="text-white/50 font-[Poppins] mt-1">
              Minutes of usage in recent days
            </CardDescription>
          </div>
        </div>
        <div className="border-t border-white/10 px-6 py-4">
          <p className="font-[Poppins] text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
            Total Time
          </p>
          <p className="mt-1 font-[Poppins] text-2xl font-bold text-white sm:text-3xl">
            {hasData ? formattedTime : "—"}
          </p>
        </div>
        <div className="absolute top-5 right-4 z-40">
          <ChartDownloadButton
            containerId="usage-chart"
            fileName="tempo_de_uso"
            info="Shows the daily usage time in minutes for the analyzed period."
            insight={{
              chart: "usage",
              title: "Daily usage time",
              filters: dashboardFiltersFromLegacy(filter),
              disabled: isLoading || !hasData,
            }}
          />
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:p-6">
        {!hasRequiredIds && (
          <NoData>
            <p>Select an entity to view data.</p>
          </NoData>
        )}
        {hasRequiredIds && isLoading && (
          <ChartLoader text="Loading data..." />
        )}
        {hasRequiredIds && isError && (
          <ChartError
            message={error instanceof Error ? error.message : undefined}
            onRetry={refetch}
          />
        )}
        {hasRequiredIds && !isLoading && !isError && hasData && (
          <div className="h-[300px]">
            <ChartContainer
              config={chartConfig}
              className="h-full w-full text-white"
            >
              <BarChart
                data={chartData}
                margin={{ left: 12, right: 12, top: 20, bottom: 5 }}
                barSize={36}
                barGap={2}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="#333"
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  stroke="#666"
                  tickFormatter={(v: string) =>
                    new Date(v).toLocaleDateString("en-US", {
                      day: "2-digit",
                      month: "2-digit",
                      timeZone: "UTC",
                    })
                  }
                />
                <ChartTooltip
                  cursor={false}
                  content={(props) => {
                    if (!props.active || !props.payload?.[0]) return null;
                    const d = props.payload[0].payload as any;
                    const date = new Date(d.date).toLocaleDateString("en-US", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      timeZone: "UTC",
                    });
                    const secs = Math.round((d.usage ?? 0) * 60);
                    return (
                      <div className="rounded-xl border border-white/10 bg-[#141414] px-3 py-2.5 text-sm shadow-xl">
                        <p className="mb-1.5 font-[Poppins] font-semibold text-white">
                          {date}
                        </p>
                        <p className="font-[Poppins] text-zinc-400">
                          Time:{" "}
                          <span className="font-medium text-white">
                            {formatTimeWithDays(secs)}
                          </span>
                        </p>
                        {d.sessions?.length > 0 && (
                          <p className="font-[Poppins] text-zinc-400">
                            Sessions:{" "}
                            <span className="font-medium text-white">
                              {d.sessions.length}
                            </span>
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="usage"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  fillOpacity={0.85}
                />
              </BarChart>
            </ChartContainer>
          </div>
        )}
        {hasRequiredIds && !isLoading && !isError && !hasData && (
          <NoData onRetry={refetch}>
            <p>No usage data available for this entity.</p>
          </NoData>
        )}
      </CardContent>
    </Card>
  );
}
