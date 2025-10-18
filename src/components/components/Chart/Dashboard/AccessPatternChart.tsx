import { useQuery } from "@tanstack/react-query";
import { Scatter, ScatterChart, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { dashboardApi, DashboardFilterParams } from "@/services/api/api_dashboard";
import { ChartLoader, ChartError, NoData } from "../ChartStates";
import { format, formatDistanceStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Interface para a NOVA estrutura de dados da API
interface SessionData {
  startTime: string;
  endTime: string;
}

// Interface para os dados processados pelo gráfico
interface ProcessedSession {
  day: number;     // 0 (Dom) a 6 (Sáb)
  hour: number;    // Hora de início (ex: 14.5 para 14:30)
  startTime: Date;
  endTime: Date;
  duration: string;
}

interface ChartProps {
  filters: DashboardFilterParams;
}

// Componente de Tooltip que mostra os detalhes exatos
const CustomSessionTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data: ProcessedSession = payload[0].payload;
    const options = { locale: ptBR };

    return (
      <div className="p-3 bg-[#1f1f1f] border border-white/20 rounded-lg text-white text-sm shadow-xl space-y-1">
        <p><strong>Entrada:</strong> {format(data.startTime, "HH:mm:ss 'de' dd/MM/yy", options)}</p>
        <p><strong>Saída:</strong> {format(data.endTime, "HH:mm:ss 'de' dd/MM/yy", options)}</p>
        <p className="border-t border-white/10 pt-1 mt-1"><strong>Duração:</strong> {data.duration}</p>
      </div>
    );
  }
  return null;
};

// Hook para buscar e processar os DADOS INDIVIDUAIS
function useIndividualSessionData(filters: ChartProps['filters']) {
  return useQuery({
    queryKey: ['individualSessions', filters],
    // Chama a nova função na API que busca os detalhes das sessões
    queryFn: () => dashboardApi.getSessionDetails(filters).then(res => res.data),
    enabled: !!(filters.universityId && (filters.studentId || filters.classId || filters.courseId)),
    staleTime: 1000 * 60 * 5,
    select: (apiData: SessionData[] | undefined) => {
      if (!apiData) return [];

      return apiData.map(session => {
        const startTime = new Date(session.startTime);
        const endTime = new Date(session.endTime);

        // Formata a duração (ex: "30 minutos", "1 hora", "5 segundos")
        const duration = formatDistanceStrict(endTime, startTime, { locale: ptBR });

        return {
          day: startTime.getDay(),
          // Converte hora e minutos para um valor decimal para plotagem precisa (ex: 14:30 se torna 14.5)
          hour: startTime.getHours() + startTime.getMinutes() / 60,
          startTime,
          endTime,
          duration,
        };
      });
    }
  });
}

export function AccessPatternChart({ filters }: ChartProps) {
  const { data: sessions, isLoading, isError, error, refetch } = useIndividualSessionData(filters);
  const hasData = sessions && sessions.length > 0;
  const shortDaysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
      <Card className="bg-[#1f1f1f] border-white/10 flex flex-col h-full">
        <CardHeader>
          <CardTitle className="text-white">Detalhes de Acesso por Sessão</CardTitle>
          <CardDescription className="text-white/70">Cada ponto representa uma sessão individual. Passe o mouse para ver os detalhes.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow pt-4">
          {isLoading && <ChartLoader />}
          {isError && <ChartError message={(error as Error)?.message} onRetry={refetch} />}
          {!isLoading && !isError && !hasData && <NoData onRetry={refetch} />}
          {!isLoading && !isError && hasData && (
            <ResponsiveContainer width="100%" height={250}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis
                  type="number" dataKey="hour" name="Hora"
                  domain={[0, 24]} ticks={[0, 3, 6, 9, 12, 15, 18, 21, 24]}
                  tickFormatter={(h) => `${Math.floor(h)}h`} stroke="#ffffff80" tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
                />
                <YAxis
                  type="number" dataKey="day" name="Dia"
                  domain={[-0.5, 6.5]} ticks={[0, 1, 2, 3, 4, 5, 6]}
                  tickFormatter={(d) => shortDaysOfWeek[d]} stroke="#ffffff80" tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
                />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomSessionTooltip />} />
                <Scatter data={sessions} fill="hsl(262, 83%, 77%)" shape="circle" />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}