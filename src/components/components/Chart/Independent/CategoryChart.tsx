import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, PolarRadiusAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import { motion } from "framer-motion";
import { logApi } from "@/services/apiClient";
import logApiSmart from "@/services/api/logApiSmart";
import { useAuth } from "@/hooks/use-Auth";
import type { ChartFilterState } from "@/@types/ChartsType";

const chartConfig = {
  acessos: { label: "Acessos", color: "hsl(215, 100%, 50%)" },
} satisfies ChartConfig;

interface CategoryChartProps {
  filter: ChartFilterState & {
    hierarchyParams: {
      universityId?: string;
      courseId?: string;
      classId?: string;
      disciplineId?: string;
    };
  };
}

function useSubjectsData(filter: CategoryChartProps['filter']) {
  const { user } = useAuth();
  const userRoles: string[] = Array.isArray(user?.role) ? user.role : user?.role ? [user.role] : [];

  const validIds = Array.isArray(filter.ids)
    ? filter.ids.filter(id => typeof id === 'string' && id.trim() !== '')
    : [];
  const targetId = validIds[0] || "";
  const { universityId, courseId, classId, disciplineId } = filter.hierarchyParams;
  const isStudent = filter.type === 'student';
  const hasRequired = isStudent
    ? Boolean(universityId && courseId && (classId || disciplineId) && targetId)
    : Boolean(targetId);

  return useQuery({
    queryKey: ['subjects', filter.type, targetId, universityId, courseId, classId, disciplineId],
    queryFn: async () => {
      if (!hasRequired) throw new Error('Selecione todos os filtros para visualizar');

      const isProfessor = userRoles.includes("professor");
      if (isProfessor && (filter.type === "discipline" || filter.type === "student")) {
        console.log("📊 CategoryChart - Usando logApiSmart para professor");
        const response = await logApiSmart.fetchSummary(
          userRoles,
          filter.type,
          targetId,
          { universityId, courseId, classId, disciplineId }
        );
        console.log("📊 CategoryChart - Dados do logApiSmart:", response);
        return response;
      }

      if (isStudent) {
        return await logApi.getFilteredStudentSummary({
          universityId: universityId!,
          courseId,
          classId,
          studentId: targetId
        });
      }

      switch (filter.type) {
        case 'university':
          return await logApi.getUniversitySummary(targetId);
        case 'course':
          return await logApi.getCourseSummary(targetId);
        case 'class':
          return await logApi.getClassSummary(targetId);
        case 'discipline':
          return await logApi.getDisciplineSummary(targetId);
        default:
          throw new Error(`Tipo inválido: ${filter.type}`);
      }
    },
    enabled: hasRequired,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    select: (raw: any) => {
      console.log("📊 CategoryChart - Dados brutos recebidos:", raw);
      const subjectCounts: Record<string, number> = raw.subjectCounts ?? {};
      const chartData = [
        { category: 'Variáveis', acessos: subjectCounts.variaveis ?? 0 },
        { category: 'Tipos', acessos: subjectCounts.tipos ?? 0 },
        { category: 'Funções', acessos: subjectCounts.funcoes ?? 0 },
        { category: 'Loops', acessos: subjectCounts.loops ?? 0 },
        { category: 'Verificações', acessos: subjectCounts.verificacoes ?? 0 },
      ];
      const totalAccesses = chartData.reduce((sum, d) => sum + d.acessos, 0);
      console.log("📊 CategoryChart - Dados processados:", { chartData, subjectCounts, totalAccesses });
      return { chartData, subjectCounts, totalAccesses };
    }
  });
}

export function CategoryChart({ filter }: CategoryChartProps) {
  const { data, isLoading, isError, refetch } = useSubjectsData(filter);

  const validIds = Array.isArray(filter.ids) ? filter.ids.filter(id => id && id.trim()) : [];
  const id = validIds[0] || '';
  const isStudent = filter.type === 'student';
  const hasRequired = isStudent
    ? Boolean(filter.hierarchyParams.universityId && filter.hierarchyParams.courseId && filter.hierarchyParams.classId && id)
    : Boolean(id);

  const hasData = useMemo(() => (data?.totalAccesses ?? 0) > 0, [data]);

  const topCategory = useMemo(() => {
    if (!data) return null;
    let max = 0, key = '';
    Object.entries(data.subjectCounts).forEach(([k, v]: any) => {
      if (v > max) { max = v; key = k; }
    });
    if (max <= 0) return null;
    const labels: Record<string, string> = {
      variaveis: 'Variáveis',
      tipos: 'Tipos',
      funcoes: 'Funções',
      loops: 'Loops',
      verificacoes: 'Verificações'
    };
    return { name: labels[key] ?? key, value: max, percentage: Math.round((max / data.totalAccesses) * 100) };
  }, [data]);

  return (
    <Card className="bg-[#1f1f1f] border-white/10 w-full mb-6">
      <CardHeader className="flex flex-col pb-4 space-y-0 border-b border-white/10">
        <CardTitle className="text-white">Assunto Mais Acessado: Chat</CardTitle>
        <CardDescription className="text-white/70">
          Acessos por categoria de conteúdo
        </CardDescription>
      </CardHeader>

      <CardContent className="px-2 sm:p-6 h-[299px] flex items-center justify-center">
        {(!hasRequired || isLoading || isError || !hasData) && (
          <div className="flex flex-col items-center">
            {isLoading && <div className="mb-3 w-10 h-10 rounded-full animate-pulse bg-indigo-600/30"></div>}
            {isError && (
              <svg className="mb-3 text-indigo-400/60" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            {!isLoading && !isError && !hasRequired && <p className="text-white/70">Selecione uma entidade para visualizar dados</p>}
            {!isLoading && !isError && hasRequired && !hasData && <p className="text-white/70">Nenhum dado de categorias disponível.</p>}
            {(isError || (!hasData && hasRequired)) && (
              <button onClick={() => refetch()} className="mt-3 text-xs text-indigo-400 transition-colors hover:text-indigo-300">Tentar novamente</button>
            )}
          </div>
        )}

        {!isLoading && !isError && hasData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="w-full h-full">
            <ChartContainer config={chartConfig} className="w-full h-full text-white aspect-auto">
              <RadarChart data={data!.chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <ChartTooltip cursor={false} content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const entry = payload[0].payload;
                  return (
                    <div className="p-2 bg-[#1f1f1f] border border-[#333] rounded shadow text-white text-sm">
                      <p className="mb-1 font-semibold">{entry.category}</p>
                      <p><span className="text-[#999] mr-2">Acessos:</span><span className="font-medium">{entry.acessos}</span></p>
                    </div>
                  );
                }} />
                <PolarGrid gridType="polygon" radialLines stroke="#d4d0d0" strokeOpacity={0.6} strokeDasharray="2 2" />
                <PolarAngleAxis dataKey="category" tick={{ fill: '#FFF', fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} tick={false} axisLine={false} />
                <Radar dataKey="acessos" fill="#274a96" fillOpacity={0.3} stroke="#274a96" strokeWidth={2} dot={{ fill: '#274a96', strokeWidth: 0, r: 4 }} />
              </RadarChart>
            </ChartContainer>
          </motion.div>
        )}
      </CardContent>

      {hasData && (
        <CardFooter className="flex justify-between items-center px-6 py-4 border-t border-white/10">
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-white">Total: {data!.totalAccesses}</span>
              <span className="text-white/50">|</span>
              <span className="font-medium text-white">Mais acessado: {topCategory?.name}</span>
            </div>
            <div className="mt-1">
              <span className="text-sm text-white/70">Porcentagem: {topCategory?.percentage.toFixed(1)}%</span>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
