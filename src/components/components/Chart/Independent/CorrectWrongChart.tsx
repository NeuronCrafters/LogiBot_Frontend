import { useQuery } from "@tanstack/react-query";
import { Pie, PieChart, Cell, Tooltip, Legend } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import { logApi } from "@/services/apiClient";
import type { ChartFilterState } from "@/@types/ChartsType";

const COLORS = ["#3f7d7d", "#7d3f3f"];


interface CorrectWrongChartProps {
  filter: ChartFilterState & {
    hierarchyParams: {
      universityId?: string;
      courseId?: string;
      classId?: string;
      disciplineId?: string;
    };
  };
}

function useAccuracyData(filter: CorrectWrongChartProps['filter']) {
  const validIds = Array.isArray(filter.ids)
    ? filter.ids.filter(id => typeof id === 'string' && id.trim() !== '')
    : [];
  const studentId = validIds[0] || "";
  const { universityId, courseId, classId } = filter.hierarchyParams;
  const isStudent = filter.type === 'student';

  // Para estudantes, precisa de universidadeId, courseId, classId e studentId
  const hasRequired = isStudent
    ? Boolean(universityId && courseId && classId && studentId)
    : Boolean(studentId);

  return useQuery({
    queryKey: [
      'accuracy',
      filter.type,
      isStudent ? universityId : studentId,
      courseId,
      classId,
      studentId
    ],
    queryFn: async () => {
      if (!hasRequired) throw new Error('Filtros incompletos.');

      if (isStudent) {
        return await logApi.getFilteredStudentSummary({
          universityId: universityId!,
          courseId,
          classId,
          studentId
        });
      }

      switch (filter.type) {
        case 'university':
          return await logApi.getUniversitySummary(studentId);
        case 'course':
          return await logApi.getCourseSummary(studentId);
        case 'class':
          return await logApi.getClassSummary(studentId);
        default:
          throw new Error(`Tipo inválido: ${filter.type}`);
      }
    },
    enabled: hasRequired,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    select: (rawData: any) => {
      // Extrai acertos e erros
      const totalCorrect = Number(
        rawData.totalCorrect ?? rawData.totalCorrectAnswers ?? 0
      );
      const totalWrong = Number(
        rawData.totalWrong ?? rawData.totalWrongAnswers ?? 0
      );
      const total = totalCorrect + totalWrong;
      const accuracy = total > 0 ? (totalCorrect / total) * 100 : 0;
      const chartData = [
        { name: 'Acertos', value: totalCorrect, fill: COLORS[0] },
        { name: 'Erros', value: totalWrong, fill: COLORS[1] }
      ];
      return { chartData, totalCorrect, totalWrong, accuracy };
    }
  });
}

export function CorrectWrongChart({ filter }: CorrectWrongChartProps) {
  const {
    data: accuracyData,
    isLoading,
    isError,
    error,
    refetch
  } = useAccuracyData(filter);

  const validIds = Array.isArray(filter.ids)
    ? filter.ids.filter(id => typeof id === 'string' && id.trim() !== '')
    : [];
  const studentId = validIds[0] || "";
  const { universityId, courseId, classId } = filter.hierarchyParams;
  const isStudent = filter.type === 'student';
  const hasRequired = isStudent
    ? Boolean(universityId && courseId && classId && studentId)
    : Boolean(studentId);

  const hasData = accuracyData &&
    accuracyData.chartData.length > 0 &&
    (accuracyData.totalCorrect > 0 || accuracyData.totalWrong > 0);

  return (
    <Card className="bg-[#1f1f1f] border-white/10 w-full mb-0">
      <CardHeader className="flex flex-col space-y-0 border-b border-white/10 pb-4">
        <CardTitle className="text-white">Taxa de Acertos e Erros</CardTitle>
        <CardDescription className="text-white/70">
          Acertos e Erros com Base na interação do Quiz
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 py-6 h-[299px] flex items-center justify-center">
        {!hasRequired && (
          <div className="flex items-center justify-center h-full w-full text-center text-white/70">
            <p>Selecione uma entidade para visualizar dados</p>
          </div>
        )}

        {hasRequired && isLoading && (
          <div className="flex items-center justify-center h-full w-full text-center text-white/70">
            <div className="flex flex-col items-center">
              <div className="animate-pulse w-10 h-10 rounded-full bg-indigo-600/30 mb-3" />
              <p>Carregando dados...</p>
            </div>
          </div>
        )}

        {hasRequired && isError && (
          <div className="flex items-center justify-center h-full w-full text-center text-white/70">
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-indigo-400/60">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p>{error instanceof Error ? error.message : "Erro ao carregar dados."}</p>
              <button onClick={() => refetch()} className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {hasRequired && !isLoading && !isError && hasData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="h-full w-full flex items-center justify-center">
            <PieChart width={300} height={250}>
              <Pie data={accuracyData.chartData} cx="50%" cy="50%" labelLine={false} outerRadius={80} dataKey="value" nameKey="name">
                {accuracyData.chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#1f1f1f", borderColor: "#333" }} labelStyle={{ color: "#fff" }} itemStyle={{ color: "#fff" }} />
              <Legend verticalAlign="bottom" height={36} formatter={value => <span style={{ color: "#fff" }}>{value}</span>} />
            </PieChart>
          </motion.div>
        )}

        {hasRequired && !isLoading && !isError && !hasData && (
          <div className="flex items-center justify-center h-full w-full text-center text-white/70">
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-indigo-400/60">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p>Nenhum dado de acertos/erros disponível para esta entidade.</p>
              <button onClick={() => refetch()} className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                Tentar novamente
              </button>
            </div>
          </div>
        )}
      </CardContent>

      {hasData && (
        <CardFooter className="flex justify-between items-center border-t border-white/10 px-6 py-4">
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-white">Acertos: {accuracyData.totalCorrect}</span>
              <span className="text-white/50">|</span>
              <span className="font-medium text-white">Erros: {accuracyData.totalWrong}</span>
            </div>
            <div className="mt-1">
              <span className="text-sm text-white/70">Precisão: {accuracyData.accuracy.toFixed(1)}%</span>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
