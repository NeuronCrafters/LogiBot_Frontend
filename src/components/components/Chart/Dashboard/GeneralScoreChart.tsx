import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { motion } from "framer-motion";
import { dashboardApi } from "@/services/api/api_dashboard";
import { ChartLoader, ChartError, NoData } from "../ChartStates";
import { ChartExportMenu } from "../ChartExportMenu";
import { Typograph } from "@/components/components/Typograph/Typograph";

interface ChartProps {
  filters: { universityId?: string; courseId?: string; classId?: string; studentId?: string; disciplineId?: string; };
}

const SCORE_COLORS = {
  ruim: "#ef4444",
  regular: "#f59e0b",
  bom: "#3b82f6",
  excelente: "#10b981",
};

function useScoreData(filters: ChartProps['filters']) {
  return useQuery({
    queryKey: ['topicPerformance', filters],
    queryFn: async () => {
      const response = await dashboardApi.getTopicPerformance(filters);
      return response.data;
    },
    enabled: !!filters.universityId,
    staleTime: 1000 * 60 * 5,
    select: (data) => {
      const activeTopics = data.filter((t: any) => t.successPercentage > 0 || t.errorPercentage > 0);

      if (activeTopics.length === 0) return { score: 0, status: "Sem Dados", color: "#333" };

      const sumPercentages = activeTopics.reduce((acc: number, curr: any) => acc + curr.successPercentage, 0);
      const averagePercentage = sumPercentages / activeTopics.length;
      const score = averagePercentage / 10;

      let status = "Insuficiente";
      let color = SCORE_COLORS.ruim;

      if (score >= 9) {
        status = "Excelente";
        color = SCORE_COLORS.excelente;
      } else if (score >= 7) {
        status = "Bom";
        color = SCORE_COLORS.bom;
      } else if (score >= 5) {
        status = "Regular";
        color = SCORE_COLORS.regular;
      } else {
        status = "Insuficiente";
        color = SCORE_COLORS.ruim;
      }

      return { score, status, color };
    }
  });
}

export function GeneralScoreChart({ filters }: ChartProps) {
  const { data, isLoading, isError, error, refetch } = useScoreData(filters);
  const hasRequired = !!filters.universityId;
  const hasData = data && data.score > 0;

  const refetchTyped = refetch as () => void;
  const errorMessage = error instanceof Error ? error.message : "Erro ao calcular nota.";

  const chartData = [
    { category: "Nota Geral", score: data?.score || 0, fill: data?.color || "#333" }
  ];

  return (
    <Card id="general-score-card" className="bg-[#1f1f1f] border-white/10 w-full mb-6">

      <CardHeader className="relative flex flex-col items-stretch p-0 space-y-0 border-b border-white/10">
        <div className="flex flex-col flex-1 gap-1 justify-center px-6 py-5">
          <CardTitle className="text-white">Avaliação Geral de Desempenho</CardTitle>
          <CardDescription className="text-white/70">
            Média baseada na proficiência dos tópicos do Quiz (Escala 0–10).
          </CardDescription>
        </div>

        <div className="flex">
          <div
            className="relative z-30 flex flex-1 flex-col justify-center gap-1 
            border-t border-white/10 px-6 py-4 text-left invisible h-0"
          />
        </div>

        <div className="absolute top-1/2 transform -translate-y-1/2 right-4">
          <ChartExportMenu containerId="general-score-card" fileName="nota_geral" />
        </div>
      </CardHeader>


      <CardContent className="px-2 sm:p-6 h-[298px] flex items-center justify-center">

        {!hasRequired && <NoData onRetry={refetchTyped}><p>Selecione uma universidade.</p></NoData>}
        {hasRequired && isLoading && <ChartLoader text="Calculando nota..." />}
        {hasRequired && isError && <ChartError message={errorMessage} onRetry={refetchTyped} />}

        {hasRequired && !isLoading && !isError && hasData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center w-[800px] gap-4"
          >

            {/* Nota e status com 2 casas decimais */}
            <div className="flex flex-col items-center">
              <span className="text-6xl font-bold" style={{ color: data.color }}>
                {data.score.toFixed(2).replace('.', ',')}
              </span>

              <span
                className="text-base font-medium uppercase tracking-widest mt-1 px-3 py-1 
                rounded-full bg-white/5"
                style={{ color: data.color, border: `1px solid ${data.color}40` }}
              >
                {data.status}
              </span>
            </div>

            <div className="w-full max-w-[70%] h-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                  barSize={20}
                >
                  <XAxis type="number" domain={[0, 10]} hide />
                  <YAxis type="category" dataKey="category" hide />
                  <Tooltip cursor={false} content={() => null} />

                  <Bar dataKey="score" radius={[6, 6, 6, 6]}
                    background={{ fill: "rgba(255,255,255,0.05)", radius: 6 }}>
                    <Cell fill={data.color} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-2">

              <div className="flex items-center gap-1">
                <Typograph variant="text9" weight="regular" fontFamily="poppins" colorText="text-gray-400" text="0 – 4,99:" />
                <Typograph variant="text9" weight="bold" fontFamily="poppins" colorText="text-red-400" text="Insuficiente" />
              </div>

              <Typograph variant="text9" weight="regular" fontFamily="poppins" colorText="text-gray-500" text="|" />

              <div className="flex items-center gap-1">
                <Typograph variant="text9" weight="regular" fontFamily="poppins" colorText="text-gray-400" text="5 – 6,99:" />
                <Typograph variant="text9" weight="bold" fontFamily="poppins" colorText="text-yellow-400" text="Regular" />
              </div>

              <Typograph variant="text9" weight="regular" fontFamily="poppins" colorText="text-gray-500" text="|" />

              <div className="flex items-center gap-1">
                <Typograph variant="text9" weight="regular" fontFamily="poppins" colorText="text-gray-400" text="7 – 8,99:" />
                <Typograph variant="text9" weight="bold" fontFamily="poppins" colorText="text-blue-400" text="Bom" />
              </div>

              <Typograph variant="text9" weight="regular" fontFamily="poppins" colorText="text-gray-500" text="|" />

              <div className="flex items-center gap-1">
                <Typograph variant="text9" weight="regular" fontFamily="poppins" colorText="text-gray-400" text="9 – 10:" />
                <Typograph variant="text9" weight="bold" fontFamily="poppins" colorText="text-green-400" text="Excelente" />
              </div>

            </div>

          </motion.div>
        )}

        {!isLoading && !isError && hasRequired && !hasData && (
          <NoData onRetry={refetchTyped}><p>Sem dados suficientes para calcular a nota.</p></NoData>
        )}

      </CardContent>

      {hasData && (
        <CardFooter className="flex flex-col gap-3 px-6 py-5 border-t border-white/10">
          <div className="flex w-full justify-between items-center">

            <div className="flex flex-col w-1/2 border-r border-white/10 pr-4 text-right">
              <span className="text-xs text-gray-400 uppercase font-medium">
                Classificação
              </span>
              <span className="text-lg font-bold" style={{ color: data.color }}>
                {data.status}
              </span>
            </div>

            <div className="flex flex-col w-1/2 pl-4 text-left">
              <span className="text-xs text-gray-400 uppercase font-medium">
                Nota Final
              </span>
              <span className="text-lg font-bold text-white">
                {data.score.toFixed(2).replace('.', ',')}
                <span className="text-xs text-gray-500 font-normal"> / 10</span>
              </span>
            </div>
          </div>
        </CardFooter>
      )}

    </Card>
  );
}