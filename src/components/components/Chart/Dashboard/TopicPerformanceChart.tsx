import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { dashboardApi } from "@/services/api/api_dashboard";
import { ChartLoader, ChartError, NoData } from "./ChartStates";

interface ChartProps {
  filters: { universityId?: string; courseId?: string; classId?: string; studentId?: string; disciplineId?: string; };
}

// ======================================================================
// ## ONDE MUDAR AS CORES ##
// Altere os códigos hexadecimais abaixo para mudar as cores das barras.
// ======================================================================
const COLOR_SUCCESS = "#3f7d7d"; // Verde/Teal para acertos
const COLOR_ERROR = "#7d3f3f";   // Vermelho para erros

function useChartData(filters: ChartProps['filters']) {
  return useQuery({
    queryKey: ['topicPerformance', filters],
    queryFn: () => dashboardApi.getTopicPerformance(filters).then(res => res.data),
    enabled: !!filters.universityId,
    staleTime: 1000 * 60 * 5,
  });
}

export function TopicPerformanceChart({ filters }: ChartProps) {
  const { data, isLoading, isError, error, refetch } = useChartData(filters);
  const hasData = data && data.length > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="bg-[#1f1f1f] border-white/10 flex flex-col h-full">
        <CardHeader>
          <CardTitle className="text-white">Desempenho por Tópico Individual</CardTitle>
          <CardDescription className="text-white/70">Proporção de acertos vs. erros em cada assunto do quiz.</CardDescription>
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
              <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis type="number" domain={[0, 100]} stroke="#ffffff80" tick={{ fill: '#ffffffb0', fontSize: 12 }} tickFormatter={(value) => `${value}%`} />
                <YAxis type="category" dataKey="topic" stroke="#ffffff80" width={80} tick={{ fill: '#ffffffb0', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#ffffff10' }}
                  contentStyle={{ backgroundColor: "#1f1f1f", borderColor: "#333", borderRadius: '0.5rem' }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend formatter={value => <span className="text-white/80">{value}</span>} />
                <Bar dataKey="successPercentage" name="Acertos" stackId="a" fill={COLOR_SUCCESS} />
                <Bar dataKey="errorPercentage" name="Erros" stackId="a" fill={COLOR_ERROR} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}