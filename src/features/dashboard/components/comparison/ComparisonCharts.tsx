import { useId, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { number, percent, t, useLocale } from "@/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { dashboardApi, type DashboardFilterParams } from "@/features/dashboard/api/dashboardApi";
import { ChartDownloadButton } from "@/features/dashboard/components/ChartDownloadButton";
import { ChartDataTable, MissingValue } from "@/features/dashboard/components/ChartDataTable";
import { ChartError, ChartLoader, NoData } from "@/features/dashboard/components/ChartStates";
import { CHART_COLORS, useChartPreferences } from "@/features/dashboard/chartPreferences";
import { chartLine, chartText } from "@/features/dashboard/chartColors";
import { subjectLabel } from "@/features/dashboard/subjectLabels";
import { asChat, asEngagement, asExams, biggestDifferences, performanceDistribution, radarOverlay, topicDifferences, weeklyOverlay, type Difference } from "@/features/dashboard/comparisonData";
import type { ChatSatisfactionData, ComparisonInsightChart } from "@/features/dashboard/types";
import { cn } from "@/shared/lib/cn";
import { useFeatures } from "@/features/release/hooks/useFeatures";
import type { Feature } from "@/features/release/featureCatalog";
import { apiError } from "@/shared/lib/apiError";

/** Same colours as the A/B labels of the page: blue for A, amber for B. B also uses a dashed stroke. */
const COLOR_A = CHART_COLORS.info;
const COLOR_B = CHART_COLORS.warning;

interface ComparisonProps {
  a: DashboardFilterParams;
  b: DashboardFilterParams;
  labelA: string;
  labelB: string;
}

const pct = (value: number | null, digits = 1) => (value === null ? null : percent(value / 100, { minimumFractionDigits: digits, maximumFractionDigits: digits }));
const signed = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${number(Math.abs(value), { minimumFractionDigits: 1, maximumFractionDigits: 1 })} p.p.`;

/** Data of a turned-off feature is never asked for (the server refuses it as well). */
const PAIR_FEATURE: Record<string, Feature> = { topicPerformance: "quiz", proficiencyRadar: "quiz", effortMatrix: "quiz", exams: "exams", chatSatisfaction: "chat" };

function usePair<T>(name: string, filters: ComparisonProps, load: (filters: DashboardFilterParams) => Promise<{ data: T }>) {
  const { isEnabled } = useFeatures();
  const feature = PAIR_FEATURE[name];
  const enabled = !!filters.a.universityId && !!filters.b.universityId && (!feature || isEnabled(feature));
  const left = useQuery({ queryKey: ["comparison", name, filters.a], queryFn: async () => (await load(filters.a)).data, enabled, staleTime: 5 * 60 * 1000 });
  const right = useQuery({ queryKey: ["comparison", name, filters.b], queryFn: async () => (await load(filters.b)).data, enabled, staleTime: 5 * 60 * 1000 });
  return {
    a: left.data,
    b: right.data,
    loading: left.isLoading || right.isLoading,
    error: left.error || right.error,
    retry: () => { void left.refetch(); void right.refetch(); },
  };
}

function ComparisonCard({ id, title, description, fileName, info, legend, children, chart, pair }: {
  id: string; title: string; description: string; fileName: string; info: string; legend?: ReactNode; children: ReactNode;
  /** With both selections, the card offers the AI analysis of this chart. */
  chart?: ComparisonInsightChart; pair?: ComparisonProps;
}) {
  return (
    <Card id={id} className="dashboard-chart flex h-full flex-col border-white/10 bg-surface">
      <CardHeader className="dashboard-chart-header grid gap-0 space-y-0 border-b border-white/10 p-0">
        <div className="chart-heading min-w-0 px-4 py-5 sm:px-6">
          <CardTitle className="font-[Poppins] text-white">{title}</CardTitle>
          <CardDescription className="mt-1 font-[Poppins] text-white/50">{description}</CardDescription>
          {legend}
        </div>
        <div className="chart-actions flex items-start justify-end px-4 pb-4 sm:px-6">
          <ChartDownloadButton containerId={id} fileName={fileName} info={info}
            comparisonInsight={chart && pair ? { chart, title, a: pair.a, b: pair.b } : undefined} />
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col px-2 sm:p-6">{children}</CardContent>
    </Card>
  );
}

/** Text legend: colour plus the letter and line style, so it never depends on colour alone. */
function SideLegend({ labelA, labelB, dashedB = false }: { labelA: string; labelB: string; dashedB?: boolean }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-[Poppins] text-xs text-zinc-300">
      <li className="flex items-center gap-2"><span aria-hidden="true" className="inline-block h-0.5 w-5 rounded" style={{ background: COLOR_A }} />{labelA}</li>
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="inline-block w-5 border-t-2" style={{ borderColor: COLOR_B, borderStyle: dashedB ? "dashed" : "solid" }} />
        {labelB}
      </li>
    </ul>
  );
}

function States({ loading, error, retry, empty, emptyText, children }: { loading: boolean; error: unknown; retry: () => void; empty: boolean; emptyText: string; children: ReactNode }) {
  if (loading) return <ChartLoader text={t("common.carregandoDados")} />;
  if (error) return <ChartError message={apiError(error, "common.erroAoCarregarDados")} onRetry={retry} />;
  if (empty) return <NoData onRetry={retry}><p>{emptyText}</p></NoData>;
  return <>{children}</>;
}

/* ── 1. Difference by subject ─────────────────────────────────────────────── */

export function TopicDifferenceChart(props: ComparisonProps) {
  useLocale();
  const id = `compare-topic-difference-${useId().replace(/:/g, "")}`;
  const { animate, font, space, tooltipTrigger } = useChartPreferences();
  const pair = usePair("topicPerformance", props, dashboardApi.getTopicPerformance);
  const rows = pair.a && pair.b ? topicDifferences(pair.a, pair.b) : [];
  const compared = rows.filter((row) => row.diff !== null).map((row) => ({ ...row, label: subjectLabel(row.topic), aBetter: (row.diff ?? 0) >= 0 }));
  const limit = Math.max(10, ...compared.map((row) => Math.abs(row.diff!)));
  const domain = [-Math.ceil(limit / 10) * 10, Math.ceil(limit / 10) * 10];
  const config = { diff: { label: t("dashboard.compare.difference"), color: COLOR_A } } satisfies ChartConfig;

  return (
    <ComparisonCard id={id} title={t("dashboard.compare.topicTitle")} description={t("dashboard.compare.topicDescription", { a: props.labelA, b: props.labelB })}
      fileName={t("dashboard.compare.topicFile")} info={t("dashboard.compare.topicInfo")} chart="topic-difference" pair={props}
      legend={<p className="mt-3 font-[Poppins] text-xs text-zinc-300">{t("dashboard.compare.topicLegend", { a: props.labelA, b: props.labelB })}</p>}>
      <States loading={pair.loading} error={pair.error} retry={pair.retry} empty={!compared.length} emptyText={t("dashboard.compare.noCommonTopics")}>
        <div className="relative min-h-[240px] flex-1" style={{ height: Math.max(240, compared.length * space(36) + space(60)) }}>
          <ChartContainer config={config} className="absolute inset-0 h-full w-full text-white">
            <BarChart data={compared} layout="vertical" margin={{ top: space(8), right: space(48), bottom: space(8), left: space(8) }}>
              <CartesianGrid horizontal={false} stroke={chartLine(0.12)} />
              <XAxis type="number" domain={domain} tickFormatter={(value: number) => `${value > 0 ? "+" : ""}${number(value)}`} tick={{ fill: chartText(0.7), fontSize: font(11) }} stroke={chartLine(0.2)} />
              <YAxis type="category" dataKey="label" width={space(140)} tick={{ fill: chartText(0.85), fontSize: font(11) }} stroke={chartLine(0.2)} />
              <ReferenceLine x={0} stroke={chartLine(0.5)} />
              <ChartTooltip trigger={tooltipTrigger} cursor={{ fill: chartLine(0.06) }} content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const row = payload[0].payload as (typeof compared)[number];
                return (
                  <div className="rounded-xl border border-white/10 bg-surface-sunken px-3 py-2.5 font-[Poppins] text-sm shadow-xl">
                    <p className="mb-1 font-semibold text-white">{row.label}</p>
                    <p className="text-zinc-300">{props.labelA}: <span className="font-medium text-white">{pct(row.a)}</span></p>
                    <p className="text-zinc-300">{props.labelB}: <span className="font-medium text-white">{pct(row.b)}</span></p>
                    <p className="mt-1 text-zinc-300">{t("dashboard.compare.difference")}: <span className="font-medium text-white">{signed(row.diff!)}</span></p>
                  </div>
                );
              }} />
              <Bar dataKey="diff" isAnimationActive={animate} radius={4}
                shape={(shape: { x: number; y: number; width: number; height: number; payload: { aBetter: boolean } }) => (
                  <rect x={shape.width < 0 ? shape.x + shape.width : shape.x} y={shape.y} width={Math.abs(shape.width)} height={shape.height} rx={4}
                    fill={shape.payload.aBetter ? COLOR_A : COLOR_B} />
                )}
                label={{ position: "right", formatter: (value: number) => signed(value), fill: chartText(0.85), fontSize: font(11) }} />
            </BarChart>
          </ChartContainer>
        </div>
      </States>
      {rows.length > 0 && (
        <ChartDataTable title={t("dashboard.compare.topicTitle")} rows={rows} rowKey={(row) => row.topic}
          columns={[
            { header: t("dashboard.compare.subject"), cell: (row) => subjectLabel(row.topic) },
            { header: props.labelA, numeric: true, cell: (row) => pct(row.a) ?? <MissingValue /> },
            { header: props.labelB, numeric: true, cell: (row) => pct(row.b) ?? <MissingValue /> },
            { header: t("dashboard.compare.difference"), numeric: true, cell: (row) => (row.diff === null ? <MissingValue label={t("dashboard.compare.onlyOneSide")} /> : signed(row.diff)) },
          ]} />
      )}
    </ComparisonCard>
  );
}

/* ── 2. Overlaid radar ────────────────────────────────────────────────────── */

export function RadarOverlayChart(props: ComparisonProps) {
  useLocale();
  const id = `compare-radar-${useId().replace(/:/g, "")}`;
  const { animate, font, space, tooltipTrigger } = useChartPreferences();
  const pair = usePair("proficiencyRadar", props, dashboardApi.getProficiencyRadar);
  const rows = pair.a && pair.b ? radarOverlay(pair.a, pair.b).map((row) => ({ ...row, label: subjectLabel(row.subject), aValue: row.a ?? 0, bValue: row.b ?? 0 })) : [];
  const empty = !rows.some((row) => row.a !== null || row.b !== null);
  const config = { aValue: { label: props.labelA, color: COLOR_A }, bValue: { label: props.labelB, color: COLOR_B } } satisfies ChartConfig;

  return (
    <ComparisonCard id={id} title={t("dashboard.compare.radarTitle")} description={t("dashboard.compare.radarDescription")}
      fileName={t("dashboard.compare.radarFile")} info={t("dashboard.compare.radarInfo")} chart="radar-overlay" pair={props}
      legend={<SideLegend labelA={props.labelA} labelB={props.labelB} dashedB />}>
      <States loading={pair.loading} error={pair.error} retry={pair.retry} empty={empty} emptyText={t("dashboard.compare.noAnswers")}>
        <div className="relative min-h-[300px] flex-1">
          <ChartContainer config={config} className="absolute inset-0 h-full w-full text-white">
            <RadarChart data={rows} margin={{ top: space(20), right: space(40), bottom: space(20), left: space(40) }}>
              <PolarGrid stroke={chartLine(0.15)} />
              <PolarAngleAxis dataKey="label" tick={{ fill: chartText(0.85), fontSize: font(11) }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <ChartTooltip trigger={tooltipTrigger} cursor={false} content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const row = payload[0].payload as (typeof rows)[number];
                return (
                  <div className="rounded-xl border border-white/10 bg-surface-sunken px-3 py-2.5 font-[Poppins] text-sm shadow-xl">
                    <p className="mb-1 font-semibold text-white">{row.label}</p>
                    <p className="text-zinc-300">{props.labelA}: <span className="font-medium text-white">{pct(row.a) ?? t("dashboard.noQuizAnswers")}</span></p>
                    <p className="text-zinc-300">{props.labelB}: <span className="font-medium text-white">{pct(row.b) ?? t("dashboard.noQuizAnswers")}</span></p>
                  </div>
                );
              }} />
              <Radar dataKey="aValue" name={props.labelA} stroke={COLOR_A} fill={COLOR_A} fillOpacity={0.18} strokeWidth={2} isAnimationActive={animate} />
              <Radar dataKey="bValue" name={props.labelB} stroke={COLOR_B} fill={COLOR_B} fillOpacity={0.12} strokeWidth={2} strokeDasharray="6 4" isAnimationActive={animate} />
            </RadarChart>
          </ChartContainer>
        </div>
      </States>
      {rows.length > 0 && (
        <ChartDataTable title={t("dashboard.compare.radarTitle")} rows={rows} rowKey={(row) => row.subject}
          columns={[
            { header: t("dashboard.compare.subject"), cell: (row) => row.label },
            { header: props.labelA, numeric: true, cell: (row) => pct(row.a) ?? <MissingValue label={t("dashboard.noQuizAnswers")} /> },
            { header: props.labelB, numeric: true, cell: (row) => pct(row.b) ?? <MissingValue label={t("dashboard.noQuizAnswers")} /> },
          ]} />
      )}
    </ComparisonCard>
  );
}

/* ── 3. Distribution of performance per student ───────────────────────────── */

export function PerformanceDistributionChart(props: ComparisonProps) {
  useLocale();
  const id = `compare-distribution-${useId().replace(/:/g, "")}`;
  const { animate, font, space, tooltipTrigger } = useChartPreferences();
  const pair = usePair("effortMatrix", props, dashboardApi.getEffortMatrix);
  const result = pair.a && pair.b ? performanceDistribution(pair.a, pair.b) : null;
  const rows = (result?.rows ?? []).map((row) => ({ ...row, label: `${row.from}–${row.to}%`, aPercent: (row.aShare ?? 0) * 100, bPercent: (row.bShare ?? 0) * 100 }));
  const empty = !result || (result.aTotal === 0 && result.bTotal === 0);
  const config = { aPercent: { label: props.labelA, color: COLOR_A }, bPercent: { label: props.labelB, color: COLOR_B } } satisfies ChartConfig;
  const share = (value: number | null) => (value === null ? null : percent(value, { maximumFractionDigits: 0 }));

  return (
    <ComparisonCard id={id} title={t("dashboard.compare.distributionTitle")} description={t("dashboard.compare.distributionDescription")}
      fileName={t("dashboard.compare.distributionFile")} info={t("dashboard.compare.distributionInfo")} chart="performance-distribution" pair={props}
      legend={<SideLegend labelA={props.labelA} labelB={props.labelB} />}>
      <States loading={pair.loading} error={pair.error} retry={pair.retry} empty={empty} emptyText={t("dashboard.compare.noAnswers")}>
        <div className="relative min-h-[260px] flex-1">
          <ChartContainer config={config} className="absolute inset-0 h-full w-full text-white">
            <BarChart data={rows} margin={{ top: space(20), right: space(12), bottom: space(8), left: space(0) }} barGap={space(4)}>
              <CartesianGrid vertical={false} stroke={chartLine(0.12)} />
              <XAxis dataKey="label" tick={{ fill: chartText(0.75), fontSize: font(11) }} stroke={chartLine(0.2)} />
              <YAxis tickFormatter={(value: number) => percent(value / 100, { maximumFractionDigits: 0 })} tick={{ fill: chartText(0.7), fontSize: font(11) }} stroke={chartLine(0.2)} width={space(44)} />
              <ChartTooltip trigger={tooltipTrigger} cursor={{ fill: chartLine(0.06) }} content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const row = payload[0].payload as (typeof rows)[number];
                return (
                  <div className="rounded-xl border border-white/10 bg-surface-sunken px-3 py-2.5 font-[Poppins] text-sm shadow-xl">
                    <p className="mb-1 font-semibold text-white">{t("dashboard.compare.band", { band: row.label })}</p>
                    <p className="text-zinc-300">{props.labelA}: <span className="font-medium text-white">{t("dashboard.compare.studentsShare", { count: row.aCount, share: share(row.aShare) ?? "—" })}</span></p>
                    <p className="text-zinc-300">{props.labelB}: <span className="font-medium text-white">{t("dashboard.compare.studentsShare", { count: row.bCount, share: share(row.bShare) ?? "—" })}</span></p>
                  </div>
                );
              }} />
              <Legend content={() => null} />
              <Bar dataKey="aPercent" name={props.labelA} fill={COLOR_A} radius={[4, 4, 0, 0]} isAnimationActive={animate} />
              <Bar dataKey="bPercent" name={props.labelB} fill={COLOR_B} stroke={chartLine(0.9)} strokeDasharray="4 3" radius={[4, 4, 0, 0]} isAnimationActive={animate} />
            </BarChart>
          </ChartContainer>
        </div>
        {result && (
          <dl className="mt-3 grid grid-cols-2 gap-3 px-2 font-[Poppins] text-xs text-zinc-400 sm:px-0">
            <div><dt>{t("dashboard.compare.medianOf", { side: props.labelA })}</dt><dd className="text-sm font-semibold text-white">{pct(result.aMedian, 0) ?? "—"} · {t("dashboard.compare.assessed", { count: result.aTotal })}</dd></div>
            <div><dt>{t("dashboard.compare.medianOf", { side: props.labelB })}</dt><dd className="text-sm font-semibold text-white">{pct(result.bMedian, 0) ?? "—"} · {t("dashboard.compare.assessed", { count: result.bTotal })}</dd></div>
          </dl>
        )}
      </States>
      {result && !empty && (
        <ChartDataTable title={t("dashboard.compare.distributionTitle")} rows={rows} rowKey={(row) => row.band}
          columns={[
            { header: t("dashboard.compare.bandHeader"), cell: (row) => row.label },
            { header: props.labelA, numeric: true, cell: (row) => t("dashboard.compare.studentsShare", { count: row.aCount, share: share(row.aShare) ?? "—" }) },
            { header: props.labelB, numeric: true, cell: (row) => t("dashboard.compare.studentsShare", { count: row.bCount, share: share(row.bShare) ?? "—" }) },
          ]} />
      )}
    </ComparisonCard>
  );
}

const loadExams = async (filters: DashboardFilterParams) => ({ data: asExams((await dashboardApi.getExamComparison(filters)).data) });
const loadEngagement = async (filters: DashboardFilterParams) => ({ data: asEngagement((await dashboardApi.getEngagement(filters)).data) });
const loadChat = async (filters: DashboardFilterParams) => ({ data: asChat((await dashboardApi.getChatSatisfaction(filters)).data) });

/* ── Shared: one metric with a bar for A and one for B ────────────────────── */

function MetricBars({ label, a, b, labelA, labelB, format, max }: { label: string; a: number | null; b: number | null; labelA: string; labelB: string; format: (value: number) => string; max: number }) {
  const bar = (value: number | null, color: string, dashed: boolean, side: string) => (
    <div className="flex items-center gap-2">
      <span className="w-24 shrink-0 truncate text-xs text-zinc-300" title={side}>{side}</span>
      <div aria-hidden="true" className="h-3 flex-1 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${value === null ? 0 : Math.min(100, (value / max) * 100)}%`, background: color, backgroundImage: dashed ? "repeating-linear-gradient(90deg, transparent 0 6px, rgba(0,0,0,.35) 6px 9px)" : undefined }} />
      </div>
      <span className="w-14 shrink-0 text-right text-sm font-semibold tabular-nums text-white">{value === null ? "—" : format(value)}</span>
    </div>
  );
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-zinc-400">{label}</p>
      {bar(a, COLOR_A, false, labelA)}
      {bar(b, COLOR_B, true, labelB)}
    </div>
  );
}

/* ── 4. Exams: average grade and submission rate ──────────────────────────── */

export function ExamResultsChart(props: ComparisonProps) {
  useLocale();
  const id = `compare-exams-${useId().replace(/:/g, "")}`;
  const pair = usePair("exams", props, loadExams);
  const empty = !pair.a?.exams.length && !pair.b?.exams.length;
  const grade = (value: number) => number(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const rate = (value: number) => percent(value / 100, { maximumFractionDigits: 0 });
  const rows = [
    ...(pair.a?.exams ?? []).map((exam) => ({ ...exam, side: props.labelA, key: `a-${exam.title}-${exam.releasedAt}` })),
    ...(pair.b?.exams ?? []).map((exam) => ({ ...exam, side: props.labelB, key: `b-${exam.title}-${exam.releasedAt}` })),
  ];
  return (
    <ComparisonCard id={id} title={t("dashboard.compare.examsTitle")} description={t("dashboard.compare.examsDescription")}
      fileName={t("dashboard.compare.examsFile")} info={t("dashboard.compare.examsInfo")} chart="exam-results" pair={props}
      legend={<SideLegend labelA={props.labelA} labelB={props.labelB} dashedB />}>
      <States loading={pair.loading} error={pair.error} retry={pair.retry} empty={empty} emptyText={t("dashboard.compare.noExams")}>
        <div className="space-y-5 px-2 py-2 font-[Poppins] sm:px-0">
          <MetricBars label={t("dashboard.compare.averageGrade")} a={pair.a?.averageGrade ?? null} b={pair.b?.averageGrade ?? null} labelA={props.labelA} labelB={props.labelB} format={grade} max={10} />
          <MetricBars label={t("dashboard.compare.submissionRate")} a={pair.a?.submissionRate == null ? null : pair.a.submissionRate * 100} b={pair.b?.submissionRate == null ? null : pair.b.submissionRate * 100} labelA={props.labelA} labelB={props.labelB} format={rate} max={100} />
          <p className="text-xs text-zinc-400">{t("dashboard.compare.examsCount", { a: pair.a?.exams.length ?? 0, b: pair.b?.exams.length ?? 0, labelA: props.labelA, labelB: props.labelB })}</p>
        </div>
      </States>
      {rows.length > 0 && (
        <ChartDataTable title={t("dashboard.compare.examsTitle")} rows={rows} rowKey={(row) => row.key}
          columns={[
            { header: t("dashboard.compare.selection"), cell: (row) => row.side },
            { header: t("dashboard.compare.exam"), cell: (row) => row.title },
            { header: t("dashboard.compare.averageGrade"), numeric: true, cell: (row) => (row.averageGrade === null ? <MissingValue /> : grade(row.averageGrade)) },
            { header: t("dashboard.compare.submitted"), numeric: true, cell: (row) => t("dashboard.compare.submittedOf", { submitted: row.submitted, expected: row.expected }) },
          ]} />
      )}
    </ComparisonCard>
  );
}

/* ── 5. Weekly engagement ─────────────────────────────────────────────────── */

export function WeeklyEngagementChart(props: ComparisonProps) {
  useLocale();
  const id = `compare-engagement-${useId().replace(/:/g, "")}`;
  const { animate, font, space, tooltipTrigger } = useChartPreferences();
  const pair = usePair("engagement", props, loadEngagement);
  const rows = pair.a && pair.b ? weeklyOverlay(pair.a, pair.b) : [];
  const weekLabel = (week: string) => new Date(`${week}T12:00:00Z`).toLocaleDateString(document.documentElement.lang || undefined, { day: "2-digit", month: "2-digit" });
  const data = rows.map((row) => ({ ...row, label: weekLabel(row.week) }));
  const config = { a: { label: props.labelA, color: COLOR_A }, b: { label: props.labelB, color: COLOR_B } } satisfies ChartConfig;
  const share = (value: number | null) => (value === null ? "—" : percent(value / 100, { maximumFractionDigits: 0 }));
  return (
    <ComparisonCard id={id} title={t("dashboard.compare.engagementTitle")} description={t("dashboard.compare.engagementDescription")}
      fileName={t("dashboard.compare.engagementFile")} info={t("dashboard.compare.engagementInfo")} chart="weekly-engagement" pair={props}
      legend={<SideLegend labelA={props.labelA} labelB={props.labelB} dashedB />}>
      <States loading={pair.loading} error={pair.error} retry={pair.retry} empty={!rows.length} emptyText={t("dashboard.compare.noEngagement")}>
        <div className="relative min-h-[240px] flex-1">
          <ChartContainer config={config} className="absolute inset-0 h-full w-full text-white">
            <LineChart data={data} margin={{ top: space(16), right: space(16), bottom: space(8), left: space(0) }}>
              <CartesianGrid vertical={false} stroke={chartLine(0.12)} />
              <XAxis dataKey="label" tick={{ fill: chartText(0.75), fontSize: font(11) }} stroke={chartLine(0.2)} />
              <YAxis domain={[0, 100]} tickFormatter={(value: number) => percent(value / 100, { maximumFractionDigits: 0 })} tick={{ fill: chartText(0.7), fontSize: font(11) }} stroke={chartLine(0.2)} width={space(44)} />
              <ChartTooltip trigger={tooltipTrigger} cursor={{ stroke: chartLine(0.3) }} content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const row = payload[0].payload as (typeof data)[number];
                return (
                  <div className="rounded-xl border border-white/10 bg-surface-sunken px-3 py-2.5 font-[Poppins] text-sm shadow-xl">
                    <p className="mb-1 font-semibold text-white">{t("dashboard.compare.weekOf", { week: row.label })}</p>
                    <p className="text-zinc-300">{props.labelA}: <span className="font-medium text-white">{share(row.a)} · {t("dashboard.compare.activeStudents", { count: row.aActive ?? 0 })}</span></p>
                    <p className="text-zinc-300">{props.labelB}: <span className="font-medium text-white">{share(row.b)} · {t("dashboard.compare.activeStudents", { count: row.bActive ?? 0 })}</span></p>
                  </div>
                );
              }} />
              <Line dataKey="a" name={props.labelA} stroke={COLOR_A} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={animate} />
              <Line dataKey="b" name={props.labelB} stroke={COLOR_B} strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3 }} isAnimationActive={animate} />
            </LineChart>
          </ChartContainer>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-3 px-2 font-[Poppins] text-xs text-zinc-400 sm:px-0">
          <div><dt>{t("dashboard.compare.averageActive", { side: props.labelA })}</dt><dd className="text-sm font-semibold text-white">{share(pair.a?.averageActiveShare == null ? null : pair.a.averageActiveShare * 100)} · {t("dashboard.compare.studentsInGroup", { count: pair.a?.students ?? 0 })}</dd></div>
          <div><dt>{t("dashboard.compare.averageActive", { side: props.labelB })}</dt><dd className="text-sm font-semibold text-white">{share(pair.b?.averageActiveShare == null ? null : pair.b.averageActiveShare * 100)} · {t("dashboard.compare.studentsInGroup", { count: pair.b?.students ?? 0 })}</dd></div>
        </dl>
      </States>
      {rows.length > 0 && (
        <ChartDataTable title={t("dashboard.compare.engagementTitle")} rows={data} rowKey={(row) => row.week}
          columns={[
            { header: t("dashboard.compare.week"), cell: (row) => row.label },
            { header: props.labelA, numeric: true, cell: (row) => `${share(row.a)} (${row.aActive ?? 0})` },
            { header: props.labelB, numeric: true, cell: (row) => `${share(row.b)} (${row.bActive ?? 0})` },
          ]} />
      )}
    </ComparisonCard>
  );
}

/* ── 6. Satisfaction with the chat ────────────────────────────────────────── */

const RATING_COLORS = { up: CHART_COLORS.positive, partial: CHART_COLORS.warning, down: CHART_COLORS.negative };

function SatisfactionRow({ label, data }: { label: string; data: ChatSatisfactionData | undefined }) {
  if (!data) return null;
  if (data.available === false) {
    const hidden = "minGroupSize" in data ? t("dashboard.compare.chatSmall", { min: data.minGroupSize }) : t("dashboard.compare.chatStudent");
    return (
      <div className="space-y-1">
        <p className="text-xs font-medium text-zinc-300">{label}</p>
        <p className="text-xs text-zinc-400">{hidden}</p>
      </div>
    );
  }
  const parts = (["up", "partial", "down"] as const).map((rating) => ({ rating, count: data[rating], share: data.total ? data[rating] / data.total : 0 }));
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-medium text-zinc-300">{label}</p>
        <p className="text-sm font-semibold text-white">{t("dashboard.compare.chatScore", { value: data.score === null ? "—" : percent(data.score, { maximumFractionDigits: 0 }) })}</p>
      </div>
      <div aria-hidden="true" className="flex h-3 overflow-hidden rounded-full bg-white/10">
        {parts.map((part) => <div key={part.rating} style={{ width: `${part.share * 100}%`, background: RATING_COLORS[part.rating] }} />)}
      </div>
      <p className="text-xs text-zinc-400">
        {parts.map((part) => t(`dashboard.compare.rating.${part.rating}`, { count: part.count, share: percent(part.share, { maximumFractionDigits: 0 }) })).join(" · ")}
      </p>
    </div>
  );
}

export function ChatSatisfactionChart(props: ComparisonProps) {
  useLocale();
  const id = `compare-chat-${useId().replace(/:/g, "")}`;
  const pair = usePair("chatSatisfaction", props, loadChat);
  const ignored = (pair.a?.available && pair.a.disciplineIgnored) || (pair.b?.available && pair.b.disciplineIgnored);
  return (
    <ComparisonCard id={id} title={t("dashboard.compare.chatTitle")} description={t("dashboard.compare.chatDescription")}
      fileName={t("dashboard.compare.chatFile")} info={t("dashboard.compare.chatInfo")} chart="chat-satisfaction" pair={props}
      legend={(
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-[Poppins] text-xs text-zinc-300">
          {(["up", "partial", "down"] as const).map((rating) => (
            <li key={rating} className="flex items-center gap-2"><span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: RATING_COLORS[rating] }} />{t(`dashboard.compare.ratingName.${rating}`)}</li>
          ))}
        </ul>
      )}>
      <States loading={pair.loading} error={pair.error} retry={pair.retry} empty={false} emptyText="">
        <div className="space-y-5 px-2 py-2 font-[Poppins] sm:px-0">
          <SatisfactionRow label={props.labelA} data={pair.a} />
          <SatisfactionRow label={props.labelB} data={pair.b} />
          {ignored && <p className="text-xs text-zinc-400">{t("dashboard.compare.chatDiscipline")}</p>}
        </div>
      </States>
    </ComparisonCard>
  );
}

/* ── Cards: the largest differences between A and B ──────────────────────── */

function differenceLabel(item: Difference) {
  if (item.kind === "topic") return subjectLabel(item.key);
  return t(`dashboard.compare.highlight.${item.kind}`);
}
function differenceValue(item: Difference, value: number) {
  return item.kind === "examGrade" ? number(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : percent(value / 100, { maximumFractionDigits: 0 });
}

export function BiggestDifferences(props: ComparisonProps) {
  useLocale();
  const titleId = useId();
  const topics = usePair("topicPerformance", props, dashboardApi.getTopicPerformance);
  const exams = usePair("exams", props, loadExams);
  const engagement = usePair("engagement", props, loadEngagement);
  const chat = usePair("chatSatisfaction", props, loadChat);
  const loading = topics.loading || exams.loading || engagement.loading || chat.loading;
  const items = biggestDifferences({
    topics: Array.isArray(topics.a) && Array.isArray(topics.b) ? topicDifferences(topics.a, topics.b) : [],
    exams: [exams.a, exams.b],
    engagement: [engagement.a, engagement.b],
    chat: [chat.a, chat.b],
  });
  return (
    <div className="rounded-2xl border border-white/10 bg-surface p-4 font-[Poppins] sm:p-6">
      <h3 id={titleId} className="text-base font-semibold text-white">{t("dashboard.compare.highlightsTitle")}</h3>
      <p className="mt-1 text-xs text-zinc-400">{t("dashboard.compare.highlightsDescription")}</p>
      {loading ? (
        <p className="mt-3 text-sm text-zinc-400">{t("common.carregandoDados")}</p>
      ) : !items.length ? (
        <p className="mt-3 text-sm text-zinc-400">{t("dashboard.compare.noHighlights")}</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => {
            const aAhead = item.points > 0;
            const Icon = aAhead ? ArrowUpRight : ArrowDownRight;
            return (
              <li key={`${item.kind}-${item.key}`} className={cn("rounded-xl border bg-surface-sunken p-3", aAhead ? "border-sky-300/30" : "border-amber-300/30")}>
                <p className="text-sm font-semibold text-white">{differenceLabel(item)}</p>
                <p className={cn("mt-1 flex items-center gap-1 text-xs font-semibold", aAhead ? "text-sky-200" : "text-amber-200")}>
                  <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                  {t("dashboard.compare.ahead", { side: aAhead ? props.labelA : props.labelB, value: item.kind === "examGrade"
                    ? t("dashboard.compare.gradePoints", { value: number(Math.abs(item.a - item.b), { minimumFractionDigits: 1, maximumFractionDigits: 1 }) })
                    : signed(Math.abs(item.points)).replace(/^\+/, "") })}
                </p>
                <p className="mt-2 text-xs text-zinc-400">{props.labelA}: <span className="font-medium text-zinc-200">{differenceValue(item, item.a)}</span> · {props.labelB}: <span className="font-medium text-zinc-200">{differenceValue(item, item.b)}</span></p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
