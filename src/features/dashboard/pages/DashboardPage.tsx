import { t, useLocale, type MessageKey } from "@/i18n";
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart2, Columns, ListChecks, MousePointer2, PanelRightClose, PanelRightOpen, Sparkles, X } from "lucide-react";
import { dashboardFiltersFromLegacy } from "../insightFilters";
import { DashboardFilter } from "@/features/dashboard/components/DashboardFilter";
import type { DashboardFilterState } from "@/features/dashboard/filterTypes";
import { LogEntityType, LogModeType } from "@/services/api/api_routes";
import { DashboardFilterParams } from "@/features/dashboard/api/dashboardApi";
import { UsageChart } from "@/features/dashboard/components/charts/UsageChart";
import { CorrectWrongChart } from "@/features/dashboard/components/charts/CorrectWrongChart";
import { CategoryChart } from "@/features/dashboard/components/charts/CategoryChart";
import { EffortMatrixChart } from "@/features/dashboard/components/charts/EffortMatrixChart";
import { ProficiencyRadarChart } from "@/features/dashboard/components/charts/ProficiencyRadarChart";
import { LearningJourneyChart } from "@/features/dashboard/components/charts/LearningJourneyChart";
import { AccessPatternChart } from "@/features/dashboard/components/charts/AccessPatternChart";
import { GeneralScoreChart } from "@/features/dashboard/components/charts/GeneralScoreChart";
import { DashboardInsightProvider, useDashboardInsights } from "@/features/dashboard/components/DashboardInsightProvider";
import { ChartIdContext } from "@/features/dashboard/chartIdContext";
import { BiggestDifferences, ChatSatisfactionChart, ExamResultsChart, PerformanceDistributionChart, RadarOverlayChart, TopicDifferenceChart, WeeklyEngagementChart } from "@/features/dashboard/components/comparison/ComparisonCharts";
import { AcademicFilter } from "@/features/academic/components/AcademicFilter";
import { academicFiltersApi } from "@/features/academic/api/academicFiltersApi";
import type { University } from "@/features/academic/types";
import { useFeatures } from "@/features/release/hooks/useFeatures";
import { useDialogFocus } from "@/shared/hooks/useDialogFocus";
import { cn } from "@/shared/lib/cn";
import type { Feature } from "@/features/release/featureCatalog";
import { RAIL_TOGGLE_CLASS, RAIL_TOGGLE_ICON_CLASS } from "@/shared/components/layout/railToggle";
import { periodRange, type PeriodPreset } from "@/features/dashboard/timeBuckets";

type LegacyFilter = DashboardFilterState & { hierarchyParams: Omit<DashboardFilterParams, "startDate" | "endDate">; period?: Pick<DashboardFilterParams, "startDate" | "endDate"> };
interface Selection { legacy: LegacyFilter; filters: DashboardFilterParams; selected: boolean }
type ChartKey = "compareHighlights" | "compareTopics" | "compareRadar" | "compareDistribution" | "compareExams" | "compareChat" | "compareEngagement" | "usage" | "access" | "correctWrong" | "generalScore" | "category" | "proficiency" | "effort" | "journey";
type Side = "a" | "b";

const EMPTY: Selection = { legacy: { type: "student", ids: [], mode: "individual", hierarchyParams: {} }, filters: {}, selected: false };
/** `comparisonOnly`: one chart with both selections, shown first while comparing. */
/** `feature`: the chart only exists while that feature is turned on (its data is never shown otherwise). */
const CHARTS: Array<{ key: ChartKey; title: MessageKey; wide: boolean; comparisonOnly?: boolean; feature?: Feature }> = [
  { key: "compareHighlights", title: "dashboard.compare.highlightsTitle", wide: true, comparisonOnly: true },
  { key: "compareTopics", title: "dashboard.compare.topicTitle", wide: true, comparisonOnly: true, feature: "quiz" },
  { key: "compareRadar", title: "dashboard.compare.radarTitle", wide: false, comparisonOnly: true, feature: "quiz" },
  { key: "compareDistribution", title: "dashboard.compare.distributionTitle", wide: false, comparisonOnly: true, feature: "quiz" },
  { key: "compareExams", title: "dashboard.compare.examsTitle", wide: false, comparisonOnly: true, feature: "exams" },
  { key: "compareChat", title: "dashboard.compare.chatTitle", wide: false, comparisonOnly: true, feature: "chat" },
  { key: "compareEngagement", title: "dashboard.compare.engagementTitle", wide: true, comparisonOnly: true },
  { key: "usage", title: "dashboard.tempoDeUsoDiario", wide: true },
  { key: "access", title: "dashboard.detalhesDeAcessoPorSessao", wide: true },
  { key: "correctWrong", title: "dashboard.desempenhoPorTopicoGeral", wide: false, feature: "quiz" },
  { key: "generalScore", title: "dashboard.avaliacaoGeralDeDesempenho", wide: false, feature: "quiz" },
  { key: "category", title: "dashboard.assuntosMaisAcessadosChat", wide: false, feature: "chat" },
  { key: "proficiency", title: "dashboard.proficienciaPorAssuntoQuiz", wide: false, feature: "quiz" },
  { key: "effort", title: "dashboard.matrizDesempenhoVsEsforco", wide: true, feature: "quiz" },
  { key: "journey", title: "dashboard.jornadaDeAprendizagem", wide: true, feature: "quiz" },
];
const RAIL_KEY = "logibot.dashboard.panelCollapsed";
const HIDDEN_KEY = "logibot.dashboard.hiddenCharts";
const PERIOD_KEY = "logibot.dashboard.period";
const PRESETS: PeriodPreset[] = ["all", "7", "30", "90", "180", "custom"];
const SIDE_TONE: Record<Side, { border: string; badge: string; chip: string }> = {
  a: { border: "border-t-sky-400", badge: "bg-sky-300 text-neutral-950", chip: "border-sky-300/40 bg-sky-400/10 text-sky-100" },
  b: { border: "border-t-amber-400", badge: "bg-amber-300 text-neutral-950", chip: "border-amber-300/40 bg-amber-400/10 text-amber-100" },
};

const readStorage = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const writeStorage = (key: string, value: unknown) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
};

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => typeof window !== "undefined" && window.matchMedia?.(query).matches === true);
  useEffect(() => {
    const media = window.matchMedia?.(query);
    if (!media) return;
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);
  return matches;
}

/** Width of the chart area: comparisons go side by side only when both charts fit. */
function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => setWidth(element.clientWidth);
    update();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

function useSelection() {
  const [selection, setSelection] = useState<Selection>(EMPTY);
  const onChange = useCallback((type: LogEntityType | "", ids: string[], mode: LogModeType, hierarchyParams?: Omit<DashboardFilterParams, "startDate" | "endDate">) => {
    if (type === "") { setSelection(EMPTY); return; }
    const legacy = { type, ids: ids.filter((id) => id && id.trim() !== ""), mode, hierarchyParams: hierarchyParams || {} };
    setSelection({ legacy, filters: dashboardFiltersFromLegacy(legacy), selected: legacy.ids.length > 0 });
  }, []);
  const reset = useCallback(() => setSelection(EMPTY), []);
  return [selection, onChange, reset] as const;
}

/** Name of the selected entity, from the same academic data the filters use. */
function entityName(universities: University[], type: LogEntityType, id: string | undefined): string | null {
  if (!id) return null;
  for (const university of universities) {
    if (type === "university" && university._id === id) return university.name;
    for (const course of university.courses ?? []) {
      if (type === "course" && course._id === id) return course.name;
      for (const discipline of course.disciplines ?? []) if (type === "discipline" && discipline._id === id) return discipline.name;
      for (const klass of course.classes ?? []) {
        if (type === "class" && klass._id === id) return klass.name;
        for (const student of klass.students ?? []) if (type === "student" && student._id === id) return student.name;
      }
    }
  }
  return null;
}

const TYPE_LABEL: Record<string, MessageKey> = { student: "common.aluno", discipline: "common.disciplina", class: "common.turma", course: "common.curso", university: "common.universidade" };

function renderChart(key: ChartKey, selection: Selection) {
  const { legacy, filters } = selection;
  switch (key) {
    case "usage": return <UsageChart filter={legacy} />;
    case "access": return <AccessPatternChart filters={filters} />;
    case "correctWrong": return <CorrectWrongChart filter={legacy} />;
    case "generalScore": return <GeneralScoreChart filters={filters} />;
    case "category": return <CategoryChart filter={legacy} />;
    case "proficiency": return <ProficiencyRadarChart filters={filters} />;
    case "effort": return <EffortMatrixChart filters={filters} />;
    case "journey": return <LearningJourneyChart filters={filters} />;
    default: return null;
  }
}

/** One side of a comparison: a coloured top edge and a letter tab identify it without a label line. */
function ComparisonCell({ side, label, children }: { side: Side; label: string; children: ReactNode }) {
  return (
    <div className="relative h-full min-w-0 pt-3">
      <span aria-hidden="true" className={cn("absolute left-4 top-0 z-[1] inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 font-[Poppins] text-xs font-bold shadow", SIDE_TONE[side].badge)}>
        {side.toUpperCase()}
      </span>
      <span className="sr-only">{label}</span>
      <ChartIdContext.Provider value={side}>
        <div className={cn("h-full rounded-2xl border-t-4 [&>*]:h-full", SIDE_TONE[side].border)}>{children}</div>
      </ChartIdContext.Provider>
    </div>
  );
}

function DashboardContent() {
  const locale = useLocale();
  const baseId = useId();
  const insights = useDashboardInsights();
  const { isEnabled } = useFeatures();
  const comparisonReleased = isEnabled("dashboard_comparison");
  const desktop = useMediaQuery("(min-width: 1024px)");
  const [a, onChangeA] = useSelection();
  const [b, onChangeB, resetB] = useSelection();
  const [comparing, setComparing] = useState(false);
  // Without a saved choice the panel starts as the icon rail on smaller desktops, so the charts keep their room.
  const [collapsed, setCollapsed] = useState(() => readStorage(RAIL_KEY, typeof window !== "undefined" && window.innerWidth < 1536));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hidden, setHidden] = useState<ChartKey[]>(() => readStorage<ChartKey[]>(HIDDEN_KEY, []));
  const [pendingJump, setPendingJump] = useState<ChartKey | null>(null);
  const [pendingFocus, setPendingFocus] = useState<string | null>(null);
  const [areaRef, areaWidth] = useElementWidth<HTMLDivElement>();
  const drawerToggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useDialogFocus<HTMLDivElement>(!desktop && drawerOpen, () => setDrawerOpen(false));

  const academic = useQuery({ queryKey: ["academicFilters"], queryFn: academicFiltersApi.getAcademicData, staleTime: 5 * 60 * 1000 });
  const universities = useMemo(() => academic.data?.data?.universities ?? [], [academic.data]);

  // An entity is only compared with another of the same kind: changing the kind of A clears B.
  const typeA = a.legacy.type;
  // and B is chosen again whenever A changes (A's entity is never offered to B).
  const idA = a.legacy.ids[0] ?? "";
  useEffect(() => { resetB(); }, [typeA, idA, resetB]);

  // Period shared by A and B, so both sides always cover the same days.
  const [preset, setPreset] = useState<PeriodPreset>(() => readStorage<PeriodPreset>(PERIOD_KEY, "all"));
  const [custom, setCustom] = useState<{ startDate: string; endDate: string }>({ startDate: "", endDate: "" });
  const todayIso = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const customInvalid = preset === "custom" && !!custom.startDate && !!custom.endDate && custom.endDate < custom.startDate;
  const range = customInvalid ? {} : periodRange(preset, custom);
  const rangeKey = `${range.startDate ?? ""}|${range.endDate ?? ""}`;
  const withPeriod = useCallback((selection: Selection): Selection => selection.selected
    ? { ...selection, legacy: { ...selection.legacy, period: range }, filters: { ...selection.filters, ...range } }
    : selection,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [rangeKey]);
  const pa = useMemo(() => withPeriod(a), [a, withPeriod]);
  const pb = useMemo(() => withPeriod(b), [b, withPeriod]);
  const choosePreset = (value: PeriodPreset) => { setPreset(value); writeStorage(PERIOD_KEY, value); };

  const compare = comparisonReleased && comparing;
  const showB = compare && a.selected && b.selected;
  const sideBySide = showB && areaWidth >= 860;
  const typeLabel = t(TYPE_LABEL[typeA] ?? "dashboard.entidade");
  const describe = (selection: Selection, side: Side) =>
    t("dashboard.panel.selectionLabel", { side: side.toUpperCase(), type: typeLabel, name: entityName(universities, typeA, selection.legacy.ids[0]) ?? "—" });

  const toggleRail = () => setCollapsed((current) => { writeStorage(RAIL_KEY, !current); return !current; });
  /** From a rail icon: expand the panel, then move focus to the matching section. */
  const expandTo = (target: string) => {
    if (collapsed) { setCollapsed(false); writeStorage(RAIL_KEY, false); }
    setPendingFocus(target);
  };
  useEffect(() => {
    if (!pendingFocus || collapsed) return;
    const frame = requestAnimationFrame(() => { document.getElementById(pendingFocus)?.focus(); setPendingFocus(null); });
    return () => cancelAnimationFrame(frame);
  }, [pendingFocus, collapsed]);

  const closeDrawer = () => { setDrawerOpen(false); drawerToggleRef.current?.focus(); };
  const toggleChart = (key: ChartKey) => setHidden((current) => {
    const next = current.indexOf(key) === -1 ? [...current, key] : current.filter((item) => item !== key);
    writeStorage(HIDDEN_KEY, next);
    return next;
  });
  const jumpTo = (key: ChartKey) => {
    setPendingJump(key);
    // On narrow screens the drawer closes first; it gives focus back to its opener when it closes.
    if (!desktop) setDrawerOpen(false);
  };
  useEffect(() => {
    if (!pendingJump || (!desktop && drawerOpen)) return;
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(`${baseId}-section-${pendingJump}`);
      setPendingJump(null);
      if (!target) return;
      target.scrollIntoView?.({ block: "start", behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      target.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [pendingJump, desktop, drawerOpen, baseId]);

  // The access pattern chart only applies to students; direct comparison charts only while comparing.
  const available = CHARTS.filter((chart) => (chart.key !== "access" || typeA === "student") && (!chart.comparisonOnly || showB) && (!chart.feature || isEnabled(chart.feature)));
  const sideName = (selection: Selection, side: Side) => `${side.toUpperCase()} · ${entityName(universities, typeA, selection.legacy.ids[0]) ?? "—"}`;
  const visible = available.filter((chart) => hidden.indexOf(chart.key) === -1);

  const panelContent = (
    <div className="space-y-6">
      {comparisonReleased && (
        <section aria-labelledby={`${baseId}-compare-title`} className="space-y-3">
          <h3 id={`${baseId}-compare-title`} className="font-[Poppins] text-base font-semibold text-white">{t("dashboard.panel.comparison")}</h3>
          <label className="flex min-h-11 cursor-pointer items-start gap-3 font-[Poppins] text-sm text-white">
            <input id={`${baseId}-compare`} type="checkbox" checked={comparing} onChange={(event) => setComparing(event.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-blue-500" aria-describedby={`${baseId}-compare-hint`} />
            <span>
              <span className="font-medium">{t("dashboard.panel.compare")}</span>
              <span id={`${baseId}-compare-hint`} className="mt-0.5 block text-xs text-zinc-400">{t("dashboard.panel.compareHint")}</span>
            </span>
          </label>
          {comparing && (!a.selected ? (
            <p className="rounded-xl border border-dashed border-white/15 p-3 font-[Poppins] text-xs text-zinc-400">{t("dashboard.panel.chooseAFirst")}</p>
          ) : (
            <div className="space-y-2 rounded-xl border border-amber-300/30 bg-amber-400/5 p-3">
              <p className="font-[Poppins] text-xs font-semibold text-amber-100">{t("dashboard.panel.compareWith", { type: typeLabel })}</p>
              <AcademicFilter key={`${typeA}-${a.legacy.ids[0] ?? ""}`} entityType={typeA} stacked excludeIds={a.legacy.ids} onSelect={(ids, hierarchy) => onChangeB(typeA, ids, "individual", hierarchy)} />
            </div>
          ))}
        </section>
      )}
      <fieldset className={cn(comparisonReleased && "border-t border-white/10 pt-5")}>
        <legend id={`${baseId}-charts-title`} tabIndex={-1} className="font-[Poppins] text-base font-semibold text-white outline-none">{t("dashboard.panel.charts")}</legend>
        <p className="mt-1 font-[Poppins] text-xs text-zinc-400">{t("dashboard.panel.chartsHint")}</p>
        <ul className="mt-3 space-y-1">
          {available.map((chart) => (
            <li key={chart.key} className="flex items-center gap-2">
              <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3 font-[Poppins] text-sm text-zinc-200">
                <input type="checkbox" checked={hidden.indexOf(chart.key) === -1} onChange={() => toggleChart(chart.key)} className="h-5 w-5 shrink-0 accent-blue-500" />
                <span className="min-w-0">{t(chart.title)}</span>
              </label>
              <button type="button" disabled={!a.selected || hidden.indexOf(chart.key) !== -1} onClick={() => jumpTo(chart.key)}
                aria-label={t("dashboard.panel.goTo", { chart: t(chart.title) })}
                className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-2.5 font-[Poppins] text-xs font-semibold text-blue-300 hover:bg-white/5 disabled:opacity-40 sm:min-h-8">
                {t("dashboard.panel.goToShort")}
              </button>
            </li>
          ))}
        </ul>
      </fieldset>
    </div>
  );

  const chartBlock = (chart: (typeof CHARTS)[number]) => (
    <section key={chart.key} id={`${baseId}-section-${chart.key}`} tabIndex={-1} aria-label={t(chart.title)}
      className="scroll-mt-16 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
      {chart.comparisonOnly ? (
        <div className="h-full [&>*]:h-full">
          {(() => {
            const props = { a: pa.filters, b: pb.filters, labelA: sideName(a, "a"), labelB: sideName(b, "b") };
            if (chart.key === "compareHighlights") return <BiggestDifferences {...props} />;
            if (chart.key === "compareTopics") return <TopicDifferenceChart {...props} />;
            if (chart.key === "compareRadar") return <RadarOverlayChart {...props} />;
            if (chart.key === "compareExams") return <ExamResultsChart {...props} />;
            if (chart.key === "compareChat") return <ChatSatisfactionChart {...props} />;
            if (chart.key === "compareEngagement") return <WeeklyEngagementChart {...props} />;
            return <PerformanceDistributionChart {...props} />;
          })()}
        </div>
      ) : showB ? (
        <div className={cn("grid items-stretch gap-4", sideBySide ? "grid-cols-2" : "grid-cols-1")}>
          <ComparisonCell side="a" label={describe(a, "a")}>{renderChart(chart.key, pa)}</ComparisonCell>
          <ComparisonCell side="b" label={describe(b, "b")}>{renderChart(chart.key, pb)}</ComparisonCell>
        </div>
      ) : (
        <div className="h-full [&>*]:h-full">{renderChart(chart.key, pa)}</div>
      )}
    </section>
  );

  // Without a comparison, the four smaller charts keep sharing rows two by two.
  const layout: ReactNode[] = [];
  let pair: ReactNode[] = [];
  const flush = () => {
    if (pair.length) layout.push(<div key={`pair-${layout.length}`} className={cn("grid grid-cols-1 items-stretch gap-6", (!showB || sideBySide) && "md:grid-cols-2")}>{pair}</div>);
    pair = [];
  };
  if (showB) {
    // Direct comparisons first (two smaller ones share a row), then each chart with A and B side by side.
    visible.filter((chart) => chart.comparisonOnly).forEach((chart) => {
      if (chart.wide) { flush(); layout.push(chartBlock(chart)); } else pair.push(chartBlock(chart));
    });
    flush();
    visible.filter((chart) => !chart.comparisonOnly).forEach((chart) => layout.push(chartBlock(chart)));
  } else {
    visible.forEach((chart) => {
      if (chart.wide) { flush(); layout.push(chartBlock(chart)); } else pair.push(chartBlock(chart));
    });
    flush();
  }

  const overviewButton = (selection: Selection, side: Side | null) => (
    <button type="button" onClick={() => insights.openOverview(selection.filters)}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-violet-500/25 bg-violet-500/10 px-3 font-[Poppins] text-xs font-semibold text-violet-300 transition-colors hover:border-violet-500/40 hover:bg-violet-500/15 sm:min-h-9">
      <Sparkles aria-hidden="true" className="h-4 w-4" />
      {side ? t("dashboard.panel.overviewSide", { side: side.toUpperCase() }) : t("dashboard.gerarAnaliseGeral", {}, locale)}
    </button>
  );

  return (
    <div className="relative flex min-h-0 flex-1">
      <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
        <div ref={areaRef} className="mx-auto w-full max-w-[100rem] space-y-5">
          <section className="rounded-2xl border border-white/10 bg-surface p-5 shadow-lg shadow-black/10 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <BarChart2 aria-hidden="true" className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="font-[Poppins] text-2xl font-semibold text-white">{t("dashboard.dashboardDeAtividades", {}, locale)}</h1>
                  <p className="mt-2 font-[Poppins] text-sm leading-relaxed text-zinc-400">{t("dashboard.visualizeMetricasDetalhadasPorEntidadeEPeriodo", {}, locale)}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {a.selected && overviewButton(pa, showB ? "a" : null)}
                {showB && overviewButton(pb, "b")}
                {showB && (
                  <button type="button" onClick={() => insights.openComparison(pa.filters, pb.filters)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-violet-500/25 bg-violet-500/10 px-3 font-[Poppins] text-xs font-semibold text-violet-300 transition-colors hover:border-violet-500/40 hover:bg-violet-500/15 sm:min-h-9">
                    <Sparkles aria-hidden="true" className="h-4 w-4" />
                    {t("dashboard.panel.overviewBoth")}
                  </button>
                )}
                {!desktop && (
                  <button ref={drawerToggleRef} type="button" data-dashboard-panel-toggle onClick={() => setDrawerOpen(true)} aria-expanded={drawerOpen} aria-controls={`${baseId}-drawer`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 font-[Poppins] text-xs font-semibold text-zinc-200 transition-colors hover:bg-white/10">
                    <PanelRightOpen aria-hidden="true" className="h-4 w-4" />
                    {t("dashboard.panel.open")}
                  </button>
                )}
              </div>
            </div>
          </section>

          <DashboardFilter onChange={onChangeA} />

          <section aria-labelledby={`${baseId}-period-title`} className="rounded-2xl border border-white/10 bg-surface p-5 shadow-lg shadow-black/10 sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="md:w-64">
                <h2 id={`${baseId}-period-title`} className="mb-1.5 font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">{t("dashboard.period.title")}</h2>
                <label htmlFor={`${baseId}-period`} className="sr-only">{t("dashboard.period.title")}</label>
                <select id={`${baseId}-period`} value={preset} onChange={(event) => choosePreset(event.target.value as PeriodPreset)} aria-describedby={`${baseId}-period-hint`}
                  className="h-11 w-full rounded-xl border border-control bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white">
                  {PRESETS.map((value) => <option key={value} value={value}>{t(`dashboard.period.preset.${value}` as MessageKey)}</option>)}
                </select>
              </div>
              {preset === "custom" && (
                <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`${baseId}-from`} className="mb-1.5 block font-[Poppins] text-xs font-medium text-zinc-300">{t("dashboard.period.from")}</label>
                    <input id={`${baseId}-from`} type="date" max={custom.endDate || todayIso} value={custom.startDate}
                      onChange={(event) => setCustom((current) => ({ ...current, startDate: event.target.value }))}
                      className="h-11 w-full rounded-xl border border-control bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white [color-scheme:dark]" />
                  </div>
                  <div>
                    <label htmlFor={`${baseId}-to`} className="mb-1.5 block font-[Poppins] text-xs font-medium text-zinc-300">{t("dashboard.period.to")}</label>
                    <input id={`${baseId}-to`} type="date" min={custom.startDate || undefined} max={todayIso} value={custom.endDate}
                      aria-invalid={customInvalid || undefined} aria-describedby={customInvalid ? `${baseId}-period-error` : undefined}
                      onChange={(event) => setCustom((current) => ({ ...current, endDate: event.target.value }))}
                      className="h-11 w-full rounded-xl border border-control bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white aria-[invalid=true]:border-red-400 [color-scheme:dark]" />
                  </div>
                </div>
              )}
            </div>
            <p id={`${baseId}-period-hint`} className="mt-2 font-[Poppins] text-xs text-zinc-400">{t(compare ? "dashboard.period.hintCompare" : "dashboard.period.hint")}</p>
            {customInvalid && <p id={`${baseId}-period-error`} role="alert" className="mt-1 font-[Poppins] text-xs text-red-300">{t("dashboard.period.invalid")}</p>}
          </section>

          {!a.selected ? (
            <div className="flex min-h-[16rem] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-surface p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-zinc-500">
                <MousePointer2 aria-hidden="true" className="h-5 w-5" />
              </div>
              <p className="font-[Poppins] text-sm font-medium text-zinc-400">{t("dashboard.selecioneUmaEntidadeParaVisualizarOsDados", {}, locale)}</p>
            </div>
          ) : visible.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 bg-surface p-8 text-center font-[Poppins] text-sm text-zinc-400">{t("dashboard.panel.allHidden")}</p>
          ) : (
            <div className="space-y-6">
              {showB && (
                // Column headings stay visible while scrolling through the compared charts.
                <div data-comparison-header className={cn("sticky -top-6 z-20 grid gap-4 bg-neutral-900 pb-3 pt-6 md:-top-8 md:pt-8", sideBySide ? "grid-cols-2" : "grid-cols-1")}>
                  {(["a", "b"] as Side[]).map((side) => (
                    <p key={side} className={cn("flex min-w-0 items-center gap-2 rounded-lg border px-3 py-1.5 font-[Poppins] text-xs font-semibold", SIDE_TONE[side].chip)}>
                      <span aria-hidden="true" className={cn("inline-flex h-5 min-w-5 items-center justify-center rounded px-1 text-[0.7rem] font-bold", SIDE_TONE[side].badge)}>{side.toUpperCase()}</span>
                      <span className="min-w-0 truncate">{describe(side === "a" ? a : b, side)}</span>
                    </p>
                  ))}
                </div>
              )}
              {layout}
            </div>
          )}
        </div>
      </main>

      {desktop ? (
        <aside id={`${baseId}-panel`} aria-label={t("dashboard.panel.label")} data-collapsed={collapsed || undefined}
          className={cn("dashboard-panel relative flex shrink-0 flex-col overflow-hidden border-l border-white/10 bg-surface", collapsed ? "w-16" : "w-80")}>
          <div className={cn("flex h-[4.25rem] shrink-0 items-center border-b border-white/10", collapsed ? "px-2.5" : "px-4")}>
            {/* Mirrors the main menu: each toggle sits on the edge that faces the page content. */}
            <button type="button" data-dashboard-panel-toggle onClick={toggleRail} aria-expanded={!collapsed} aria-controls={`${baseId}-panel-content`}
              aria-label={collapsed ? t("dashboard.panel.expand") : t("dashboard.panel.collapse")} title={collapsed ? t("dashboard.panel.expand") : t("dashboard.panel.collapse")}
              className={RAIL_TOGGLE_CLASS}>
              <PanelRightClose aria-hidden="true" className={cn("dashboard-panel-icon", RAIL_TOGGLE_ICON_CLASS, collapsed && "rotate-180")} />
            </button>
            <h2 className={cn("dashboard-panel-fade min-w-0 flex-1 truncate pl-3 font-[Poppins] text-sm font-semibold text-white", collapsed && "opacity-0")} aria-hidden={collapsed || undefined}>
              {t("dashboard.panel.label")}
            </h2>
          </div>
          <div className="relative min-h-0 flex-1">
            {/* Both states stay mounted so the width change and the fade run together. */}
            <div {...(collapsed ? { inert: "" } : {})} aria-hidden={collapsed || undefined} id={`${baseId}-panel-content`}
              className={cn("dashboard-panel-fade absolute inset-y-0 left-0 w-80 overflow-y-auto p-5", collapsed && "pointer-events-none opacity-0")}>
              {panelContent}
            </div>
            <div {...(!collapsed ? { inert: "" } : {})} aria-hidden={!collapsed || undefined}
              className={cn("dashboard-panel-fade absolute inset-y-0 left-0 flex w-16 flex-col items-center gap-2 p-2.5", !collapsed && "pointer-events-none opacity-0")}>
              {comparisonReleased && (
                <button type="button" onClick={() => expandTo(`${baseId}-compare`)} aria-label={t("dashboard.panel.comparison")} title={t("dashboard.panel.comparison")}
                  className={cn("inline-flex h-11 w-11 items-center justify-center rounded-lg transition-colors hover:bg-white/10", comparing ? "bg-amber-400/15 text-amber-200" : "text-zinc-300")}>
                  <Columns aria-hidden="true" className="h-5 w-5" />
                </button>
              )}
              <button type="button" onClick={() => expandTo(`${baseId}-charts-title`)} aria-label={t("dashboard.panel.charts")} title={t("dashboard.panel.charts")}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-zinc-300 transition-colors hover:bg-white/10">
                <ListChecks aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
          </div>
        </aside>
      ) : (
        drawerOpen && (
          <div className="fixed inset-0 z-40 flex justify-end">
            <div aria-hidden="true" className="mobile-drawer-backdrop absolute inset-0 bg-black/60" onClick={closeDrawer} />
            <div ref={drawerRef} data-dashboard-drawer id={`${baseId}-drawer`} role="dialog" aria-modal="true" aria-label={t("dashboard.panel.label")}
              className="relative flex h-full w-[min(22rem,100vw)] flex-col border-l border-white/10 bg-surface">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <h2 className="font-[Poppins] text-base font-semibold text-white">{t("dashboard.panel.label")}</h2>
                <button type="button" onClick={closeDrawer} aria-label={t("common.fechar")} className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-zinc-300 hover:bg-white/5">
                  <X aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">{panelContent}</div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

export function Dashboard() {
  useLocale();
  return (
    <DashboardInsightProvider>
      <DashboardContent />
    </DashboardInsightProvider>
  );
}
