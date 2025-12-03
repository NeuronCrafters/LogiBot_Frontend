import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { BarChart, Bar, CartesianGrid, XAxis } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { motion } from "framer-motion";
import { api } from "@/services/api/api";
import type { ChartFilterState } from "@/@types/ChartsType";
import logApiSmart from "@/services/api/logApiSmart";
import { useAuth } from "@/hooks/use-Auth";
import { ChartExportMenu } from "../ChartExportMenu";

export function formatTimeWithDays(seconds: number): string {
  const totalSeconds = Math.floor(seconds);

  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const remainingSeconds = totalSeconds % 60;

  const daysStr = days.toString();
  const hoursStr = hours.toString().padStart(2, "0");
  const minutesStr = minutes.toString().padStart(2, "0");
  const secondsStr = remainingSeconds.toString().padStart(2, "0");

  return `${daysStr}:${hoursStr}:${minutesStr}:${secondsStr}`;
}

interface UsageChartProps {
  filter: ChartFilterState & {
    hierarchyParams: {
      universityId?: string;
      courseId?: string;
      classId?: string;
      disciplineId?: string;
    };
  };
}

function useUsageData(filter: UsageChartProps["filter"]) {
  const { user } = useAuth();
  const userRoles: string[] = Array.isArray(user?.role)
    ? user.role
    : user?.role
      ? [user.role]
      : [];

  const validIds = Array.isArray(filter.ids)
    ? filter.ids.filter((id) => typeof id === "string" && id.trim() !== "")
    : [];
  const mainId = validIds[0] || "";

  const isStudent = filter.type === "student";
  const {
    universityId,
    courseId,
    classId,
    disciplineId: disciplineIdFromHierarchy
  } = filter.hierarchyParams;
  const disciplineId = filter.type === "discipline" ? mainId : disciplineIdFromHierarchy;
  const studentId = isStudent ? mainId : undefined;

  const hasRequiredIds = isStudent
    ? Boolean(universityId && courseId && (classId || disciplineId) && mainId)
    : Boolean(mainId);

  return useQuery({
    queryKey: [
      "usage",
      filter.type,
      mainId,
      universityId,
      courseId,
      classId,
      disciplineId
    ],
    queryFn: async () => {
      if (!hasRequiredIds) {
        throw new Error(`IDs insuficientes para tipo: ${filter.type}`);
      }

      const isProfessor = userRoles.includes("professor");
      if (isProfessor && (filter.type === "discipline" || filter.type === "student")) {
        const response = await logApiSmart.fetchSummary(userRoles, filter.type, mainId, {
          universityId,
          courseId,
          classId,
          studentId,
          disciplineId
        });
        return {
          totalUsageTime: response.usageTimeInSeconds,
          usageTime: response.usageTime,
          dailyUsage: response.dailyUsage || [],
          sessions: response.sessions || []
        };
      }

      let responseData;

      if (isStudent) {
        const requestBody = { universityId, courseId, classId, studentId };
        const response = await api.post("/logs/student/summary/filtered", requestBody);
        responseData = response.data;
      } else {
        let url: string;
        switch (filter.type) {
          case "university":
            url = `/logs/university/${mainId}/summary`;
            break;
          case "course":
            url = `/logs/course/${mainId}/summary`;
            break;
          case "class":
            url = `/logs/class/${mainId}/summary`;
            break;
          case "discipline":
            url = `/logs/discipline/${mainId}/summary`;
            break;
          default:
            throw new Error(`Tipo de entidade não suportado: ${filter.type}`);
        }
        const response = await api.get(url);
        responseData = response.data;
      }

      return {
        totalUsageTime: responseData.usageTimeInSeconds,
        usageTime: responseData.usageTime,
        dailyUsage: responseData.dailyUsage || [],
        sessions: responseData.sessions || []
      };
    },
    enabled: hasRequiredIds,
    staleTime: 15 * 60 * 1_000,
    gcTime: 30 * 60 * 1_000,
    refetchOnWindowFocus: false,
    retry: 2
  });
}

export function UsageChart({ filter }: UsageChartProps) {
  const {
    data: usageData,
    isLoading,
    isError,
    error,
    refetch
  } = useUsageData(filter);

  const validIds = Array.isArray(filter.ids)
    ? filter.ids.filter((id) => typeof id === "string" && id.trim() !== "")
    : [];
  const mainId = validIds[0] || "";

  const isStudent = filter.type === "student";
  const { universityId, courseId, classId, disciplineId: disciplineIdFromHierarchy } =
    filter.hierarchyParams;
  const disciplineId = filter.type === "discipline" ? mainId : disciplineIdFromHierarchy;

  const hasRequiredIds = isStudent
    ? Boolean(universityId && courseId && (classId || disciplineId) && mainId)
    : Boolean(mainId);

  const chartConfig = useMemo(
    () => ({
      usage: { label: "Minutos", color: "hsl(var(--chart-1))" }
    }),
    []
  );

  const chartData = useMemo(() => {
    if (!usageData) return [];

    if (Array.isArray(usageData.dailyUsage) && usageData.dailyUsage.length > 0) {
      return [...usageData.dailyUsage].sort((a, b) => a.date.localeCompare(b.date));
    }
    return [];
  }, [usageData]);

  const hasData = chartData.length > 0;

  const formattedTime = useMemo(() => {
    const totalSeconds = usageData?.totalUsageTime ?? 0;
    return formatTimeWithDays(totalSeconds);
  }, [usageData]);

  return (
    <Card id="usage-chart" className="bg-[#1f1f1f] border-white/10 w-full mb-6">
      <CardHeader className="relative flex flex-col items-stretch p-0 space-y-0 border-b border-white/10">

        <div className="flex flex-col flex-1 gap-1 justify-center px-6 py-5">
          <CardTitle className="text-white">Tempo de Uso Diário</CardTitle>
          <CardDescription className="text-white/70">
            Minutos de utilização nos últimos dias
          </CardDescription>
        </div>

        <div className="flex">
          <button
            data-active
            className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t border-white/10 px-6 py-4 text-left data-[active=true]:bg-muted/50"
          >
            <span className="text-xs text-white/50">Tempo Total</span>
            <span className="text-lg font-bold leading-none text-white sm:text-3xl">
              {formattedTime}
            </span>
          </button>
        </div>
        <div className="absolute top-5 right-4 z-40">
          <ChartExportMenu containerId="usage-chart" fileName="tempo_de_uso" />
        </div>

      </CardHeader>

      <CardContent className="px-2 sm:p-6">
        {!hasRequiredIds && (
          <EmptyState>
            {isStudent ? (
              <p>Selecione universidade, curso, turma/disciplina e aluno.</p>
            ) : (
              <p>Selecione uma entidade para visualizar dados.</p>
            )}
          </EmptyState>
        )}

        {hasRequiredIds && isLoading && <LoaderState text="Carregando dados..." />}

        {hasRequiredIds && isError && (
          <ErrorState message={error instanceof Error ? error.message : undefined} onRetry={refetch} />
        )}

        {hasRequiredIds && !isLoading && !isError && hasData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full text-white">
              <BarChart
                accessibilityLayer
                data={chartData}
                margin={{ left: 12, right: 12, top: 20, bottom: 5 }}
                barSize={80}
                barGap={2}
              >
                <CartesianGrid vertical={false} stroke="#333" strokeDasharray="3 3" strokeOpacity={0.6} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  stroke="#999"
                  tickFormatter={(value: string) => {
                    const date = new Date(value);

                    return date.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      timeZone: 'UTC'
                    });
                  }}
                />
                <ChartTooltip
                  cursor={false}
                  content={(props) => {
                    if (!props.active || !props.payload || !props.payload[0]) return null;

                    const data = props.payload[0].payload as any;
                    const date = new Date(data.date);

                    const formattedDate = date.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      timeZone: 'UTC'
                    });

                    const usageInMinutes = data.usage ?? 0;
                    const totalSeconds = Math.round(usageInMinutes * 60);
                    const formatted = formatTimeWithDays(totalSeconds);

                    return (
                      <div className="p-2 bg-[#1f1f1f] border border-[#333] rounded shadow text-white text-sm">
                        <p className="mb-1 font-semibold">{formattedDate}</p>
                        <p>
                          <span className="text-[#999] mr-2">Tempo:</span>
                          <span className="font-medium">{formatted}</span>
                        </p>
                        {data.sessions?.length > 0 && (
                          <p className="mt-1">
                            <span className="text-[#999] mr-2">Sessões:</span>
                            <span className="font-medium">{data.sessions.length}</span>
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
                <Bar dataKey="usage" fill="#274a96" radius={[4, 4, 0, 0]} fillOpacity={0.9} />
              </BarChart>
            </ChartContainer>
          </motion.div>
        )}

        {hasRequiredIds && !isLoading && !isError && !hasData && (
          <EmptyState>Nenhum dado de uso disponível para esta entidade.</EmptyState>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center h-[250px] text-center text-white/70">
      <div className="flex flex-col items-center">
        <IconInfo />
        <p>{children}</p>
      </div>
    </div>
  );
}

function LoaderState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center h-[250px] text-center text-white/70">
      <div className="flex flex-col items-center">
        <div className="mb-3 w-10 h-10 rounded-full animate-pulse bg-indigo-600/30" />
        <p>{text}</p>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message?: string; onRetry(): void }) {
  return (
    <div className="flex items-center justify-center h-[250px] text-center text-white/70">
      <div className="flex flex-col items-center">
        <IconInfo />
        <p>{message ?? "Erro ao carregar dados."}</p>
        <button
          onClick={onRetry}
          className="mt-3 text-xs text-indigo-400 transition-colors hover:text-indigo-300"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

function IconInfo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mb-3 text-indigo-400/60"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}