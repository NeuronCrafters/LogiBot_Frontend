import { useQuery } from "@tanstack/react-query";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, ReferenceLine, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { dashboardApi } from "@/services/api/api_dashboard";
import { ChartLoader, ChartError, NoData } from "../ChartStates";
import { ChartExportMenu } from "../ChartExportMenu";

interface ChartProps {
  filters: { universityId?: string; courseId?: string; classId?: string; studentId?: string; disciplineId?: string; };
}

const COLOR_PRIMARY = "#8884d8";
const COLOR_AVERAGE = "#ff7300";

function useChartData(filters: ChartProps['filters']) {
  return useQuery({
    queryKey: ['effortMatrix', filters],
    queryFn: () => dashboardApi.getEffortMatrix(filters).then(res => res.data),
    enabled: !!filters.universityId,
    staleTime: 1000 * 60 * 5,
  });
}

export function EffortMatrixChart({ filters }: ChartProps) {
  const { data, isLoading, isError, error, refetch } = useChartData(filters);
  const hasData = data && data.points.length > 0;

  const showReferenceLines = data && data.points.length > 1;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
      <Card id="effort-matrix-chart" className="bg-[#1f1f1f] border-white/10 flex flex-col h-full">
        <CardHeader className="relative">
          <CardTitle className="text-white">Matriz Desempenho vs. Esforço</CardTitle>
          <CardDescription className="text-white/70">Perfil dos alunos: tempo de uso e taxa de acertos.</CardDescription>

          <div className="absolute top-5 right-4 z-40">
            <ChartExportMenu containerId="effort-matrix-chart" fileName="matriz_esforco" />
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          {isLoading && <ChartLoader />}
          {isError && <ChartError message={error.message} onRetry={refetch} />}
          {!isLoading && !isError && !hasData && <NoData onRetry={refetch} />}
          {!isLoading && !isError && hasData && (
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis
                  type="number"
                  dataKey="effort"
                  name="Esforço"
                  unit=" min"
                  stroke="#ffffff80"
                  tick={{ fontSize: 12, fill: '#ffffffb0' }}
                />
                <YAxis
                  type="number"
                  dataKey="performance"
                  name="Desempenho"
                  unit="%"
                  domain={[0, 100]}
                  stroke="#ffffff80"
                  tick={{ fontSize: 12, fill: '#ffffffb0' }}
                />
                <ZAxis dataKey="name" name="Nome" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const pointData = payload[0].payload;

                      const displayPerformance = pointData.originalPerformance !== undefined
                        ? pointData.originalPerformance
                        : pointData.performance;

                      const displayEffort = pointData.originalEffort !== undefined
                        ? pointData.originalEffort
                        : pointData.effort;

                      return (
                        <div className="p-2 bg-[#2a2a2a] border border-white/20 rounded-md text-white text-sm shadow-lg">
                          <p className="font-bold mb-1">{pointData.name}</p>
                          <p>Desempenho: {displayPerformance}%</p>
                          <p>Esforço: {displayEffort.toFixed(1)} min</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {showReferenceLines && (
                  <>
                    <ReferenceLine y={data.averages.avgPerformance} stroke="#ffffff50" strokeDasharray="4 4" />
                    <ReferenceLine x={data.averages.avgEffort} stroke="#ffffff50" strokeDasharray="4 4" />
                  </>
                )}
                <Scatter name="Entidades" data={data.points}>
                  {data.points.map((point, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={point.isAverage ? COLOR_AVERAGE : COLOR_PRIMARY}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}