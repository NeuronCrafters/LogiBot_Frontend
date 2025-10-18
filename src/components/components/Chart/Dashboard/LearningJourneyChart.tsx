import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { dashboardApi } from "@/services/api/api_dashboard";
import { ChartLoader, ChartError, NoData } from "./ChartStates";

interface ChartProps {
  filters: { universityId?: string; courseId?: string; classId?: string; studentId?: string; disciplineId?: string; };
}

// ======================================================================
// ## ONDE MUDAR A COR ##
// Altere o código hexadecimal abaixo para a cor da área.
// ======================================================================
const COLOR_AREA = "#82ca9d"; // Verde

function useChartData(filters: ChartProps['filters']) {
  return useQuery({
    queryKey: ['learningJourney', filters],
    queryFn: () => dashboardApi.getLearningJourney(filters).then(res => res.data),
    enabled: !!filters.universityId,
    staleTime: 1000 * 60 * 5,
    select: (apiData) => {
      if (!apiData || apiData.labels.length === 0) return [];
      return apiData.labels.map((label, index) => ({
        name: label,
        performance: apiData.data[index],
      }));
    }
  });
}

export function LearningJourneyChart({ filters }: ChartProps) {
  const { data, isLoading, isError, error, refetch } = useChartData(filters);
  const hasData = data && data.length > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
      <Card className="bg-[#1f1f1f] border-white/10 flex flex-col h-full">
        <CardHeader>
          <CardTitle className="text-white">Jornada de Aprendizagem</CardTitle>
          <CardDescription className="text-white/70">Evolução do desempenho ao longo das questões.</CardDescription>
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
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis dataKey="name" stroke="#ffffff80" tick={{ fill: '#ffffff80', fontSize: 12 }} />
                <YAxis stroke="#ffffff80" unit="%" tick={{ fill: '#ffffff80' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1f1f1f", borderColor: "#333", borderRadius: '0.5rem' }}
                  labelStyle={{ color: "#fff" }}
                  formatter={(value) => [`${value}%`, "Desempenho"]}
                />
                <Area type="monotone" dataKey="performance" name="Desempenho" stroke={COLOR_AREA} fill={COLOR_AREA} fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}