import { useQuery } from "@tanstack/react-query";
import { Scatter, ScatterChart, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, ZAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { dashboardApi } from "@/services/api/api_dashboard";
import { ChartLoader, ChartError, NoData } from "./ChartStates";

interface ChartProps {
  filters: { universityId?: string; courseId?: string; classId?: string; studentId?: string; disciplineId?: string; };
}

const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function useChartData(filters: ChartProps['filters']) {
  return useQuery({
    queryKey: ['accessPattern', filters],
    queryFn: () => dashboardApi.getAccessPattern(filters).then(res => res.data),
    enabled: !!filters.universityId,
    staleTime: 1000 * 60 * 5,
    select: (apiData) => {
      if (!apiData || apiData.length === 0) {
        return { data: [], max: 0 };
      }
      const max = Math.max(...apiData.map(item => item[2]));
      return { data: apiData.map(item => ({ day: item[0], hour: item[1], value: item[2] })), max };
    }
  });
}

export function AccessPatternChart({ filters }: ChartProps) {
  const { data, isLoading, isError, error, refetch } = useChartData(filters);

  // ======================================================================
  // ## ONDE MUDAR A COR ##
  // Altere o valor de HUE (0 a 360) para mudar a cor do heatmap.
  // Exemplos: 262 (Roxo), 217 (Azul), 142 (Verde), 25 (Laranja)
  // ======================================================================
  const HUE_COLOR = 262;

  const getColor = (value: number, max: number) => {
    if (value === 0) return "#1f1f1f"; // Cor de fundo para células vazias
    const intensity = Math.min(1, value / (max * 0.8 || 1));
    return `hsla(${HUE_COLOR}, 83%, 77%, ${intensity})`;
  };

  const hasData = data && data.data.length > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
      <Card className="bg-[#1f1f1f] border-white/10 flex flex-col h-full">
        <CardHeader>
          <CardTitle className="text-white">Padrões de Acesso</CardTitle>
          <CardDescription className="text-white/70">Horários e dias da semana com maior atividade de sessões.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          {isLoading && <ChartLoader />}
          {isError && <ChartError message={error.message} onRetry={refetch} />}
          {!isLoading && !isError && !hasData && <NoData onRetry={refetch} />}
          {!isLoading && !isError && hasData && (
            // ======================================================================
            // ## ONDE MUDAR ALTURA E LARGURA ##
            // A LARGURA é 100% para ser responsiva.
            // A ALTURA é controlada aqui. Altere o valor `height={250}`.
            // ======================================================================
            <ResponsiveContainer width="100%" height={250}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid stroke="#ffffff20" />
                <XAxis
                  type="number" dataKey="hour" name="Hora"
                  domain={[-1, 24]} ticks={[0, 3, 6, 9, 12, 15, 18, 21]}
                  tickFormatter={(h) => `${h}h`} stroke="#ffffff80" tick={{ fill: '#ffffffb0', fontSize: 12 }}
                />
                <YAxis
                  type="number" dataKey="day" name="Dia"
                  domain={[-1, 7]} ticks={[0, 1, 2, 3, 4, 5, 6]}
                  tickFormatter={(d) => days[d]} stroke="#ffffff80" tick={{ fill: '#ffffffb0', fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    if (!payload || payload.length === 0) return null;
                    const { day, hour, value } = payload[0].payload;
                    return (
                      <div className="p-2 bg-[#2a2a2a] border border-white/20 rounded-md text-white text-sm shadow-lg">
                        <p>{`${days[day]}, ${hour}h: ${value} sessão(s)`}</p>
                      </div>
                    );
                  }}
                />
                {/* O ZAxis controla o tamanho do quadrado. Ajuste o valor [200, 200] se necessário */}
                <ZAxis dataKey="value" range={[200, 200]} />
                <Scatter data={data.data} shape="square">
                  {data.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(entry.value, data.max)} />
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