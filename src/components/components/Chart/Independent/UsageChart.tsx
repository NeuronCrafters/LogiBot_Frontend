import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, CartesianGrid, XAxis } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { motion } from "framer-motion";
import { api } from "@/services/api/api";
import type { ChartFilterState } from "@/@types/ChartsType";
import logApiSmart from "@/services/api/logApiSmart";
import { useAuth } from "@/hooks/use-Auth";

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

// function useUsageData(filter: UsageChartProps['filter']) {
//   const validIds = Array.isArray(filter.ids)
//     ? filter.ids.filter(id => typeof id === 'string' && id.trim() !== '')
//     : [];
//   const mainId = validIds[0] || "";

//   const isStudent = filter.type === "student";
//   const { universityId, courseId, classId } = filter.hierarchyParams;

//   const studentId = isStudent ? mainId : undefined;
//   const hasRequiredIds = isStudent
//     ? Boolean(universityId && courseId && classId && studentId)
//     : Boolean(mainId);

//   return useQuery({
//     queryKey: ['usage', filter.type, mainId, universityId, courseId, classId],
//     queryFn: async () => {
//       if (!hasRequiredIds) {
//         throw new Error(`IDs insuficientes para tipo: ${filter.type}`);
//       }

//       let responseData;

//       if (isStudent) {
//         const requestBody = { universityId, courseId, classId, studentId };
//         const response = await api.post('/logs/student/summary/filtered', requestBody);
//         responseData = response.data;
//       } else {
//         let url: string;
//         switch (filter.type) {
//           case "university":
//             url = `/logs/university/${mainId}/summary`;
//             break;
//           case "course":
//             url = `/logs/course/${mainId}/summary`;
//             break;
//           case "class":
//             url = `/logs/class/${mainId}/summary`;
//             break;
//           default:
//             throw new Error(`Tipo de entidade não suportado: ${filter.type}`);
//         }
//         const response = await api.get(url);
//         responseData = response.data;
//       }

//       return {
//         totalUsageTime: responseData.usageTimeInSeconds,
//         usageTime: responseData.usageTime,
//         dailyUsage: responseData.dailyUsage || [],
//         sessions: responseData.sessions || []
//       };
//     },
//     enabled: hasRequiredIds,
//     staleTime: 15 * 60 * 1000,
//     gcTime: 30 * 60 * 1000,
//     refetchOnWindowFocus: false,
//     retry: 2
//   });
// }

function useUsageData(filter: UsageChartProps['filter']) {
  const { user } = useAuth();
  const userRoles: string[] = Array.isArray(user?.role) ? user.role : user?.role ? [user.role] : [];

  const validIds = Array.isArray(filter.ids)
    ? filter.ids.filter(id => typeof id === 'string' && id.trim() !== '')
    : [];
  const mainId = validIds[0] || "";

  const isStudent = filter.type === "student";
  const { universityId, courseId, classId, disciplineId } = filter.hierarchyParams;

  const studentId = isStudent ? mainId : undefined;
  const hasRequiredIds = isStudent
    ? Boolean(universityId && courseId && classId && studentId)
    : Boolean(mainId);

  return useQuery({
    queryKey: ['usage', filter.type, mainId, universityId, courseId, classId],
    queryFn: async () => {
      if (!hasRequiredIds) {
        throw new Error(`IDs insuficientes para tipo: ${filter.type}`);
      }

      const isProfessor = userRoles.includes("professor");
      if (isProfessor && (filter.type === "discipline" || filter.type === "student")) {
        const response = await logApiSmart.fetchSummary(
          userRoles,
          filter.type,
          mainId,
          { universityId, courseId, classId, studentId, disciplineId }
        );
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
        const response = await api.post('/logs/student/summary/filtered', requestBody);
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
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  });
}


export function UsageChart({ filter }: UsageChartProps) {
  const { data: usageData, isLoading, isError, error, refetch } = useUsageData(filter);

  const validIds = Array.isArray(filter.ids)
    ? filter.ids.filter(id => typeof id === 'string' && id.trim() !== '')
    : [];
  const mainId = validIds[0] || "";

  const isStudent = filter.type === "student";
  const { universityId, courseId, classId } = filter.hierarchyParams;
  const hasRequiredIds = isStudent
    ? Boolean(universityId && courseId && classId && mainId)
    : Boolean(mainId);

  const chartConfig = useMemo(() => ({
    usage: { label: "Minutos", color: "hsl(var(--chart-1))" }
  }), []);

  const chartData = useMemo(() => {
    if (!usageData) return [];
    if (Array.isArray(usageData.dailyUsage) && usageData.dailyUsage.length > 0) {
      return [...usageData.dailyUsage].sort((a, b) => a.date.localeCompare(b.date));
    }
    return [];
  }, [usageData]);

  const hasData = chartData.length > 0;

  const formattedTime = useMemo(() => {
    return usageData?.usageTime?.formatted || "00:00:00";
  }, [usageData]);

  return (
    <Card className="bg-[#1f1f1f] border-white/10 w-full mb-6">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b border-white/10 p-0">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5">
          <CardTitle className="text-white">Tempo de Uso Diário</CardTitle>
          <CardDescription className="text-white/70">
            Minutos de utilização nos últimos dias
          </CardDescription>
        </div>
        <div className="flex">
          <button
            data-active={true}
            className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t border-white/10 px-6 py-4 text-left data-[active=true]:bg-muted/50"
          >
            <span className="text-xs text-white/50">
              Tempo Total
            </span>
            <span className="text-lg font-bold leading-none text-white sm:text-3xl">
              {formattedTime}
            </span>
          </button>
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:p-6">
        {!hasRequiredIds && (
          <div className="flex items-center justify-center h-[250px] text-center text-white/70">
            {isStudent ? (
              <p>Selecione uma universidade, curso, turma e aluno para visualizar dados.</p>
            ) : (
              <p>Selecione uma entidade para visualizar dados.</p>
            )}
          </div>
        )}

        {hasRequiredIds && isLoading && (
          <div className="flex items-center justify-center h-[250px] text-center text-white/70">
            <div className="flex flex-col items-center">
              <div className="animate-pulse w-10 h-10 rounded-full bg-indigo-600/30 mb-3"></div>
              <p>Carregando dados...</p>
            </div>
          </div>
        )}

        {hasRequiredIds && isError && (
          <div className="flex items-center justify-center h-[250px] text-center text-white/70">
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-indigo-400/60">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p>{error instanceof Error ? error.message : "Erro ao carregar dados."}</p>
              <button
                onClick={() => refetch()}
                className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {hasRequiredIds && !isLoading && !isError && hasData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[250px] w-full text-white"
            >
              <BarChart
                accessibilityLayer
                data={chartData}
                margin={{
                  left: 12,
                  right: 12,
                  top: 20,
                  bottom: 5
                }}
                barSize={80}
                barGap={2}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="#333"
                  strokeDasharray="3 3"
                  strokeOpacity={0.6}
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  stroke="#999"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                    });
                  }}
                />
                <ChartTooltip
                  cursor={false}
                  content={(props) => {
                    if (!props.active || !props.payload || !props.payload[0]) {
                      return null;
                    }

                    const data = props.payload[0].payload;
                    const date = new Date(data.date);
                    const formattedDate = date.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric"
                    });

                    // Garantir que sempre temos o formato HH:MM:SS
                    let formattedTime = data.formatted || "00:00:00";

                    // Se o tempo formatado não tiver o formato completo HH:MM:SS, ajustamos
                    if (formattedTime && formattedTime.split(":").length < 3) {
                      // Converter minutos para o formato correto
                      const usage = data.usage || 0;
                      const hours = Math.floor(usage / 60);
                      const minutes = Math.floor(usage % 60);
                      const seconds = Math.floor((usage * 60) % 60);

                      formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                    }

                    return (
                      <div className="p-2 bg-[#1f1f1f] border border-[#333] rounded shadow text-white text-sm">
                        <p className="font-semibold mb-1">{formattedDate}</p>
                        <p>
                          <span className="text-[#999] mr-2">Tempo:</span>
                          <span className="font-medium">{formattedTime}</span>
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
                <Bar
                  dataKey="usage"
                  fill="#274a96"
                  radius={[4, 4, 0, 0]}
                  fillOpacity={0.9}
                />
              </BarChart>
            </ChartContainer>
          </motion.div>
        )}

        {hasRequiredIds && !isLoading && !isError && !hasData && (
          <div className="flex items-center justify-center h-[250px] text-center text-white/70">
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-indigo-400/60">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p>Nenhum dado de uso disponível para esta entidade.</p>
              <button
                onClick={() => refetch()}
                className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}