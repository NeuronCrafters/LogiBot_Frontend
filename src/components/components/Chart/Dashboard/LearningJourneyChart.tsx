import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { AreaChart, Area, XAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { motion } from "framer-motion";
import { dashboardApi } from "@/services/api/api_dashboard";
import { ChartLoader, ChartError, NoData } from "../ChartStates";
import { ChartExportMenu } from "../ChartExportMenu";

interface ApiData {
  labels: string[];
  data: number[];
}

interface ChartData {
  name: string;
  performance: number;
}

interface ChartProps {
  filters: { universityId?: string; courseId?: string; classId?: string; studentId?: string; disciplineId?: string; };
}

const chartConfig = {
  performance: {
    label: "Desempenho",
    color: "hsl(145 44% 65%)",
  },
} satisfies ChartConfig;

function useChartData(filters: ChartProps['filters']) {
  return useQuery<ApiData, Error, ChartData[]>({
    queryKey: ['learningJourney', filters],
    queryFn: () => dashboardApi.getLearningJourney(filters).then(res => res.data),
    enabled: !!filters.universityId,
    staleTime: 1000 * 60 * 5,
    select: (apiData) => {
      if (!apiData || !apiData.labels || apiData.labels.length === 0) return [];
      return apiData.labels.map((label, index) => ({
        name: label,
        performance: apiData.data[index],
      }));
    }
  });
}

export function LearningJourneyChart({ filters }: ChartProps) {
  const { data, isLoading, isError, error, refetch } = useChartData(filters);
  const hasDataForFooter = data && data.length > 1;
  const hasData = data && data.length > 0;

  const hasRequiredIds = !!filters.universityId;

  const performanceSummary = useMemo(() => {
    if (!hasDataForFooter || !data) return null;

    const peak = data.reduce((max, item) => item.performance > max.performance ? item : max, data[0]);
    const low = data.reduce((min, item) => item.performance < min.performance ? item : min, data[0]);

    return { peak, low };
  }, [data, hasDataForFooter]);

  return (
    <Card id="learning-journey-chart" className="bg-[#1f1f1f] border-white/10 w-full mb-6">
      <CardHeader className="relative flex flex-col items-stretch p-0 space-y-0 border-b border-white/10">
        <div className="flex flex-col flex-1 gap-1 justify-center px-6 py-5">
          <CardTitle className="text-white">Jornada de Aprendizagem</CardTitle>
          <CardDescription className="text-white/70">
            Evolução do desempenho ao longo das questões.
          </CardDescription>
        </div>

        <div className="flex">
          <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t border-white/10 px-6 py-4 text-left invisible h-0" aria-hidden="true">
          </div>
        </div>

        <div className="absolute top-5 right-4 z-40">
          <ChartExportMenu containerId="learning-journey-chart" fileName="jornada_aprendizagem" />
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:p-6">
        {!hasRequiredIds && (
          <NoData onRetry={refetch}>
            <p>Selecione uma universidade para visualizar a Jornada de Aprendizagem.</p>
          </NoData>
        )}

        {hasRequiredIds && isLoading && <ChartLoader text="Carregando dados..." />}

        {hasRequiredIds && isError && <ChartError message={(error as Error)?.message} onRetry={refetch} />}

        {hasRequiredIds && !isLoading && !isError && hasData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
              <AreaChart accessibilityLayer data={data} margin={{ left: 12, right: 12, top: 10, bottom: 5 }}>
                <CartesianGrid vertical={false} stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
                  tickFormatter={(value) => value.replace('Questões ', '')}
                  interval="preserveStartEnd"
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      className="bg-[#1f1f1f] border-white/10 text-white"
                      indicator="line"
                      labelStyle={{ color: "#fff", fontWeight: 'bold' }}
                      formatter={(value) => [`${Number(value).toFixed(1)}%`, "Desempenho"]}
                    />
                  }
                />
                <Area
                  dataKey="performance"
                  type="natural"
                  fill="var(--color-performance)"
                  fillOpacity={0.4}
                  stroke="var(--color-performance)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </motion.div>
        )}

        {hasRequiredIds && !isLoading && !isError && !hasData && (
          <NoData onRetry={refetch}>Nenhum dado de jornada disponível para esta entidade.</NoData>
        )}
      </CardContent>

      {hasDataForFooter && performanceSummary && (
        <CardFooter className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm text-white/70">Pico de Desempenho</p>
              <p className="font-bold text-white">
                {performanceSummary.peak.performance.toFixed(1)}%
                <span className="font-normal text-white/80"> em "{performanceSummary.peak.name}"</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm text-white/70">Ponto de Dificuldade</p>
              <p className="font-bold text-white">
                {performanceSummary.low.performance.toFixed(1)}%
                <span className="font-normal text-white/80"> em "{performanceSummary.low.name}"</span>
              </p>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}