import { useQuery } from "@tanstack/react-query";
import { Scatter, ScatterChart, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { dashboardApi, DashboardFilterParams } from "@/services/api/api_dashboard";
import { ChartLoader, ChartError, NoData } from "../ChartStates";
import { format, formatDistanceStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChartExportMenu } from "../ChartExportMenu";

interface SessionData {
  startTime: string;
  endTime: string;
}

interface ProcessedSession {
  day: number;
  hour: number;
  startTime: Date;
  endTime: Date;
  duration: string;
}

interface ChartProps {
  filters: DashboardFilterParams;
}

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

function useIndividualSessionData(filters: ChartProps['filters']) {
  return useQuery({
    queryKey: ['individualSessions', filters],
    queryFn: () => dashboardApi.getSessionDetails(filters).then(res => res.data),
    enabled: !!(filters.universityId && (filters.studentId || filters.classId || filters.courseId)),
    staleTime: 1000 * 60 * 5,
    select: (apiData: SessionData[] | undefined) => {
      if (!apiData) return [];

      return apiData.map(session => {
        const startTime = new Date(session.startTime);
        const endTime = new Date(session.endTime);

        const duration = formatDistanceStrict(endTime, startTime, { locale: ptBR });

        return {
          day: startTime.getDay(),
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

  const hasRequiredIds = !!(filters.universityId && (filters.studentId || filters.classId || filters.courseId));

  return (
    <Card id="access-pattern-chart" className="bg-[#1f1f1f] border-white/10 w-full mb-6">
      <CardHeader className="relative flex flex-col items-stretch p-0 space-y-0 border-b border-white/10">
        <div className="flex flex-col flex-1 gap-1 justify-center px-6 py-5">
          <CardTitle className="text-white">Detalhes de Acesso por Sessão</CardTitle>
          <CardDescription className="text-white/70">
            Cada ponto representa uma sessão individual. Passe o mouse para ver os detalhes.
          </CardDescription>
        </div>

        <div className="flex">
          <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t border-white/10 px-6 py-4 text-left invisible h-0" aria-hidden="true">
          </div>
        </div>

        <div className="absolute top-5 right-4 z-40">
          <ChartExportMenu containerId="access-pattern-chart" fileName="padrao_acesso_detalhado" />
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:p-6">
        {!hasRequiredIds && (
          <NoData onRetry={refetch}>
            <p>Selecione um aluno, turma ou curso para visualizar os detalhes de acesso.</p>
          </NoData>
        )}

        {hasRequiredIds && isLoading && <ChartLoader text="Carregando dados..." />}

        {hasRequiredIds && isError && <ChartError message={(error as Error)?.message} onRetry={refetch} />}

        {hasRequiredIds && !isLoading && !isError && hasData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
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
          </motion.div>
        )}

        {hasRequiredIds && !isLoading && !isError && !hasData && (
          <NoData onRetry={refetch}>Nenhum dado de sessão disponível para esta entidade.</NoData>
        )}
      </CardContent>
    </Card>
  );
}