import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { dashboardApi } from "@/features/dashboard/api/dashboardApi";
import { ChartLoader, ChartError, NoData } from "../ChartStates";
import { ChartDownloadButton } from "../ChartDownloadButton";

const CHART_INFO =
  "Overall score from 0 to 10 calculated from the average accuracy rate across all quiz topics. The higher, the better the mastery of the content. 0–4.99 Insufficient · 5–6.99 Fair · 7–8.99 Good · 9–10 Excellent.";

const SCORE_COLORS = {
  ruim: "#ef4444",
  regular: "#f59e0b",
  bom: "#3b82f6",
  excelente: "#10b981",
};

interface ChartProps {
  filters: {
    universityId?: string;
    courseId?: string;
    classId?: string;
    studentId?: string;
    disciplineId?: string;
  };
}

function useScoreData(filters: ChartProps["filters"]) {
  return useQuery({
    queryKey: ["topicPerformance", filters],
    queryFn: async () => {
      const response = await dashboardApi.getTopicPerformance(filters);
      return response.data;
    },
    enabled: !!filters.universityId,
    staleTime: 1000 * 60 * 5,
    select: (data) => {
      const active = data.filter(
        (t: any) => t.successPercentage > 0 || t.errorPercentage > 0,
      );
      if (active.length === 0)
        return { score: 0, status: "No Data", color: "#444" };
      const avg =
        active.reduce(
          (acc: number, curr: any) => acc + curr.successPercentage,
          0,
        ) / active.length;
      const score = avg / 10;
      if (score >= 9)
        return { score, status: "Excellent", color: SCORE_COLORS.excelente };
      if (score >= 7) return { score, status: "Good", color: SCORE_COLORS.bom };
      if (score >= 5)
        return { score, status: "Fair", color: SCORE_COLORS.regular };
      return { score, status: "Insufficient", color: SCORE_COLORS.ruim };
    },
  });
}

export function GeneralScoreChart({ filters }: ChartProps) {
  const { data, isLoading, isError, error, refetch } = useScoreData(filters);
  const hasRequired = !!filters.universityId;
  const hasData = data && data.score > 0;
  const refetchTyped = refetch as () => void;
  const errorMessage =
    error instanceof Error ? error.message : "Failed to calculate score.";
  const chartData = [{ category: "Score", score: data?.score ?? 0 }];

  const bands = [
    { label: "0–4.99", desc: "Insufficient", color: "text-red-400" },
    { label: "5–6.99", desc: "Fair", color: "text-amber-400" },
    { label: "7–8.99", desc: "Good", color: "text-blue-400" },
    { label: "9–10", desc: "Excellent", color: "text-emerald-400" },
  ];

  return (
    <Card
      id="general-score-card"
      className="bg-[#1f1f1f] border-white/10 flex flex-col h-full"
    >
      <CardHeader className="relative flex flex-col p-0 space-y-0 border-b border-white/10">
        <div className="flex items-start justify-between px-6 py-5 pr-36">
          <div>
            <CardTitle className="text-white font-[Poppins]">
              Overall Performance Score
            </CardTitle>
            <CardDescription className="text-white/50 font-[Poppins] mt-1">
              Average based on Quiz topic proficiency (0–10 scale)
            </CardDescription>
          </div>
        </div>
        <div className="absolute top-5 right-4 z-40">
          <ChartDownloadButton
            containerId="general-score-card"
            fileName="nota_geral"
            info={CHART_INFO}
            insight={{
              chart: "general-score",
              title: "Overall performance score",
              filters,
              disabled: isLoading || !hasData,
            }}
          />
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 min-h-[260px] items-center justify-center px-2 sm:p-6">
        {!hasRequired && (
          <NoData onRetry={refetchTyped}>
            <p>Select a university.</p>
          </NoData>
        )}
        {hasRequired && isLoading && <ChartLoader text="Calculating score..." />}
        {hasRequired && isError && (
          <ChartError message={errorMessage} onRetry={refetchTyped} />
        )}

        {hasRequired && !isLoading && !isError && hasData && (
          <div className="flex w-full max-w-sm flex-col items-center gap-5">
            <div className="flex flex-col items-center gap-2">
              <span
                className="font-[Poppins] text-6xl font-bold tabular-nums"
                style={{ color: data.color }}
              >
                {data.score.toFixed(2)}
              </span>
              <span
                className="rounded-full px-3 py-0.5 font-[Poppins] text-sm font-semibold uppercase tracking-wider"
                style={{
                  color: data.color,
                  backgroundColor: `${data.color}18`,
                  border: `1px solid ${data.color}30`,
                }}
              >
                {data.status}
              </span>
            </div>

            <div className="w-full max-w-[280px]">
              <div className="h-2.5 w-full rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(data.score / 10) * 100}%`,
                    backgroundColor: data.color,
                  }}
                />
              </div>
              <div className="mt-1.5 flex justify-between font-[Poppins] text-[10px] text-zinc-700">
                <span>0</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
              {bands.map((b) => (
                <span
                  key={b.label}
                  className="font-[Poppins] text-[11px] text-zinc-600"
                >
                  {b.label}: <span className={b.color}>{b.desc}</span>
                </span>
              ))}
            </div>

            <div className="h-0 w-full overflow-hidden opacity-0 pointer-events-none">
              <ResponsiveContainer width="100%" height={40}>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                  barSize={20}
                >
                  <XAxis type="number" domain={[0, 10]} hide />
                  <YAxis type="category" dataKey="category" hide />
                  <Tooltip cursor={false} content={() => null} />
                  <Bar dataKey="score" radius={[4, 4, 4, 4]}>
                    <Cell fill={data.color} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {!isLoading && !isError && hasRequired && !hasData && (
          <NoData onRetry={refetchTyped}>
            <p>Not enough data to calculate the score.</p>
          </NoData>
        )}
      </CardContent>

      {hasData && (
        <CardFooter className="flex justify-between border-t border-white/10 px-6 py-4">
          <div className="flex flex-col">
            <span className="font-[Poppins] text-xs uppercase tracking-wider text-zinc-600">
              Rating
            </span>
            <span
              className="mt-0.5 font-[Poppins] text-lg font-bold"
              style={{ color: data.color }}
            >
              {data.status}
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="font-[Poppins] text-xs uppercase tracking-wider text-zinc-600">
              Final Score
            </span>
            <span className="mt-0.5 font-[Poppins] text-lg font-bold text-white">
              {data.score.toFixed(2)}
              <span className="ml-1 font-[Poppins] text-sm font-normal text-zinc-600">
                / 10
              </span>
            </span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
