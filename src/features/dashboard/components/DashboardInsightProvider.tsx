import { apiError } from "@/shared/lib/apiError";
import { useDialogFocus } from "@/shared/hooks/useDialogFocus";
import { t, useLocale, getLanguage, type Language } from "@/i18n";
import {
  createContext,
  useCallback,
  useEffect,
  useContext,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Loader2, Sparkles, X } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  dashboardApi,
  type DashboardFilterParams,
} from "@/features/dashboard/api/dashboardApi";
import type {
  DashboardInsightChart,
  DashboardInsightResponse,
} from "@/features/dashboard/types";

type InsightRequest = { language: Language } & (
  | {
      kind: "chart";
      chart: DashboardInsightChart;
      title: string;
      filters: DashboardFilterParams;
    }
  | {
      kind: "overview";
      title: string;
      filters: DashboardFilterParams;
    });

type DashboardInsightContextValue = {
  openChart: (
    chart: DashboardInsightChart,
    title: string,
    filters: DashboardFilterParams,
  ) => void;
  openOverview: (filters: DashboardFilterParams) => void;
};

const DashboardInsightContext =
  createContext<DashboardInsightContextValue | null>(null);

const INSIGHT_TITLES = {
  "usage": "dashboard.tempoDeUsoDiario_490",
  "accuracy": "dashboard.acertosEErros",
  "chat-topics": "dashboard.assuntosMaisAcessadosNoChat",
  "general-score": "dashboard.avaliacaoGeralDeDesempenho_443",
  "proficiency-radar": "dashboard.proficienciaPorAssunto",
  "effort-matrix": "dashboard.matrizDesempenhoVersusEsforco",
  "learning-journey": "dashboard.jornadaDeAprendizagem_458",
  "access-pattern": "dashboard.padraoDeAcesso"
} as const;

const STALE_TIME = 15 * 60 * 1000;

function queryKey(request: InsightRequest) {
  return [
    "dashboard-insight",
    request.language,
    request.kind,
    request.kind === "chart" ? request.chart : "overview",
    request.filters,
  ] as const;
}

function errorMessage(error: unknown) {
  return apiError(error, "dashboard.naoFoiPossivelGerarOInsightAgora");
}

const insightMarkdownComponents = {
  h2: (props: ComponentPropsWithoutRef<"h2">) => (
    <h2
      className="mb-3 mt-8 border-b border-white/10 pb-2 font-[Poppins] text-lg font-semibold text-white first:mt-0"
      {...props}
    />
  ),
  h3: (props: ComponentPropsWithoutRef<"h3">) => (
    <h3
      className="mb-2 mt-6 font-[Poppins] text-base font-semibold text-violet-200"
      {...props}
    />
  ),
  p: (props: ComponentPropsWithoutRef<"p">) => (
    <p
      className="my-3 font-[Poppins] text-sm leading-7 text-zinc-300"
      {...props}
    />
  ),
  strong: (props: ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-semibold text-white" {...props} />
  ),
  ul: (props: ComponentPropsWithoutRef<"ul">) => (
    <ul
      className="my-3 list-disc space-y-2 pl-6 font-[Poppins] text-sm leading-6 text-zinc-300 marker:text-violet-400"
      {...props}
    />
  ),
  ol: (props: ComponentPropsWithoutRef<"ol">) => (
    <ol
      className="my-3 list-decimal space-y-2 pl-6 font-[Poppins] text-sm leading-6 text-zinc-300 marker:font-semibold marker:text-violet-400"
      {...props}
    />
  ),
  blockquote: (props: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className="my-4 rounded-r-xl border-l-4 border-violet-500 bg-violet-500/5 px-4 py-3 font-[Poppins] text-sm leading-6 text-zinc-300"
      {...props}
    />
  ),
  table: (props: ComponentPropsWithoutRef<"table">) => (
    <div className="my-5 overflow-x-auto rounded-xl border border-white/10 bg-neutral-950/40">
      <table
        className="w-full min-w-[680px] border-collapse text-left font-[Poppins] text-sm"
        {...props}
      />
    </div>
  ),
  thead: (props: ComponentPropsWithoutRef<"thead">) => (
    <thead
      className="border-b border-white/10 bg-violet-500/10 text-violet-100"
      {...props}
    />
  ),
  tbody: (props: ComponentPropsWithoutRef<"tbody">) => (
    <tbody className="divide-y divide-white/5" {...props} />
  ),
  tr: (props: ComponentPropsWithoutRef<"tr">) => (
    <tr
      className="transition-colors even:bg-white/[0.025] hover:bg-white/[0.045]"
      {...props}
    />
  ),
  th: (props: ComponentPropsWithoutRef<"th">) => (
    <th
      className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider"
      {...props}
    />
  ),
  td: (props: ComponentPropsWithoutRef<"td">) => (
    <td
      className="px-4 py-3 align-top leading-6 text-zinc-300"
      {...props}
    />
  ),
  code: (props: ComponentPropsWithoutRef<"code">) => (
    <code
      className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-violet-200"
      {...props}
    />
  ),
  hr: (props: ComponentPropsWithoutRef<"hr">) => (
    <hr className="my-7 border-white/10" {...props} />
  ),
};

export function DashboardInsightProvider({
  children,
}: {
  children: ReactNode;
}) {
  const locale = useLocale();

  const queryClient = useQueryClient();
  const [request, setRequest] = useState<InsightRequest | null>(null);
  const [result, setResult] = useState<DashboardInsightResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const activeRequest = useRef(0);

  const load = useCallback(
    async (next: InsightRequest, force: boolean) => {
      const requestNumber = ++activeRequest.current;
      setLoading(true);
      setError("");
      if (!force) setResult(null);

      try {
        const fetchInsight = async () => {
          const response =
            next.kind === "chart"
              ? await dashboardApi.getChartInsight(
                  next.chart,
                  next.filters,
                  force,
                  next.language,
                )
              : await dashboardApi.getOverviewInsight(next.filters, force, next.language);
          return response.data;
        };

        const data = force
          ? await fetchInsight()
          : await queryClient.fetchQuery({
              queryKey: queryKey(next),
              queryFn: fetchInsight,
              staleTime: STALE_TIME,
            });

        if (force) queryClient.setQueryData(queryKey(next), data);
        if (requestNumber === activeRequest.current && next.language === getLanguage()) setResult(data);
      } catch (caught) {
        if (requestNumber === activeRequest.current && next.language === getLanguage())
          setError(errorMessage(caught));
      } finally {
        if (requestNumber === activeRequest.current && next.language === getLanguage()) setLoading(false);
      }
    },
    [queryClient],
  );

  const openChart = useCallback(
    (
      chart: DashboardInsightChart,
      title: string,
      filters: DashboardFilterParams,
    ) => {
      const next: InsightRequest = { kind: "chart", chart, title, filters, language: getLanguage() };
      setRequest(next);
      void load(next, false);
    },
    [load],
  );

  const openOverview = useCallback(
    (filters: DashboardFilterParams) => {
      const next: InsightRequest = {
        kind: "overview",
        language: getLanguage(),
        title: t("dashboard.analiseGeralDoDashboard", {}, locale),
        filters,
      };
      setRequest(next);
      void load(next, false);
    },
    [load, locale],
  );

  useEffect(() => {
    if (!request || request.language === locale) return;
    const next = { ...request, language: locale };
    setRequest(next);
    void load(next, false);
  }, [locale, request, load]);

  const close = () => {
    activeRequest.current += 1;
    setRequest(null);
    setResult(null);
    setError("");
    setLoading(false);
  };

  const dialogRef = useDialogFocus<HTMLDivElement>(Boolean(request), close);

  return (
    <DashboardInsightContext.Provider value={{ openChart, openOverview }}>
      {children}
      {request && (
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={t("dashboard.insightPedagogicoGeradoAPartirDosDados", {}, locale)} tabIndex={-1} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6">
          <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1f1f1f] text-white shadow-2xl shadow-black/50">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-gradient-to-r from-violet-500/[0.08] to-transparent p-5 sm:px-8 sm:py-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-[Poppins] text-lg font-semibold">
                    {request.kind === "overview" ? t("dashboard.analiseGeralDoDashboard", {}, locale) : t(INSIGHT_TITLES[request.chart], {}, locale)}
                  </h2>
                  <p className="mt-1 font-[Poppins] text-sm text-zinc-500">
                    {t("dashboard.insightPedagogicoGeradoAPartirDosDados", {}, locale)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label={t("dashboard.fecharInsight", {}, locale)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div tabIndex={0} role="region" aria-label={t("dashboard.insightPedagogicoGeradoAPartirDosDados", {}, locale)} className="min-h-0 flex-1 overflow-y-auto p-5 sm:px-8 sm:py-7">
              {loading && !result && (
                <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 text-center">
                  <Loader2 className="h-7 w-7 animate-spin text-violet-400" />
                  <p className="font-[Poppins] text-sm text-zinc-400">
                    {t("dashboard.analisandoOsDadosDoDashboard", {}, locale)}</p>
                </div>
              )}

              {error && (
                <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 text-center">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                  <p className="max-w-lg font-[Poppins] text-sm leading-relaxed text-zinc-300">
                    {error}
                  </p>
                  <button
                    type="button"
                    onClick={() => void load(request, false)}
                    className="rounded-lg bg-blue-600 px-4 py-2 font-[Poppins] text-sm font-semibold hover:bg-blue-500"
                  >
                    {t("common.tentarNovamente", {}, locale)}</button>
                </div>
              )}

              {result && (
                <div className="space-y-5">
                  {loading && (
                    <div className="flex items-center gap-2 rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2 font-[Poppins] text-xs text-violet-300">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {t("dashboard.gerandoUmaNovaAnalise", {}, locale)}</div>
                  )}
                  <div lang={result.language} className="mx-auto w-full max-w-5xl">
                    <Markdown
                      remarkPlugins={[remarkGfm]}
                      components={insightMarkdownComponents}
                    >
                      {result.insight}
                    </Markdown>
                  </div>
                  <div className="mx-auto w-full max-w-5xl rounded-xl border border-amber-500/15 bg-amber-500/5 p-4 font-[Poppins] text-xs leading-relaxed text-amber-200/70">
                    {t("dashboard.esteConteudoApoiaADecisaoPedagogicaE", {}, locale)}</div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 bg-neutral-950/40 p-5 sm:flex-row sm:items-center sm:justify-end sm:px-8">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-[Poppins] text-sm font-semibold text-zinc-200 hover:bg-white/10"
                >
                  {t("common.fechar", {}, locale)}</button>
                {result && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void load(request, true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 font-[Poppins] text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {t("dashboard.gerarNovamente", {}, locale)}</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardInsightContext.Provider>
  );
}

export function useDashboardInsights() {
  useLocale();

  const context = useContext(DashboardInsightContext);
  if (!context)
    throw new Error(
      t("dashboard.usedashboardinsightsDeveSerUsadoDentroDeDashboardinsightprovider"),
    );
  return context;
}
