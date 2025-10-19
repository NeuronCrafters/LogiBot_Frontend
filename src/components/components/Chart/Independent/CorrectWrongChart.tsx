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
import logApiSmart from "@/services/api/logApiSmart";
import { useAuth } from "@/hooks/use-Auth";
import type { ChartFilterState } from "@/@types/ChartsType";
import { ChartLoader, ChartError, NoData } from "../ChartStates";

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
  const { user } = useAuth();
  const userRoles: string[] = Array.isArray(user?.role) ? user.role : user?.role ? [user.role] : [];

  const validIds = Array.isArray(filter.ids)
    ? filter.ids.filter(id => typeof id === 'string' && id.trim() !== '')
    : [];
  const studentId = validIds[0] || "";
  const { universityId, courseId, classId, disciplineId } = filter.hierarchyParams;
  const isStudent = filter.type === 'student';

  // Para estudantes, precisa de universidadeId, courseId, classId/disciplineId e studentId
  const hasRequired = isStudent
    ? Boolean(universityId && courseId && (classId || disciplineId) && studentId)
    : Boolean(studentId);

  return useQuery({
    queryKey: [
      'accuracy',
      filter.type,
      studentId,
      universityId,
      courseId,
      classId,
      disciplineId
    ],
    queryFn: async () => {
      if (!hasRequired) throw new Error('Filtros incompletos.');

      const isProfessor = userRoles.includes("professor");
      if (isProfessor && (filter.type === "discipline" || filter.type === "student")) {
        const response = await logApiSmart.fetchSummary(
          userRoles,
          filter.type,
          studentId,
          { universityId, courseId, classId, disciplineId }
        );
        return response;
      }

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
        case 'discipline':
          return await logApi.getDisciplineSummary(studentId);
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
  const { universityId, courseId, classId, disciplineId } = filter.hierarchyParams;
  const isStudent = filter.type === 'student';
  const hasRequired = isStudent
    ? Boolean(universityId && courseId && (classId || disciplineId) && studentId)
    : Boolean(studentId);

  const hasData = accuracyData &&
    accuracyData.chartData.length > 0 &&
    (accuracyData.totalCorrect > 0 || accuracyData.totalWrong > 0);

  const refetchTyped = refetch as () => void;
  const errorMessage = error instanceof Error ? error.message : "Erro ao carregar dados.";

  return (
    <Card className="bg-[#1f1f1f] border-white/10 w-full mb-6">
      {/* HEADER PADRONIZADO EM ALTURA */}
      <CardHeader className="flex flex-col items-stretch p-0 space-y-0 border-b border-white/10">
        <div className="flex flex-col flex-1 gap-1 justify-center px-6 py-5">
          <CardTitle className="text-white">Desempenho por Tópico Geral</CardTitle>
          <CardDescription className="text-white/70">
            Acertos e Erros com Base na interação do Quiz
          </CardDescription>
        </div>
        {/* Elemento invisível para manter a altura do CardHeader consistente com o UsageChart */}
        <div className="flex">
          <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t border-white/10 px-6 py-4 text-left invisible h-0" aria-hidden="true" />
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:p-6">
        {/* Estados: falta seleção */}
        {!hasRequired && (
          <NoData onRetry={refetchTyped}>
            <p>Selecione uma entidade para visualizar dados</p>
          </NoData>
        )}

        {/* Estados: loading */}
        {hasRequired && isLoading && <ChartLoader text="Carregando dados..." />}

        {/* Estados: erro */}
        {hasRequired && isError && <ChartError message={errorMessage} onRetry={refetchTyped} />}


        {hasRequired && !isLoading && !isError && hasData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="flex justify-center items-center w-full h-[250px]">
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

        {/* Sem dados */}
        {hasRequired && !isLoading && !isError && !hasData && (
          <NoData onRetry={refetchTyped}>
            <p>Nenhum dado de acertos/erros disponível para esta entidade.</p>
          </NoData>
        )}
      </CardContent>

      {hasData && (
        <CardFooter className="flex justify-between items-center px-6 py-4 border-t border-white/10">
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