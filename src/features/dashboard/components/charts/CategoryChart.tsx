import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, PolarRadiusAxis } from "recharts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { logApi } from "@/services/apiClient";
import logApiSmart from "@/features/dashboard/api/logsSmartApi";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { DashboardFilterState } from "@/features/dashboard/filterTypes";
import { ChartLoader, ChartError, NoData } from "../ChartStates";
import { ChartDownloadButton } from "../ChartDownloadButton";

const CHART_INFO = "Frequência de acesso por categoria de conteúdo no chat (Variáveis, Funções, Listas…). Indica quais assuntos de lógica de programação geram mais dúvidas entre os estudantes.";

const chartConfig = { acessos: { label: "Acessos", color: "#3b82f6" } } satisfies ChartConfig;

interface CategoryChartProps {
  filter: DashboardFilterState & {
    hierarchyParams: { universityId?: string; courseId?: string; classId?: string; disciplineId?: string };
  };
}

function useSubjectsData(filter: CategoryChartProps["filter"]) {
  const { user } = useAuth();
  const userRoles: string[] = Array.isArray(user?.role) ? user.role : user?.role ? [user.role] : [];
  const validIds = Array.isArray(filter.ids) ? filter.ids.filter((id) => typeof id === "string" && id.trim() !== "") : [];
  const targetId = validIds[0] || "";
  const { universityId, courseId, classId, disciplineId } = filter.hierarchyParams;
  const hasRequired = !!universityId;

  return useQuery({
    queryKey: ["subjects", filter.type, targetId, universityId, courseId, classId, disciplineId, userRoles],
    queryFn: async () => {
      if (!targetId) throw new Error("Selecione todos os filtros para visualizar");
      const isProfessor = userRoles.includes("professor");
      const isCoordinator = userRoles.includes("course-coordinator");
      const isAdmin = userRoles.includes("admin");
      const useSmartApi = !isCoordinator && !isAdmin && isProfessor && (filter.type === "discipline" || (filter.type === "student" && !!disciplineId));
      if (useSmartApi) return logApiSmart.fetchSummary(userRoles, filter.type, targetId, { universityId, courseId, classId, disciplineId });
      if (filter.type === "student") return logApi.getFilteredStudentSummary({ universityId: universityId!, courseId, classId, studentId: targetId, disciplineId } as any);
      const calls: Record<string, () => Promise<any>> = {
        university: () => logApi.getUniversitySummary(targetId),
        course: () => logApi.getCourseSummary(targetId),
        class: () => logApi.getClassSummary(targetId),
        discipline: () => logApi.getDisciplineSummary(targetId),
      };
      const fn = calls[filter.type];
      if (!fn) throw new Error(`Tipo inválido: ${filter.type}`);
      return fn();
    },
    enabled: hasRequired,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    select: (raw: any) => {
      const counts = raw.subjectCounts ?? {};
      const chartData = [
        { category: "Variáveis", acessos: counts.variaveis ?? 0 },
        { category: "Listas", acessos: counts.listas ?? 0 },
        { category: "Condicionais", acessos: (counts.condicionais ?? 0) + (counts.verificacoes ?? 0) },
        { category: "Op. Lógicos", acessos: counts.operadores_logicos ?? 0 },
        { category: "Funções", acessos: counts.funcoes ?? 0 },
        { category: "Repetição", acessos: counts.repeticao ?? 0 },
      ];
      const totalAccesses = chartData.reduce((s, d) => s + d.acessos, 0);
      return { chartData, totalAccesses };
    },
  });
}

export function CategoryChart({ filter }: CategoryChartProps) {
  const { data, isLoading, isError, refetch, error } = useSubjectsData(filter);
  const hasRequired = !!filter.hierarchyParams.universityId;
  const hasData = useMemo(() => (data?.totalAccesses ?? 0) > 0, [data]);
  const topCategory = useMemo(() => {
    if (!data?.chartData) return null;
    const top = data.chartData.reduce((p, c) => (c.acessos > p.acessos ? c : p), { category: "", acessos: 0 });
    if (top.acessos <= 0) return null;
    return { name: top.category, value: top.acessos, percentage: Math.round((top.acessos / data.totalAccesses) * 100) };
  }, [data]);
  const refetchTyped = refetch as () => void;
  const errorMessage = error instanceof Error ? error.message : "Erro ao carregar dados.";

  return (
    <Card id="category-chart" className="bg-[#1f1f1f] border-white/10 flex flex-col h-full">
      <CardHeader className="relative flex flex-col p-0 space-y-0 border-b border-white/10">
        <div className="flex items-start justify-between px-6 py-5 pr-28">
          <div>
            <CardTitle className="text-white font-[Poppins]">Assuntos Mais Acessados: Chat</CardTitle>
            <CardDescription className="text-white/50 font-[Poppins] mt-1">Acessos por categoria de conteúdo</CardDescription>
          </div>
        </div>
        <div className="absolute top-5 right-4 z-40">
          <ChartDownloadButton containerId="category-chart" fileName="assuntos_acessados" info={CHART_INFO} />
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col min-h-0 px-2 sm:p-6">
        {!hasRequired && <NoData onRetry={refetchTyped}><p>Selecione uma entidade para visualizar dados.</p></NoData>}
        {hasRequired && isLoading && <ChartLoader text="Carregando dados..." />}
        {hasRequired && isError && <ChartError message={errorMessage} onRetry={refetchTyped} />}
        {hasRequired && !isLoading && !isError && hasData && (
          <div className="relative flex-1 min-h-[260px]">
            <ChartContainer config={chartConfig} className="absolute inset-0 h-full w-full text-white">
              <RadarChart data={data!.chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <ChartTooltip cursor={false} content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const entry = payload[0].payload;
                  return (
                    <div className="rounded-xl border border-white/10 bg-[#141414] px-3 py-2.5 text-sm shadow-xl">
                      <p className="mb-1 font-[Poppins] font-semibold text-white">{entry.category}</p>
                      <p className="font-[Poppins] text-zinc-400">Acessos: <span className="font-medium text-white">{entry.acessos}</span></p>
                    </div>
                  );
                }} />
                <PolarGrid gridType="polygon" stroke="rgba(255,255,255,0.1)" strokeDasharray="2 2" />
                <PolarAngleAxis dataKey="category" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, "auto"]} tick={false} axisLine={false} />
                <Radar dataKey="acessos" fill="#3b82f6" fillOpacity={0.25} stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", strokeWidth: 0, r: 4 }} />
              </RadarChart>
            </ChartContainer>
          </div>
        )}
        {hasRequired && !isLoading && !isError && !hasData && <NoData onRetry={refetchTyped}><p>Nenhum dado de categorias disponível.</p></NoData>}
      </CardContent>

      {hasData && (
        <CardFooter className="flex justify-between items-center px-6 py-4 border-t border-white/10">
          <div className="flex items-center gap-4">
            <span className="font-[Poppins] text-sm text-zinc-400">Total de acessos: <span className="font-semibold text-white">{data!.totalAccesses}</span></span>
            {topCategory && (
              <>
                <span className="text-white/20">|</span>
                <span className="font-[Poppins] text-sm text-zinc-400">Mais acessado: <span className="font-semibold text-white">{topCategory.name}</span><span className="ml-1.5 text-zinc-600">({topCategory.percentage}%)</span></span>
              </>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
