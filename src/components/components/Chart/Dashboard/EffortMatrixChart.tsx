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

  // NOVO: Verifica se há mais de um ponto para decidir se renderiza as linhas de referência
  const showReferenceLines = data && data.points.length > 1;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
      <Card className="bg-[#1f1f1f] border-white/10 flex flex-col h-full">
        <CardHeader>
          <CardTitle className="text-white">Matriz Desempenho vs. Esforço</CardTitle>
          <CardDescription className="text-white/70">Perfil dos alunos: tempo de uso e taxa de acertos.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          {isLoading && <ChartLoader />}
          {isError && <ChartError message={error.message} onRetry={refetch} />}
          {!isLoading && !isError && !hasData && <NoData onRetry={refetch} />}
          {!isLoading && !isError && hasData && (
            // ======================================================================
            // ## ONDE MUDAR ALTURA E LARGURA ##
            // A LARGURA é 100% para ser responsiva.
            // A ALTURA é controlada aqui. Altere o valor `height={300}`.
            // ======================================================================
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

                      // Usa o valor ORIGINAL (sem jittering) para o Tooltip, se disponível
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
                {/* CORREÇÃO: Renderiza ReferenceLine apenas se houver mais de um ponto (múltiplos alunos) */}
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
                      // O ponto da média é desenhado como um Cell, garantindo que ele seja plotado
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