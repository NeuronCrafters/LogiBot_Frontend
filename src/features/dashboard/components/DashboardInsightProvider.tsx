import {
  createContext,
  useCallback,
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

type InsightRequest =
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
    };

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

const STALE_TIME = 15 * 60 * 1000;

function queryKey(request: InsightRequest) {
  return [
    "dashboard-insight",
    request.kind,
    request.kind === "chart" ? request.chart : "overview",
    request.filters,
  ] as const;
}

function errorMessage(error: any) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Could not generate the insight right now."
  );
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
                )
              : await dashboardApi.getOverviewInsight(next.filters, force);
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
        if (requestNumber === activeRequest.current) setResult(data);
      } catch (caught) {
        if (requestNumber === activeRequest.current)
          setError(errorMessage(caught));
      } finally {
        if (requestNumber === activeRequest.current) setLoading(false);
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
      const next: InsightRequest = { kind: "chart", chart, title, filters };
      setRequest(next);
      void load(next, false);
    },
    [load],
  );

  const openOverview = useCallback(
    (filters: DashboardFilterParams) => {
      const next: InsightRequest = {
        kind: "overview",
        title: "Overall dashboard analysis",
        filters,
      };
      setRequest(next);
      void load(next, false);
    },
    [load],
  );

  const close = () => {
    activeRequest.current += 1;
    setRequest(null);
    setResult(null);
    setError("");
    setLoading(false);
  };

  return (
    <DashboardInsightContext.Provider value={{ openChart, openOverview }}>
      {children}
      {request && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6">
          <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1f1f1f] text-white shadow-2xl shadow-black/50">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-gradient-to-r from-violet-500/[0.08] to-transparent p-5 sm:px-8 sm:py-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-[Poppins] text-lg font-semibold">
                    {request.title}
                  </h2>
                  <p className="mt-1 font-[Poppins] text-sm text-zinc-500">
                    Pedagogical insight generated from the current data.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close insight"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-[320px] flex-1 overflow-y-auto p-5 sm:px-8 sm:py-7">
              {loading && !result && (
                <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 text-center">
                  <Loader2 className="h-7 w-7 animate-spin text-violet-400" />
                  <p className="font-[Poppins] text-sm text-zinc-400">
                    Analyzing the dashboard data...
                  </p>
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
                    Try again
                  </button>
                </div>
              )}

              {result && (
                <div className="space-y-5">
                  {loading && (
                    <div className="flex items-center gap-2 rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2 font-[Poppins] text-xs text-violet-300">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Generating a new analysis...
                    </div>
                  )}
                  <div className="mx-auto w-full max-w-5xl">
                    <Markdown
                      remarkPlugins={[remarkGfm]}
                      components={insightMarkdownComponents}
                    >
                      {result.insight}
                    </Markdown>
                  </div>
                  <div className="mx-auto w-full max-w-5xl rounded-xl border border-amber-500/15 bg-amber-500/5 p-4 font-[Poppins] text-xs leading-relaxed text-amber-200/70">
                    This content supports pedagogical decisions and should be interpreted alongside the class context and the professor's observations.
                  </div>
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
                  Close
                </button>
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
                    Regenerate
                  </button>
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
  const context = useContext(DashboardInsightContext);
  if (!context)
    throw new Error(
      "useDashboardInsights must be used within DashboardInsightProvider",
    );
  return context;
}
