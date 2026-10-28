import { useQuery } from "@tanstack/react-query";
import {
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  dashboardApi,
  DashboardFilterParams,
} from "@/features/dashboard/api/dashboardApi";
import { ChartLoader, ChartError, NoData } from "../ChartStates";
import { formatDateTime, formatDuration } from "@/shared/lib/formatDate";
import { ChartDownloadButton } from "../ChartDownloadButton";

const CHART_INFO =
  "Each point represents a usage session. The horizontal axis shows the time of day and the vertical axis the day of the week — it reveals when users are most active.";

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

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d: ProcessedSession = payload[0].payload;
  return (
    <div className="rounded-xl border border-white/10 bg-[#141414] px-3 py-2.5 text-sm shadow-xl space-y-1">
      <p className="font-[Poppins] text-zinc-400">
        Entry:{" "}
        <span className="font-medium text-white">
          {formatDateTime(d.startTime)}
        </span>
      </p>
      <p className="font-[Poppins] text-zinc-400">
        Exit:{" "}
        <span className="font-medium text-white">
          {formatDateTime(d.endTime)}
        </span>
      </p>
      <p className="border-t border-white/10 pt-1 font-[Poppins] text-zinc-400">
        Duration: <span className="font-medium text-white">{d.duration}</span>
      </p>
    </div>
  );
};

function useSessionData(filters: ChartProps["filters"]) {
  return useQuery({
    queryKey: ["individualSessions", filters],
    queryFn: () =>
      dashboardApi.getSessionDetails(filters).then((res) => res.data),
    enabled: !!(
      filters.universityId &&
      (filters.studentId || filters.classId || filters.courseId)
    ),
    staleTime: 1000 * 60 * 5,
    select: (apiData: SessionData[] | undefined) => {
      if (!apiData) return [];
      return apiData.map((s) => {
        const start = new Date(s.startTime);
        const end = new Date(s.endTime);
        return {
          day: start.getDay(),
          hour: start.getHours() + start.getMinutes() / 60,
          startTime: start,
          endTime: end,
          duration: formatDuration(end, start),
        };
      });
    },
  });
}

export function AccessPatternChart({ filters }: ChartProps) {
  const {
    data: sessions,
    isLoading,
    isError,
    error,
    refetch,
  } = useSessionData(filters);
  const hasData = sessions && sessions.length > 0;
  const hasRequiredIds = !!(
    filters.universityId &&
    (filters.studentId || filters.classId || filters.courseId)
  );

  return (
    <Card
      id="access-pattern-chart"
      className="bg-[#1f1f1f] border-white/10 flex flex-col"
    >
      <CardHeader className="relative flex flex-col p-0 space-y-0 border-b border-white/10">
        <div className="flex items-start justify-between px-6 py-5 pr-36">
          <div>
            <CardTitle className="text-white font-[Poppins]">
              Access Details by Session
            </CardTitle>
            <CardDescription className="text-white/50 font-[Poppins] mt-1">
              Each point is a session — hover to see the details
            </CardDescription>
          </div>
        </div>
        <div className="absolute top-5 right-4 z-40">
          <ChartDownloadButton
            containerId="access-pattern-chart"
            fileName="padrao_acesso"
            info={CHART_INFO}
            insight={{
              chart: "access-pattern",
              title: "Access pattern",
              filters,
              disabled: isLoading || !hasData,
            }}
          />
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:p-6">
        {!hasRequiredIds && (
          <NoData onRetry={refetch}>
            <p>
              Select a student, class or program to view the access details.
            </p>
          </NoData>
        )}
        {hasRequiredIds && isLoading && (
          <ChartLoader text="Loading data..." />
        )}
        {hasRequiredIds && isError && (
          <ChartError message={(error as Error)?.message} onRetry={refetch} />
        )}
        {hasRequiredIds && !isLoading && !isError && hasData && (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
              >
                <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  type="number"
                  dataKey="hour"
                  name="Hour"
                  domain={[0, 24]}
                  ticks={[0, 3, 6, 9, 12, 15, 18, 21, 24]}
                  tickFormatter={(h) => `${Math.floor(h)}h`}
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                />
                <YAxis
                  type="number"
                  dataKey="day"
                  name="Day"
                  domain={[-0.5, 6.5]}
                  ticks={[0, 1, 2, 3, 4, 5, 6]}
                  tickFormatter={(d) => DAYS[d]}
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={<CustomTooltip />}
                />
                <Scatter
                  data={sessions}
                  fill="#8b5cf6"
                  fillOpacity={0.75}
                  shape="circle"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
        {hasRequiredIds && !isLoading && !isError && !hasData && (
          <NoData onRetry={refetch}>
            <p>No session data available for this entity.</p>
          </NoData>
        )}
      </CardContent>
    </Card>
  );
}
