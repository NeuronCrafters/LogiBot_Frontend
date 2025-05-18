import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { motion } from "framer-motion";
import { useChartData } from "@/hooks/use-ChartData";
import type { ChartFilterState, AccuracyData } from "@/@types/ChartsType";

const COLORS = ["#10b981", "#ef4444"];

export function CorrectWrongChart({ filter }: { filter: ChartFilterState }) {
  const isValidFilter = !!filter.ids[0] && filter.ids[0].trim() !== "";

  const {
    data,
    isLoading,
    isError,
    error,
  } = useChartData<any>(
    filter.type,
    "accuracy",
    "individual",
    filter.ids[0] || "",
    !isValidFilter
  );

  const processedData: AccuracyData[] = !data
    ? []
    : [
      { name: "Acertos", value: data?.totalCorrect ?? 0 },
      { name: "Erros", value: data?.totalWrong ?? 0 },
    ];

  const hasData = processedData.some((d) => d.value > 0);

  return (
    <Card className="p-4 bg-[#141414] border-white/10">
      <div className="space-y-4">
        <Typograph
          text="Taxa de Acertos e Erros"
          variant="text6"
          weight="semibold"
          fontFamily="montserrat"
          colorText="text-white"
        />

        {!isValidFilter ? (
          <div className="flex items-center justify-center h-64 text-white/70">
            Selecione uma entidade para visualizar dados
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-64 text-white/70">
            Carregando dados...
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center h-64 text-red-400">
            {error}
          </div>
        ) : hasData ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="h-64 w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={processedData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {processedData.map((_, i) => (
                    <Cell
                      key={`cell-${i}`}
                      fill={COLORS[i % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span style={{ color: "#fff" }}>{value}</span>
                  )}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f1f1f",
                    borderColor: "#333",
                  }}
                  labelStyle={{ color: "#fff" }}
                  itemStyle={{ color: "#fff" }}
                  formatter={(value) => [`${value} questões`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        ) : (
          <div className="flex items-center justify-center h-64 text-white/70">
            Nenhum dado disponível para este aluno.
          </div>
        )}
      </div>
    </Card>
  );
}
