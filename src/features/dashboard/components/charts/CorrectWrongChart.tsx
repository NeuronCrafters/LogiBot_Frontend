import { useQuery } from "@tanstack/react-query";
import { Pie, PieChart, Cell, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { logApi } from "@/services/apiClient";
import logApiSmart from "@/features/dashboard/api/logsSmartApi";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { DashboardFilterState } from "@/features/dashboard/filterTypes";
import { ChartLoader, ChartError, NoData } from "../ChartStates";
import { ChartDownloadButton } from "../ChartDownloadButton";

const COLORS = ["#10b981", "#ef4444"];
const CHART_INFO = "Proporção de acertos e erros nos quizzes. A fatia verde representa respostas corretas; a vermelha, os erros. Indica a taxa de acerto geral da entidade selecionada.";

interface CorrectWrongChartProps {
  filter: DashboardFilterState & {
    hierarchyParams: { universityId?: string; courseId?: string; classId?: string; disciplineId?: string };
  };
}

function useAccuracyData(filter: CorrectWrongChartProps["filter"]) {
  const { user } = useAuth();
  const userRoles: string[] = Array.isArray(user?.role) ? user.role : user?.role ? [user.role] : [];
  const validIds = Array.isArray(filter.ids) ? filter.ids.filter((id) => typeof id === "string" && id.trim() !== "") : [];
  const targetId = validIds[0] || "";
  const { universityId, courseId, classId, disciplineId } = filter.hierarchyParams;
  const isStudent = filter.type === "student";
  const hasRequired = !!universityId;

  return useQuery({
    queryKey: ["accuracy", filter.type, targetId, universityId, courseId, classId, disciplineId, userRoles],
    queryFn: async () => {
      if (!targetId) throw new Error("Filtros incompletos.");
      const isProfessor = userRoles.includes("professor");
      const isCoordinator = userRoles.includes("course-coordinator");
      const isAdmin = userRoles.includes("admin");
      const useSmartApi = !isCoordinator && !isAdmin && isProfessor && (filter.type === "discipline" || (filter.type === "student" && !!disciplineId));
      if (useSmartApi) return logApiSmart.fetchSummary(userRoles, filter.type, targetId, { universityId, courseId, classId, disciplineId });
      if (isStudent) return logApi.getFilteredStudentSummary({ universityId: universityId!, courseId, classId, studentId: targetId, disciplineId } as any);
      const calls: Record<string, () => Promise<any>> = {
        university: () => logApi.getUniversitySummary(targetId),
        course: () => logApi.getCourseSummary(targetId),
        class: () => logApi.getClassSummary(targetId),
        discipline: () => logApi.getDisciplineSummary(targetId),
      };
      const fn = calls[filter.type];
      if (!fn) throw new Error(`Tipo inválido: ${filter.type}`);
      return fn();
    },
    enabled: hasRequired,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    select: (rawData: any) => {
      const totalCorrect = Number(rawData.totalCorrect ?? rawData.totalCorrectAnswers ?? 0);
      const totalWrong = Number(rawData.totalWrong ?? rawData.totalWrongAnswers ?? 0);
      const total = totalCorrect + totalWrong;
      const accuracy = total > 0 ? (totalCorrect / total) * 100 : 0;
      return { chartData: [{ name: "Acertos", value: totalCorrect, fill: COLORS[0] }, { name: "Erros", value: totalWrong, fill: COLORS[1] }], totalCorrect, totalWrong, accuracy };
    },
  });
}

export function CorrectWrongChart({ filter }: CorrectWrongChartProps) {
  const { data: accuracyData, isLoading, isError, error, refetch } = useAccuracyData(filter);
  const hasRequired = !!filter.hierarchyParams.universityId;
  const hasData = !!accuracyData && (accuracyData.totalCorrect > 0 || accuracyData.totalWrong > 0);
  const refetchTyped = refetch as () => void;
  const errorMessage = error instanceof Error ? error.message : "Erro ao carregar dados.";

  return (
    <Card id="correct-wrong-chart" className="bg-[#1f1f1f] border-white/10 flex flex-col h-full">
      <CardHeader className="relative flex flex-col p-0 space-y-0 border-b border-white/10">
        <div className="flex items-start justify-between px-6 py-5 pr-28">
          <div>
            <CardTitle className="text-white font-[Poppins]">Desempenho por Tópico Geral</CardTitle>
            <CardDescription className="text-white/50 font-[Poppins] mt-1">Acertos e Erros com base na interação do Quiz</CardDescription>
          </div>
        </div>
        <div className="absolute top-5 right-4 z-40">
          <ChartDownloadButton containerId="correct-wrong-chart" fileName="acertos_erros" info={CHART_INFO} />
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col min-h-0 px-2 sm:p-6">
        {!hasRequired && <NoData onRetry={refetchTyped}><p>Selecione uma entidade para visualizar dados.</p></NoData>}
        {hasRequired && isLoading && <ChartLoader text="Carregando dados..." />}
        {hasRequired && isError && <ChartError message={errorMessage} onRetry={refetchTyped} />}
        {hasRequired && !isLoading && !isError && hasData && (
          <div className="flex flex-1 min-h-[260px] w-full items-center justify-center">
            <PieChart width={320} height={300}>
              <Pie data={accuracyData.chartData} cx="50%" cy="45%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value" nameKey="name">
                {accuracyData.chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#141414", borderColor: "rgba(255,255,255,0.1)", borderRadius: 12 }} labelStyle={{ color: "#fff" }} itemStyle={{ color: "#fff" }} />
              <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="font-[Poppins] text-xs text-white">{value}</span>} />
            </PieChart>
          </div>
        )}
        {hasRequired && !isLoading && !isError && !hasData && <NoData onRetry={refetchTyped}><p>Nenhum dado de acertos/erros disponível.</p></NoData>}
      </CardContent>

      {hasData && (
        <CardFooter className="flex justify-between items-center px-6 py-4 border-t border-white/10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /><span className="font-[Poppins] text-sm text-white">Acertos: {accuracyData!.totalCorrect}</span></div>
            <span className="text-white/20">|</span>
            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /><span className="font-[Poppins] text-sm text-white">Erros: {accuracyData!.totalWrong}</span></div>
          </div>
          <span className="font-[Poppins] text-sm text-zinc-400">Precisão: <span className="font-semibold text-white">{accuracyData!.accuracy.toFixed(1)}%</span></span>
        </CardFooter>
      )}
    </Card>
  );
}
