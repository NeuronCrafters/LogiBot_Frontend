import { useQuery } from "@tanstack/react-query";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, ReferenceLine, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { dashboardApi } from "@/services/api/api_dashboard";
import { ChartLoader, ChartError, NoData } from "../ChartStates";

interface ChartProps {
  filters: { universityId?: string; courseId?: string; classId?: string; studentId?: string; disciplineId?: string; };
}

// ======================================================================
// ## ONDE MUDAR AS CORES ##
// Altere os códigos hexadecimais abaixo.
// ======================================================================
const COLOR_PRIMARY = "#8884d8";   // Roxo para pontos de alunos/entidades
const COLOR_AVERAGE = "#ff7300";   // Laranja para o ponto de "Média"

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

  const hasRequiredIds = !!filters.universityId; // Condição de enable do hook

  return (
    <Card className="bg-[#1f1f1f] border-white/10 w-full mb-6">
      {/* HEADER PADRONIZADO EM ALTURA */}
      <CardHeader className="flex flex-col items-stretch p-0 space-y-0 border-b border-white/10">
        <div className="flex flex-col flex-1 gap-1 justify-center px-6 py-5">
          <CardTitle className="text-white">Matriz Desempenho vs. Esforço</CardTitle>
          <CardDescription className="text-white/70">
            Perfil dos alunos: tempo de uso e taxa de acertos.
          </CardDescription>
        </div>
        {/* Adiciona uma div que simula o espaço do sumário, para manter a altura do header similar ao UsageChart */}
        <div className="flex">
          <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t border-white/10 px-6 py-4 text-left invisible h-0" aria-hidden="true">
            {/* Elemento invisível para manter a altura do CardHeader consistente */}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:p-6">
        {/* Estados: falta seleção */}
        {!hasRequiredIds && (
          <NoData onRetry={refetch}>
            <p>Selecione uma universidade para visualizar o Desempenho vs. Esforço.</p>
          </NoData>
        )}

        {/* Estados: loading */}
        {hasRequiredIds && isLoading && <ChartLoader text="Carregando dados..." />}

        {/* Estados: erro */}
        {hasRequiredIds && isError && <ChartError message={(error as Error)?.message} onRetry={refetch} />}

        {/* Gráfico */}
        {hasRequiredIds && !isLoading && !isError && hasData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            {/* Altura padronizada para h-[250px] */}
            <ResponsiveContainer width="100%" height={250}>
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis type="number" dataKey="effort" name="Esforço" unit=" min" stroke="#ffffff80" tick={{ fontSize: 12, fill: '#ffffffb0' }} />
                <YAxis type="number" dataKey="performance" name="Desempenho" unit="%" domain={[0, 100]} stroke="#ffffff80" tick={{ fontSize: 12, fill: '#ffffffb0' }} />
                <ZAxis dataKey="name" name="Nome" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const pointData = payload[0].payload;
                      return (
                        <div className="p-2 bg-[#2a2a2a] border border-white/20 rounded-md text-white text-sm shadow-lg">
                          <p className="font-bold mb-1">{pointData.name}</p>
                          <p>Desempenho: {pointData.performance}%</p>
                          <p>Esforço: {pointData.effort.toFixed(1)} min</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={data.averages.avgPerformance} stroke="#ffffff50" strokeDasharray="4 4" />
                <ReferenceLine x={data.averages.avgEffort} stroke="#ffffff50" strokeDasharray="4 4" />
                <Scatter name="Entidades" data={data.points}>
                  {data.points.map((point, index) => (
                    <Cell key={`cell-${index}`} fill={point.isAverage ? COLOR_AVERAGE : COLOR_PRIMARY} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Sem dados */}
        {hasRequiredIds && !isLoading && !isError && !hasData && (
          <NoData onRetry={refetch}>Nenhum dado de matriz disponível para esta entidade.</NoData>
        )}
      </CardContent>
    </Card>
  );
}