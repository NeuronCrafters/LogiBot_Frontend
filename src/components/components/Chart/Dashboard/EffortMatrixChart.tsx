import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, ReferenceLine, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { dashboardApi } from "@/services/api/api_dashboard";
import { ChartLoader, ChartError, NoData } from "../ChartStates";
import { useMemo, useCallback } from "react";

interface ChartProps {
  filters: { universityId?: string; courseId?: string; classId?: string; studentId?: string; disciplineId?: string; };
}

// ======================================================================
// CORES E ESTILO PARA DESTAQUE
// ======================================================================
const COLOR_PRIMARY = "#8884d8";   // Roxo padrão
const COLOR_AVERAGE = "#ff7300";   // Laranja VIBRANTE
const COLOR_TARGET_STUDENT = "#00bcd4"; // Ciano para o aluno em destaque
const AVERAGE_RADIUS = 6;
const PRIMARY_RADIUS = 4;

interface PointData {
  effort: number;
  performance: number;
  name: string;
  isAverage: boolean;
  id?: string;
}

interface EffortMatrixData {
  points: PointData[];
  averages: { avgEffort: number; avgPerformance: number };
}

type UseEffortMatrixResult = UseQueryResult<EffortMatrixData, Error>;

function useChartData(filters: ChartProps['filters']): UseEffortMatrixResult {
  return useQuery({
    queryKey: ['effortMatrix', filters],
    queryFn: () => dashboardApi.getEffortMatrix(filters).then(res => res.data as EffortMatrixData),
    enabled: !!filters.universityId,
    staleTime: 1000 * 60 * 5,
  });
}

export function EffortMatrixChart({ filters }: ChartProps) {
  // Usamos desestruturação com a garantia do tipo UseQueryResult
  const { data, isLoading, isError, error, refetch } = useChartData(filters);

  // CORREÇÃO: Usando !! para verificar se points existe E tem comprimento > 0
  const hasData = !!data?.points?.length;
  const hasRequiredIds = !!filters.universityId;
  const refetchTyped = refetch as () => void;
  const errorMessage = error instanceof Error ? error.message : "Erro ao carregar dados.";

  const studentId = filters.studentId;
  const isStudentView = !!studentId && !!(filters.classId || filters.disciplineId);

  // Lógica de Separação e Filtragem
  const { averagePoint, individualPointsToRender } = useMemo(() => {
    if (!data) return { averagePoint: undefined, individualPointsToRender: [] };

    const average = data.points.find(p => p.isAverage);
    let individuals = data.points.filter(p => !p.isAverage);

    // Aplicar a Regra de Negócio: Se for modo Aluno, filtrar.
    if (isStudentView) {
      // Filtrar para mostrar APENAS o aluno alvo
      individuals = individuals.filter(p => p.id === studentId);
    }

    return { averagePoint: average, individualPointsToRender: individuals };
  }, [data, isStudentView, studentId]);

  // Componente Tooltip customizado
  const tooltipContent = useCallback(({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const pointData = payload[0].payload as PointData;
      const isTarget = isStudentView && pointData.id === studentId;
      const pointColor = pointData.isAverage ? COLOR_AVERAGE : (isTarget ? COLOR_TARGET_STUDENT : COLOR_PRIMARY);

      return (
        <div className="p-2 bg-[#2a2a2a] border border-white/20 rounded-md text-white text-sm shadow-lg">
          <p className="font-bold mb-1" style={{ color: pointColor }}>
            {pointData.name} {isTarget ? " (VOCÊ)" : ""}
          </p>
          <p>Desempenho: {pointData.performance}%</p>
          <p>Esforço: {pointData.effort.toFixed(1)} min</p>
        </div>
      );
    }
    return null;
  }, [isStudentView, studentId]);


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
        {/* Elemento invisível para manter a altura do CardHeader consistente com o UsageChart */}
        <div className="flex">
          <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t border-white/10 px-6 py-4 text-left invisible h-0" aria-hidden="true" />
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:p-6">
        {/* Estados: falta seleção */}
        {!hasRequiredIds && (
          <NoData onRetry={refetchTyped}>
            <p>Selecione uma universidade para visualizar o Desempenho vs. Esforço.</p>
          </NoData>
        )}

        {/* Estados: loading */}
        {hasRequiredIds && isLoading && <ChartLoader text="Carregando dados..." />}

        {/* Estados: erro */}
        {hasRequiredIds && isError && <ChartError message={errorMessage} onRetry={refetchTyped} />}

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
                  content={tooltipContent}
                />
                <ReferenceLine y={data!.averages.avgPerformance} stroke="#ffffff50" strokeDasharray="4 4" />
                <ReferenceLine x={data!.averages.avgEffort} stroke="#ffffff50" strokeDasharray="4 4" />

                {/* 1. Renderiza os pontos individuais (alunos) primeiro (camada inferior) */}
                <Scatter name="Entidades Individuais" data={individualPointsToRender} shape="circle">
                  {individualPointsToRender.map((point, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={point.id === studentId ? COLOR_TARGET_STUDENT : COLOR_PRIMARY}
                      r={point.id === studentId ? PRIMARY_RADIUS + 1 : PRIMARY_RADIUS}
                    />
                  ))}
                </Scatter>

                {/* 2. Renderiza o ponto de média por último (Média/Referência) - Camada superior */}
                {averagePoint && (
                  <Scatter
                    name="Média/Referência"
                    data={[averagePoint]}
                    fill={COLOR_AVERAGE}
                    shape="circle"
                    radius={AVERAGE_RADIUS}
                  />
                )}
              </ScatterChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Sem dados */}
        {hasRequiredIds && !isLoading && !isError && !hasData && (
          <NoData onRetry={refetchTyped}>Nenhum dado de matriz disponível para esta entidade.</NoData>
        )}
      </CardContent>
    </Card>
  );
}