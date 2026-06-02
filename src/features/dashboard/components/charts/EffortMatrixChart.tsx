import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CartesianGrid, Cell, ReferenceArea, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardApi } from "@/features/dashboard/api/dashboardApi";
import { ChartLoader, ChartError, NoData } from "../ChartStates";
import { ChartDownloadButton } from "../ChartDownloadButton";

const CHART_INFO = "Relaciona o esforco (tempo de uso em minutos) com o desempenho (taxa de acertos). As linhas tracejadas mostram a media do grupo e as cores separam quem esta acima ou abaixo da media em desempenho e esforco.";

const MATRIX_COLORS = { highHigh: "#10b981", highLow: "#3b82f6", lowHigh: "#f59e0b", lowLow: "#ef4444", average: "#f8fafc" };
const QUADRANT_LABELS = { highHigh: "Acima da media em desempenho e esforco", highLow: "Bom desempenho com menor esforco", lowHigh: "Muito esforco com baixo desempenho", lowLow: "Abaixo da media em desempenho e esforco", average: "Media do grupo" };

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

  const matrix = useMemo(() => {
    if (!data?.points?.length) return null;
    const avgPerformance = data.averages.avgPerformance;
    const avgEffort = data.averages.avgEffort;
    const maxEffort = Math.max(...data.points.map((p) => p.originalEffort ?? p.effort), avgEffort, 1);
    const effortDomainMax = Math.max(1, Math.ceil(maxEffort * 1.15));
    const points = data.points.map((point) => {
      const effort = Math.max(0, point.effort);
      const performance = Math.min(100, Math.max(0, point.performance));
      const originalEffort = point.originalEffort ?? point.effort;
      const originalPerformance = point.originalPerformance ?? point.performance;
      const quadrant = point.isAverage ? "average"
        : originalPerformance >= avgPerformance && originalEffort >= avgEffort ? "highHigh"
        : originalPerformance >= avgPerformance && originalEffort < avgEffort ? "highLow"
        : originalPerformance < avgPerformance && originalEffort >= avgEffort ? "lowHigh"
        : "lowLow";
      return { ...point, effort, performance, originalEffort, originalPerformance, quadrant, fill: MATRIX_COLORS[quadrant], size: point.isAverage ? 70 : 42 };
    });
    const counts = points.reduce((acc, p) => { if (!p.isAverage) acc[p.quadrant] += 1; return acc; }, { highHigh: 0, highLow: 0, lowHigh: 0, lowLow: 0 });
    return { points, counts, avgPerformance, avgEffort, effortDomainMax };
  }, [data]);

  return (
    <Card id="effort-matrix-chart" className="bg-[#1f1f1f] border-white/10 flex flex-col">
      <CardHeader className="relative flex flex-col p-0 space-y-0 border-b border-white/10">
        <div className="flex items-start justify-between px-6 py-5 pr-28">
          <div>
            <CardTitle className="text-white font-[Poppins]">Matriz Desempenho vs. Esforco</CardTitle>
            <CardDescription className="text-white/50 font-[Poppins] mt-1">Quadrantes por media de esforco e taxa de acertos</CardDescription>
          </div>
        </div>
        <div className="absolute top-5 right-4 z-40">
          <ChartDownloadButton containerId="effort-matrix-chart" fileName="matriz_esforco" info={CHART_INFO} />
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:p-6">
        {isLoading && <ChartLoader text="Carregando dados..." />}
        {isError && <ChartError message={(error as Error)?.message} onRetry={refetch} />}
        {!isLoading && !isError && !hasData && <NoData onRetry={refetch}><p>Nenhum dado disponivel para esta entidade.</p></NoData>}
        {!isLoading && !isError && matrix && (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                {showReferenceLines && (
                  <>
                    <ReferenceArea x1={0} x2={matrix.avgEffort} y1={matrix.avgPerformance} y2={100} fill={MATRIX_COLORS.highLow} fillOpacity={0.07} />
                    <ReferenceArea x1={matrix.avgEffort} x2={matrix.effortDomainMax} y1={matrix.avgPerformance} y2={100} fill={MATRIX_COLORS.highHigh} fillOpacity={0.07} />
                    <ReferenceArea x1={0} x2={matrix.avgEffort} y1={0} y2={matrix.avgPerformance} fill={MATRIX_COLORS.lowLow} fillOpacity={0.07} />
                    <ReferenceArea x1={matrix.avgEffort} x2={matrix.effortDomainMax} y1={0} y2={matrix.avgPerformance} fill={MATRIX_COLORS.lowHigh} fillOpacity={0.07} />
                  </>
                )}
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis type="number" dataKey="effort" name="Esforco" unit=" min" domain={[0, matrix.effortDomainMax]} stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12, fill: "rgba(255,255,255,0.5)" }} />
                <YAxis type="number" dataKey="performance" name="Desempenho" unit="%" domain={[0, 100]} stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12, fill: "rgba(255,255,255,0.5)" }} />
                <ZAxis dataKey="size" range={[42, 70]} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="rounded-xl border border-white/10 bg-[#141414] px-3 py-2.5 text-sm shadow-xl">
                      <p className="mb-1 font-[Poppins] font-bold text-white">{d.name}</p>
                      <p className="font-[Poppins] text-zinc-400">Status: <span className="font-medium text-white">{QUADRANT_LABELS[d.quadrant as keyof typeof QUADRANT_LABELS]}</span></p>
                      <p className="font-[Poppins] text-zinc-400">Desempenho: <span className="font-medium text-white">{d.originalPerformance.toFixed(1)}%</span></p>
                      <p className="font-[Poppins] text-zinc-400">Esforco: <span className="font-medium text-white">{d.originalEffort.toFixed(1)} min</span></p>
                    </div>
                  );
                }} />
                {showReferenceLines && (
                  <>
                    <ReferenceLine y={matrix.avgPerformance} stroke="rgba(255,255,255,0.35)" strokeDasharray="4 4" label={{ value: `Media ${matrix.avgPerformance.toFixed(1)}%`, fill: "rgba(255,255,255,0.55)", fontSize: 11, position: "insideTopLeft" }} />
                    <ReferenceLine x={matrix.avgEffort} stroke="rgba(255,255,255,0.35)" strokeDasharray="4 4" label={{ value: `${matrix.avgEffort.toFixed(1)} min`, fill: "rgba(255,255,255,0.55)", fontSize: 11, position: "insideTopRight" }} />
                  </>
                )}
                <Scatter name="Entidades" data={matrix.points}>
                  {matrix.points.map((point, i) => (
                    <Cell key={`cell-${i}`} fill={point.fill} fillOpacity={point.isAverage ? 1 : 0.9} stroke={point.isAverage ? "#111827" : "transparent"} strokeWidth={point.isAverage ? 2 : 0} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>

      {matrix && (
        <CardFooter className="grid grid-cols-1 gap-2 border-t border-white/10 px-6 py-4 sm:grid-cols-2">
          {([ ["highHigh", "Alto desempenho, alto esforco", matrix.counts.highHigh], ["highLow", "Alto desempenho, baixo esforco", matrix.counts.highLow], ["lowHigh", "Baixo desempenho, alto esforco", matrix.counts.lowHigh], ["lowLow", "Baixo desempenho, baixo esforco", matrix.counts.lowLow] ] as const).map(([key, label, count]) => (
            <div key={key} className="flex items-center justify-between gap-3 font-[Poppins] text-xs text-zinc-400">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: MATRIX_COLORS[key] }} />
                {label}
              </span>
              <span className="font-semibold text-white">{count}</span>
            </div>
          ))}
        </CardFooter>
      )}
    </Card>
  );
}
