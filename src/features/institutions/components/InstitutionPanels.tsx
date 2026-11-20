import { useId, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleDot, UserRound } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { CHART_COLORS, useChartPreferences } from "@/features/dashboard/chartPreferences";
import { chartLine, chartText } from "@/features/dashboard/chartColors";
import { t, useLocale } from "@/i18n";
import { cn } from "@/shared/lib/cn";
import type { InstitutionPageData } from "@/features/institutions/api/institutionsApi";
import { conceptName, LEVEL_FILL, LEVEL_INK, levelOf, percent } from "@/features/institutions/lib/institutionLabels";

const LEVEL_ICON = { good: CheckCircle2, attention: CircleDot, low: AlertTriangle } as const;
const box = "rounded-2xl border border-white/10 bg-surface p-4 sm:p-5";

/** Number of a group, or "fewer than 5" so small groups cannot be told apart. */
function Count({ value }: { value: number | null }) {
  return value === null ? <span className="italic text-zinc-400">{t("institutions.fewerThan", { min: 5 })}</span> : <>{value}</>;
}
function Hidden() {
  return <span className="italic text-zinc-400">{t("institutions.hidden")}</span>;
}

export function Meter({ value, label }: { value: number; label: string }) {
  const level = levelOf(value);
  const Icon = LEVEL_ICON[level];
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden="true" className="h-2 w-20 overflow-hidden rounded-full bg-white/10 sm:w-24">
        <span className={cn("block h-full rounded-full", LEVEL_FILL[level])} style={{ width: `${Math.round(value * 100)}%` }} />
      </span>
      <Icon aria-hidden="true" className={cn("h-3.5 w-3.5 shrink-0", LEVEL_INK[level])} />
      <span className="w-11 text-right text-sm font-semibold tabular-nums text-white">{percent(value)}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

/* ── Visão geral ── */
export function OverviewPanel({ data }: { data: InstitutionPageData }) {
  useLocale();
  const ids = { concepts: useId() };
  const overview = data.overview!;
  const figures = [
    { value: overview.students === null ? <Count value={null} /> : String(overview.students), label: t("institutions.figure.students") },
    {
      value: overview.activeShare === null ? <Hidden /> : percent(overview.activeShare), label: t("institutions.figure.active"),
      extra: overview.activeChange !== null && overview.activeChange !== 0 ? (
        <p className={cn("mt-0.5 text-xs font-semibold", overview.activeChange > 0 ? "text-chart-positive-ink" : "text-chart-negative-ink")}>
          {t(overview.activeChange > 0 ? "institutions.figure.more" : "institutions.figure.fewer", { count: Math.abs(overview.activeChange) })}
        </p>
      ) : null,
    },
    { value: overview.quizAccuracy === null ? "—" : percent(overview.quizAccuracy), label: t("institutions.figure.quiz") },
    ...(data.viewer.level === "admin"
      ? [{ value: overview.chatSatisfaction === null ? "—" : percent(overview.chatSatisfaction), label: t("institutions.figure.chat") }] : []),
  ];
  return (
    <div className="space-y-4 font-[Poppins]">
      <h2 className="sr-only">{t("institutions.tab.overview")}</h2>
      <ul aria-label={t("institutions.figures")} className={cn("grid grid-cols-2 overflow-hidden rounded-2xl border border-white/10 bg-surface", figures.length === 4 ? "md:grid-cols-4" : "md:grid-cols-3")}>
        {figures.map((figure, index) => (
          <li key={index} className="border-b border-r border-white/10 px-4 py-3.5">
            <p className="text-2xl font-bold leading-tight text-white">{figure.value}</p>
            <p className="mt-1 text-xs text-zinc-400">{figure.label}</p>
            {figure.extra}
          </li>
        ))}
      </ul>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <WeeklySection weeks={overview.weeks} students={overview.students} title={t("institutions.weeks.title")} hint={t("institutions.weeks.hint")}
          empty={t("institutions.weeks.empty", { min: data.minGroupSize })} />

        <section aria-labelledby={ids.concepts} className={box}>
          <h3 id={ids.concepts} className="text-base font-semibold text-white">{t("institutions.concepts.title")}</h3>
          <p className="text-xs text-zinc-400">{t("institutions.concepts.hint")}</p>
          {overview.concepts.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-400">{t("institutions.concepts.empty")}</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {overview.concepts.map((item) => (
                <li key={item.concept} className="flex items-center justify-between gap-3 text-sm text-zinc-200">
                  <span className="min-w-0">{conceptName(item.concept)}</span>
                  <Meter value={item.score} label={t("institutions.rateLabel", { name: conceptName(item.concept), value: percent(item.score) })} />
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-400">
            {(["good", "attention", "low"] as const).map((level) => {
              const Icon = LEVEL_ICON[level];
              return <span key={level} className="inline-flex items-center gap-1"><Icon aria-hidden="true" className={cn("h-3.5 w-3.5", LEVEL_INK[level])} />{t(`concepts.level.${level}`)}</span>;
            })}
          </p>
        </section>
      </div>
    </div>
  );
}

const weekLabel = (week: string) => new Date(`${week}T12:00:00Z`).toLocaleDateString(document.documentElement.lang || undefined, { day: "2-digit", month: "2-digit" });

/** Card with the weekly chart and the same numbers as a table (switch). */
export function WeeklySection({ weeks, students, title, hint, empty, children }: {
  weeks: Array<{ week: string; active: number }>; students: number | null; title: string; hint: string; empty: string; children?: React.ReactNode;
}) {
  useLocale();
  const id = useId();
  const [asTable, setAsTable] = useState(false);
  return (
    <section aria-labelledby={id} className={cn(box, "font-[Poppins]")}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 id={id} className="text-base font-semibold text-white">{title}</h3>
          <p className="text-xs text-zinc-400">{hint}</p>
          {!asTable && weeks.length > 0 && <p className="mt-0.5 text-xs text-zinc-500">{t("institutions.weeks.chartHint")}</p>}
        </div>
        {weeks.length > 0 && (
          <button type="button" onClick={() => setAsTable((value) => !value)} aria-pressed={asTable}
            className="min-h-9 rounded-lg px-2 text-sm font-semibold text-blue-300 hover:bg-white/5">
            {asTable ? t("institutions.weeks.asChart") : t("institutions.weeks.asTable")}
          </button>
        )}
      </div>
      {children}
      {weeks.length === 0 ? (
        <p className="text-sm text-zinc-400">{empty}</p>
      ) : asTable ? (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">{title}</caption>
            <thead><tr className="bg-surface-raised text-left text-zinc-300"><th scope="col" className="px-3 py-2">{t("institutions.weeks.week")}</th><th scope="col" className="px-3 py-2 text-right">{t("institutions.weeks.students")}</th></tr></thead>
            <tbody>{weeks.map((week) => (
              <tr key={week.week} className="border-t border-white/5"><th scope="row" className="px-3 py-2 text-left font-normal text-zinc-200">{weekLabel(week.week)}</th><td className="px-3 py-2 text-right tabular-nums text-white">{week.active}</td></tr>
            ))}</tbody>
          </table>
        </div>
      ) : (
        <WeeklyChart weeks={weeks} students={students} label={weekLabel} />
      )}
    </section>
  );
}

/**
 * Active students per week: tooltip on hover (tap on touch screens), arrow keys move between weeks
 * with the tooltip, and the same numbers are always available in the table view.
 */
function WeeklyChart({ weeks, students, label }: { weeks: Array<{ week: string; active: number }>; students: number | null; label: (week: string) => string }) {
  const { animate, font, space, tooltipTrigger } = useChartPreferences();
  const data = weeks.map((week, index) => ({ ...week, label: label(week.week), current: index === weeks.length - 1 }));
  const config = { active: { label: t("institutions.weeks.students"), color: CHART_COLORS.info } } satisfies ChartConfig;
  return (
    <div className="relative h-48">
      <ChartContainer config={config} className="absolute inset-0 h-full w-full text-white">
        <BarChart data={data} accessibilityLayer margin={{ top: space(8), right: space(4), bottom: 0, left: space(-12) }}>
          <CartesianGrid vertical={false} stroke={chartLine(0.12)} />
          <XAxis dataKey="label" tick={{ fill: chartText(0.75), fontSize: font(11) }} stroke={chartLine(0.2)} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: chartText(0.7), fontSize: font(11) }} stroke={chartLine(0.2)} width={space(36)} />
          <ChartTooltip trigger={tooltipTrigger} cursor={{ fill: chartLine(0.08) }} content={({ active, payload }) => {
            if (!active || !payload?.[0]) return null;
            const row = payload[0].payload as (typeof data)[number];
            return (
              <div className="rounded-xl border border-white/10 bg-surface-sunken px-3 py-2.5 font-[Poppins] text-sm shadow-xl">
                <p className="mb-1 font-semibold text-white">{t("institutions.weeks.tooltipWeek", { week: row.label })}{row.current ? ` · ${t("institutions.weeks.current")}` : ""}</p>
                <p className="text-zinc-300">{t("institutions.weeks.tooltipActive", { count: row.active })}</p>
                {students !== null && <p className="text-zinc-400">{t("institutions.weeks.tooltipShare", { value: percent(row.active / students) })}</p>}
              </div>
            );
          }} />
          <Bar dataKey="active" radius={[6, 6, 0, 0]} isAnimationActive={animate}>
            {data.map((row) => <Cell key={row.week} fill={CHART_COLORS.info} fillOpacity={row.current ? 1 : 0.7} />)}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}

/* ── Cursos ── */
export function CoursesPanel({ data }: { data: InstitutionPageData }) {
  useLocale();
  const courses = data.courses ?? [];
  return (
    <div className="font-[Poppins]">
      <h2 className="text-base font-semibold text-white">{t("institutions.tab.courses")}</h2>
      <p className="text-xs text-zinc-400">{t("institutions.courses.hintStaff")}</p>
      {courses.length === 0 ? <p className="mt-3 text-sm text-zinc-400">{t("institutions.empty")}</p> : (
        <ul className="mt-3 space-y-2">
          {courses.map((course) => (
            <li key={course.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 rounded-xl border border-white/10 bg-surface-sunken px-4 py-3">
              <h3 className="min-w-0 text-sm font-semibold text-white">{course.name}</h3>
              {course.activeShare != null ? <Meter value={course.activeShare} label={t("institutions.activeLabel", { name: course.name, value: percent(course.activeShare) })} /> : <span />}
              <p className="col-span-2 flex flex-wrap gap-x-3 text-xs text-zinc-400">
                <span>{t("institutions.courses.classes", { count: course.classes })}</span>
                <span>{t("institutions.courses.disciplines", { count: course.disciplines })}</span>
                <span><Count value={course.students} /> {t("institutions.courses.students")}</span>
                {course.activeShare != null && <span>· {t("institutions.courses.barMeaning")}</span>}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Table({ caption, head, children }: { caption: string; head: Array<{ label: string; numeric?: boolean }>; children: React.ReactNode }) {
  const id = useId();
  return (
    <div role="region" aria-labelledby={id} tabIndex={0} className="mt-3 overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full min-w-[32rem] border-collapse font-[Poppins] text-sm">
        <caption id={id} className="sr-only">{caption}</caption>
        <thead><tr className="bg-surface-raised text-left text-zinc-300">{head.map((cell) => <th key={cell.label} scope="col" className={cn("px-3 py-2", cell.numeric && "text-right")}>{cell.label}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

/* ── Turmas ── */
export function ClassesPanel({ data }: { data: InstitutionPageData }) {
  useLocale();
  const rows = data.classes ?? [];
  const withQuiz = rows.some((row) => row.quizAccuracy !== undefined);
  return (
    <div className="font-[Poppins]">
      <h2 className="text-base font-semibold text-white">{t("institutions.tab.classes")}</h2>
      <p className="text-xs text-zinc-400">{t("institutions.classes.hint", { min: data.minGroupSize })}</p>
      {rows.length === 0 ? <p className="mt-3 text-sm text-zinc-400">{t("institutions.empty")}</p> : (
        <Table caption={t("institutions.tab.classes")} head={[
          { label: t("institutions.col.class") }, { label: t("institutions.col.course") }, { label: t("institutions.col.students"), numeric: true },
          { label: t("institutions.col.active"), numeric: true }, ...(withQuiz ? [{ label: t("institutions.col.quiz"), numeric: true }] : []),
        ]}>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-white/5 text-zinc-200">
              <th scope="row" className="px-3 py-2 text-left font-medium text-white">{row.name}</th>
              <td className="px-3 py-2">{row.course}</td>
              <td className="px-3 py-2 text-right tabular-nums"><Count value={row.students} /></td>
              <td className="px-3 py-2 text-right tabular-nums">{row.activeShare === null ? <Hidden /> : percent(row.activeShare)}</td>
              {withQuiz && <td className="px-3 py-2 text-right tabular-nums">{row.quizAccuracy == null ? <Hidden /> : percent(row.quizAccuracy)}</td>}
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

/* ── Disciplinas ── */
export function DisciplinesPanel({ data }: { data: InstitutionPageData }) {
  useLocale();
  const rows = data.disciplines ?? [];
  const withExams = rows.some((row) => row.releasedExams !== undefined);
  return (
    <div className="font-[Poppins]">
      <h2 className="text-base font-semibold text-white">{t("institutions.tab.disciplines")}</h2>
      <p className="text-xs text-zinc-400">{t("institutions.disciplines.hint")}</p>
      {rows.length === 0 ? <p className="mt-3 text-sm text-zinc-400">{t("institutions.empty")}</p> : (
        <Table caption={t("institutions.tab.disciplines")} head={[
          { label: t("institutions.col.discipline") }, { label: t("institutions.col.course") }, { label: t("institutions.col.classes"), numeric: true },
          { label: t("institutions.col.questions"), numeric: true }, ...(withExams ? [{ label: t("institutions.col.exams"), numeric: true }] : []),
        ]}>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-white/5 text-zinc-200">
              <th scope="row" className="px-3 py-2 text-left font-medium text-white">{row.name}</th>
              <td className="px-3 py-2">{row.course}</td>
              <td className="px-3 py-2 text-right tabular-nums">{row.classes}</td>
              <td className="px-3 py-2 text-right tabular-nums">{row.questions}</td>
              {withExams && <td className="px-3 py-2 text-right tabular-nums">{row.releasedExams}</td>}
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

/* ── Pessoas ── */
export function PeoplePanel({ data }: { data: InstitutionPageData }) {
  useLocale();
  const team = data.team!;
  const rows = [
    { label: t("institutions.people.coordinators"), value: team.coordinators as number | null },
    { label: t("institutions.people.professors"), value: team.professors as number | null },
    { label: t("institutions.people.students"), value: team.students },
  ];
  return (
    <div className="font-[Poppins]">
      <h2 className="text-base font-semibold text-white">{t("institutions.tab.people")}</h2>
      <p className="text-xs text-zinc-400">{t("institutions.people.hint")}</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-3">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-3 rounded-xl border border-white/10 bg-surface-sunken p-3">
            <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-zinc-300"><UserRound className="h-5 w-5" /></span>
            <div className="min-w-0">
              <p className="text-xl font-bold leading-tight text-white"><Count value={row.value} /></p>
              <p className="text-xs text-zinc-400">{row.label}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
