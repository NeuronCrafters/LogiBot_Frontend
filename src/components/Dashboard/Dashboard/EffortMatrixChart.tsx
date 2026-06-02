import { useQuery } from "@tanstack/react-query";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, ReferenceLine, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardApi } from "@/services/api/api_dashboard";
import { ChartLoader, ChartError, NoData } from "../ChartStates";
import { ChartDownloadButton } from "../ChartDownloadButton";

const CHART_INFO = "Relaciona o esforço (tempo de uso em minutos) com o desempenho (taxa de acertos). Alunos no quadrante superior direito têm alto esforço e alto desempenho — o perfil ideal.";

const COLOR_PRIMARY = "#3b82f6";
const COLOR_AVERAGE = "#f59e0b";

interface ChartProps {
  filters: { universityId?: string; courseId?: string; classId?: string; studentId?: string; disciplineId?: string };
}

function useChartData(filters: ChartProps["filters"]) {
  return useQuery({
    queryKey: ["effortMatrix", filters],
    queryFn: () => dashboardApi.getEffortMatrix(filters).then((res) => res.data),
    enabled: !!filters.universityId,
    staleTime: 1000 * 60 * 5,
  });
}

export function EffortMatrixChart({ filters }: ChartProps) {
  const { data, isLoading, isError, error, refetch } = useChartData(filters);
  const hasData = data && data.points.length > 0;
  const showReferenceLines = data && data.points.length > 1;

  return (
    <Card id="effort-matrix-chart" className="bg-[#1f1f1f] border-white/10 flex flex-col">
      <CardHeader className="relative flex flex-col p-0 space-y-0 border-b border-white/10">
        <div className="flex items-start justify-between px-6 py-5 pr-28">
          <div>
            <CardTitle className="text-white font-[Poppins]">Matriz Desempenho vs. Esforço</CardTitle>
            <CardDescription className="text-white/50 font-[Poppins] mt-1">Perfil dos alunos: tempo de uso e taxa de acertos</CardDescription>
          </div>
        </div>
        <div className="absolute top-5 right-4 z-40">
          <ChartDownloadButton containerId="effort-matrix-chart" fileName="matriz_esforco" info={CHART_INFO} />
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:p-6">
        {isLoading && <ChartLoader text="Carregando dados..." />}
        {isError && <ChartError message={(error as Error)?.message} onRetry={refetch} />}
        {!isLoading && !isError && !hasData && <NoData onRetry={refetch}><p>Nenhum dado disponível para esta entidade.</p></NoData>}
        {!isLoading && !isError && hasData && (
          <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis type="number" dataKey="effort" name="Esforço" unit=" min" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12, fill: "rgba(255,255,255,0.5)" }} />
              <YAxis type="number" dataKey="performance" name="Desempenho" unit="%" domain={[0, 100]} stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12, fill: "rgba(255,255,255,0.5)" }} />
              <ZAxis dataKey="name" name="Nome" />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  const perf = d.originalPerformance ?? d.performance;
                  const effort = d.originalEffort ?? d.effort;
                  return (
                    <div className="rounded-xl border border-white/10 bg-[#141414] px-3 py-2.5 text-sm shadow-xl">
                      <p className="mb-1 font-[Poppins] font-bold text-white">{d.name}</p>
                      <p className="font-[Poppins] text-zinc-400">Desempenho: <span className="font-medium text-white">{perf}%</span></p>
                      <p className="font-[Poppins] text-zinc-400">Esforço: <span className="font-medium text-white">{effort.toFixed(1)} min</span></p>
                    </div>
                  );
                }}
              />
              {showReferenceLines && (
                <>
                  <ReferenceLine y={data.averages.avgPerformance} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
                  <ReferenceLine x={data.averages.avgEffort} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
                </>
              )}
              <Scatter name="Entidades" data={data.points}>
                {data.points.map((point, i) => (
                  <Cell key={`cell-${i}`} fill={point.isAverage ? COLOR_AVERAGE : COLOR_PRIMARY} fillOpacity={0.85} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
