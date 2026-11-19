import { useEffect, useId, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, CircleDot, Download, Target } from "lucide-react";
import { t, useLocale } from "@/i18n";
import { AppButton, EmptyState, PageHeader, Panel } from "@/components/AppUI";
import { apiError } from "@/shared/lib/apiError";
import { cn } from "@/shared/lib/cn";
import { conceptLabel } from "@/features/exercises/lib/logicLabels";
import { conceptsApi, type ConceptProficiency, type ProficiencyData, type ProficiencyScope, type Rate, type ScopeOptions } from "@/features/concepts/api/conceptsApi";
import { download, proficiencyCsv } from "@/features/concepts/lib/proficiencyExport";

const PERIODS = [30, 90, 365, 0];
const selectClass = "h-11 w-full rounded-xl border border-control bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white disabled:opacity-60";
/** Only the first letter in upper case ("Entrada e saída", not "Entrada E Saída"). */
const conceptName = (concept: string) => {
  const label = conceptLabel(concept);
  return label.charAt(0).toLocaleUpperCase(document.documentElement.lang || undefined) + label.slice(1);
};
const percent = (value: number | null) => (value === null ? "—" : new Intl.NumberFormat(document.documentElement.lang || undefined, { style: "percent", maximumFractionDigits: 0 }).format(value));
/** Colour only reinforces the number shown next to it. */
/**
 * Level of a rate. Colours come from the chart palette chosen in the accessibility preferences
 * (red-green, blue-yellow, monochrome…), and every level also has its own icon, so it never
 * depends on colour alone.
 */
type Level = "good" | "attention" | "low" | "none";
const levelOf = (value: number | null): Level => value === null ? "none" : value >= 0.75 ? "good" : value >= 0.5 ? "attention" : "low";
const LEVEL_FILL: Record<Level, string> = { good: "bg-chart-positive", attention: "bg-chart-warning", low: "bg-chart-negative", none: "bg-zinc-600" };
const LEVEL_INK: Record<Level, string> = { good: "text-chart-positive-ink", attention: "text-chart-warning-ink", low: "text-chart-negative-ink", none: "text-zinc-500" };
const LEVEL_ICON = { good: CheckCircle2, attention: CircleDot, low: AlertTriangle } as const;

function LevelIcon({ value, className }: { value: number | null; className?: string }) {
  const level = levelOf(value);
  if (level === "none") return <span aria-hidden="true" className={cn("inline-block h-3.5 w-3.5", className)} />;
  const Icon = LEVEL_ICON[level];
  return <Icon aria-hidden="true" className={cn("h-3.5 w-3.5 shrink-0", LEVEL_INK[level], className)} />;
}

/** Visible key of the three levels, shown above the cards. */
function LevelLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 font-[Poppins] text-xs text-zinc-300">
      {(["good", "attention", "low"] as const).map((level) => (
        <li key={level} className="flex items-center gap-1.5">
          <LevelIcon value={level === "good" ? 1 : level === "attention" ? 0.6 : 0} />
          {t(`concepts.level.${level}`)}
        </li>
      ))}
    </ul>
  );
}

interface Option { value: string; label: string; scope: ProficiencyScope; id: string }

/** Every selection the person may open, grouped by type. Values are "scope:id". */
function scopeOptions(options: ScopeOptions | undefined) {
  if (!options) return [] as Array<{ group: string; items: Option[] }>;
  const groups: Array<{ group: string; items: Option[] }> = [];
  if (options.me) groups.push({ group: t("concepts.scope.mine"), items: [{ value: "me:", label: t("concepts.scope.me"), scope: "me", id: "" }] });
  if (options.classes.length) groups.push({ group: t("concepts.scope.classes"), items: options.classes.map((item) => ({ value: `class:${item.id}`, label: `${item.name} · ${item.courseName}`, scope: "class", id: item.id })) });
  if (options.courses.length) groups.push({ group: t("concepts.scope.courses"), items: options.courses.map((item) => ({ value: `course:${item.id}`, label: item.name, scope: "course", id: item.id })) });
  if (options.institutions.length) groups.push({ group: t("concepts.scope.institutions"), items: options.institutions.map((item) => ({ value: `institution:${item.id}`, label: item.name, scope: "institution", id: item.id })) });
  if (options.all) groups.push({ group: t("concepts.scope.platform"), items: [{ value: "all:", label: t("concepts.scope.all"), scope: "all", id: "" }] });
  return groups;
}

function Bar({ rate, label, marker }: { rate: Rate; label: string; marker?: string }) {
  return (
    <div className="flex items-center gap-2">
      {marker && <span aria-hidden="true" className="w-4 shrink-0 text-xs font-semibold text-zinc-300">{marker}</span>}
      <div aria-hidden="true" className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <div className={cn("h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none", LEVEL_FILL[levelOf(rate.score)])} style={{ width: `${Math.round((rate.score ?? 0) * 100)}%` }} />
      </div>
      <LevelIcon value={rate.score} />
      <span className="w-11 shrink-0 text-right text-sm font-semibold tabular-nums text-white">{percent(rate.score)}</span>
      <span className="sr-only">{label}</span>
    </div>
  );
}

function ConceptCard({ item, other }: { item: ConceptProficiency; other?: ConceptProficiency | null }) {
  const name = conceptName(item.concept);
  const weeksId = useId();
  return (
    <li className="rounded-2xl border border-white/10 bg-surface p-4 font-[Poppins] shadow-lg shadow-black/10">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-white">{name}</h3>
        <p className="text-xs text-zinc-400">{t("concepts.answers", { count: item.total })} · {t("concepts.students", { count: item.students })}</p>
      </div>
      <div className="space-y-1.5">
        <Bar rate={item} marker={other !== undefined ? t("concepts.markerA") : undefined} label={t("concepts.rateLabel", { concept: name, value: percent(item.score) })} />
        {other !== undefined && (
          other ? <Bar rate={other} marker={t("concepts.markerB")} label={t("concepts.rateLabelB", { concept: name, value: percent(other.score) })} />
            : <p className="pl-6 text-xs text-zinc-400">{t("concepts.noDataB")}</p>
        )}
      </div>
      <p className="mt-2 text-xs text-zinc-400">
        {t("concepts.bySource", { practice: percent(item.practice.score), practiceCount: item.practice.total, exam: percent(item.exam.score), examCount: item.exam.total })}
      </p>
      {item.trend.length > 1 && (
        <details className="mt-2 text-xs text-zinc-300">
          <summary className="cursor-pointer rounded-md py-1 font-medium text-blue-300 hover:text-blue-200">{t("concepts.weekly")}</summary>
          <div role="region" aria-labelledby={weeksId} tabIndex={0} className="mt-2 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[16rem] border-collapse text-xs">
              <caption id={weeksId} className="sr-only">{t("concepts.weeklyCaption", { concept: name })}</caption>
              <thead><tr className="bg-surface-raised text-left text-zinc-300">
                <th scope="col" className="px-3 py-1.5">{t("concepts.week")}</th>
                <th scope="col" className="px-3 py-1.5 text-right">{t("concepts.answersColumn")}</th>
                <th scope="col" className="px-3 py-1.5 text-right">{t("concepts.rateColumn")}</th>
              </tr></thead>
              <tbody>
                {item.trend.map((week) => (
                  <tr key={week.week} className="border-t border-white/5">
                    <th scope="row" className="px-3 py-1.5 text-left font-normal">{new Date(`${week.week}T12:00:00Z`).toLocaleDateString(document.documentElement.lang || undefined, { day: "2-digit", month: "2-digit" })}</th>
                    <td className="px-3 py-1.5 text-right tabular-nums">{week.total}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{percent(week.score)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </li>
  );
}

function StudentsTable({ data }: { data: ProficiencyData }) {
  const captionId = useId();
  const concepts = data.concepts.map((item) => item.concept);
  if (!data.students?.length || !concepts.length) return null;
  return (
    <Panel>
      <h2 id={captionId} className="font-[Poppins] text-base font-semibold text-white">{t("concepts.byStudent")}</h2>
      <p className="mt-1 font-[Poppins] text-xs text-zinc-400">{t("concepts.byStudentHint")}</p>
      <div role="region" aria-labelledby={captionId} tabIndex={0} className="mt-3 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[32rem] border-collapse font-[Poppins] text-sm">
          <caption className="sr-only">{t("concepts.byStudent")}</caption>
          <thead><tr className="bg-surface-raised text-left text-zinc-300">
            <th scope="col" className="sticky left-0 bg-surface-raised px-3 py-2">{t("concepts.student")}</th>
            {concepts.map((concept) => <th key={concept} scope="col" className="px-3 py-2 text-right">{conceptName(concept)}</th>)}
          </tr></thead>
          <tbody>
            {data.students.map((student) => (
              <tr key={student.id} className="border-t border-white/5 text-zinc-200">
                <th scope="row" className="sticky left-0 bg-surface px-3 py-2 text-left font-medium text-white">{student.name}</th>
                {concepts.map((concept) => {
                  const rate = student.concepts[concept];
                  return (
                    <td key={concept} className="px-3 py-2 text-right tabular-nums">
                      {rate ? <span className="inline-flex items-center justify-end gap-1.5"><LevelIcon value={rate.score} />{percent(rate.score)} <span className="text-xs text-zinc-500">({rate.total})</span></span> : <span className="text-zinc-500">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function ConceptPanelPage() {
  useLocale();
  const ids = { scope: useId(), period: useId(), compare: useId() };
  const [selected, setSelected] = useState("");
  const [compareWith, setCompareWith] = useState("");
  const [days, setDays] = useState(90);
  const scopes = useQuery({ queryKey: ["conceptScopes"], queryFn: conceptsApi.scopes, staleTime: 5 * 60 * 1000 });
  const groups = useMemo(() => scopeOptions(scopes.data), [scopes.data]);
  const all = useMemo(() => groups.flatMap((group) => group.items), [groups]);
  useEffect(() => { if (!selected && all.length) setSelected(all[0].value); }, [all, selected]);
  const current = all.find((item) => item.value === selected);
  // Comparison only between selections of the same type, never the selection with itself.
  const peers = all.filter((item) => current && item.scope === current.scope && item.value !== current.value);
  useEffect(() => { if (compareWith && !peers.some((item) => item.value === compareWith)) setCompareWith(""); }, [peers, compareWith]);
  const other = all.find((item) => item.value === compareWith);

  const query = (option?: Option) => ({
    queryKey: ["conceptProficiency", option?.scope, option?.id, days],
    queryFn: () => conceptsApi.proficiency({ scope: option!.scope, id: option!.id, days }),
    enabled: !!option,
    placeholderData: keepPreviousData,
  });
  const a = useQuery(query(current));
  const b = useQuery(query(other));
  const data = a.data;

  const exportName = `painel-conceitos-${current?.scope ?? "selecao"}-${days || "tudo"}`;
  return (
    <main className="relative flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <PageHeader icon={<Target aria-hidden="true" className="h-5 w-5" />} title={t("concepts.title")} description={t("concepts.description")} />

        <section aria-label={t("concepts.selection")} className="rounded-2xl border border-white/10 bg-surface p-4 shadow-lg shadow-black/10">
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label htmlFor={ids.scope} className="mb-1 block font-[Poppins] text-xs font-medium text-zinc-300">{t("concepts.selection")}</label>
              <select id={ids.scope} value={selected} className={selectClass} disabled={!all.length} onChange={(event) => setSelected(event.target.value)}>
                {groups.map((group) => (
                  <optgroup key={group.group} label={group.group}>
                    {group.items.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={ids.compare} className="mb-1 block font-[Poppins] text-xs font-medium text-zinc-300">{t("concepts.compareWith")}</label>
              <select id={ids.compare} value={compareWith} className={selectClass} disabled={!peers.length} onChange={(event) => setCompareWith(event.target.value)}>
                <option value="">{peers.length ? t("concepts.noComparison") : t("concepts.noPeers")}</option>
                {peers.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor={ids.period} className="mb-1 block font-[Poppins] text-xs font-medium text-zinc-300">{t("concepts.period")}</label>
              <select id={ids.period} value={days} className={selectClass} onChange={(event) => setDays(Number(event.target.value))}>
                {PERIODS.map((value) => <option key={value} value={value}>{value ? t("chatFeedback.admin.lastDays", { count: value }) : t("concepts.allTime")}</option>)}
              </select>
            </div>
          </div>
        </section>

        {scopes.isError && <p role="alert" className="font-[Poppins] text-sm text-red-300">{apiError(scopes.error)}</p>}
        {scopes.data && !all.length && <EmptyState icon={<Target className="h-5 w-5" />} title={t("concepts.noScopesTitle")} description={t("concepts.noScopesDescription")} />}
        {a.isError && <p role="alert" className="font-[Poppins] text-sm text-red-300">{apiError(a.error)}</p>}

        {!data && !a.isError && !(scopes.data && !all.length) && (
          <div role="status" aria-live="polite" className="space-y-4">
            <span className="sr-only">{t("common.carregandoDados")}</span>
            <div aria-hidden="true" className="h-6 w-2/3 max-w-md animate-pulse rounded-lg bg-white/[0.06] motion-reduce:animate-none" />
            <ul aria-hidden="true" className="grid gap-3 md:grid-cols-2">
              {[0, 1, 2, 3].map((index) => (
                <li key={index} className="h-[148px] animate-pulse rounded-2xl border border-white/10 bg-surface motion-reduce:animate-none" />
              ))}
            </ul>
          </div>
        )}

        {data && (
          <section aria-busy={a.isFetching || b.isFetching || undefined} aria-labelledby={`${ids.scope}-results`} className="page-reveal space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 id={`${ids.scope}-results`} className="font-[Poppins] text-base font-semibold text-white">
                {other ? t("concepts.comparisonTitle", { a: current?.label ?? "", b: other.label }) : t("concepts.resultsTitle", { name: current?.label ?? "" })}
              </h2>
              {data.concepts.length > 0 && (
                <div className="flex gap-2">
                  <AppButton type="button" variant="secondary" onClick={() => download(`${exportName}.csv`, proficiencyCsv(data, conceptName), "text/csv;charset=utf-8")}>
                    <Download aria-hidden="true" className="h-4 w-4" />{t("concepts.exportCsv")}
                  </AppButton>
                  <AppButton type="button" variant="secondary" onClick={() => download(`${exportName}.json`, JSON.stringify(data, null, 2), "application/json")}>
                    <Download aria-hidden="true" className="h-4 w-4" />{t("concepts.exportJson")}
                  </AppButton>
                </div>
              )}
            </div>
            {data.concepts.length === 0 ? (
              <EmptyState icon={<Target className="h-5 w-5" />} title={t("concepts.emptyTitle")} description={t("concepts.emptyDescription")} />
            ) : (
              <>
              <LevelLegend />
              <ul className="grid gap-3 md:grid-cols-2">
                {data.concepts.map((item) => (
                  <ConceptCard key={item.concept} item={item} other={other ? (b.data?.concepts.find((entry) => entry.concept === item.concept) ?? null) : undefined} />
                ))}
              </ul>
              </>
            )}
            {data.hidden > 0 && <p className="font-[Poppins] text-xs text-zinc-400">{t("concepts.hidden", { count: data.hidden, min: data.minGroupSize })}</p>}
            {!other && <StudentsTable data={data} />}
          </section>
        )}
      </div>
    </main>
  );
}
