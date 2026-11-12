import { t, useLocale } from "@/i18n";
﻿import { toPng } from "html-to-image";
import { Download, Info, Sparkles, X } from "lucide-react";
import { logger } from "@/shared/lib/logger";
import { useState, useRef, useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { useFloatingPosition } from "@/shared/hooks/useFloatingPosition";
import type { DashboardFilterParams } from "../api/dashboardApi";
import type { DashboardInsightChart } from "../types";
import { useDashboardInsights } from "./DashboardInsightProvider";

interface ChartDownloadButtonProps {
  containerId: string;
  fileName: string;
  info?: string;
  className?: string;
  insight?: {
    chart: DashboardInsightChart;
    title: string;
    filters: DashboardFilterParams;
    disabled?: boolean;
  };
}

async function downloadChartAsPng(
  containerId: string,
  fileName: string,
): Promise<void> {
  const container = document.getElementById(containerId);
  if (!container) throw new Error(t("dashboard.containerValue0NaoEncontrado", { value0: containerId }));

  const dataUrl = await toPng(container, {
    backgroundColor: `rgb(${getComputedStyle(document.documentElement).getPropertyValue("--c-surface").trim() || "31 31 31"})`,
    pixelRatio: 2,
    cacheBust: true,
    filter: (node) => !(node instanceof HTMLElement && node.dataset.exportIgnore === "true"),
  });

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `${fileName}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function ChartDownloadButton({
  containerId,
  fileName,
  info,
  className,
  insight,
}: ChartDownloadButtonProps) {
  useLocale();

  const dashboardInsights = useDashboardInsights();
  const [downloading, setDownloading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const infoRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const infoId = useId();
  const position = useFloatingPosition(showInfo, triggerRef, infoRef);

  useEffect(() => {
    if (!showInfo || position.visibility !== "visible") return;
    let frame: number;
    const focusWhenPainted = () => {
      const close = closeRef.current;
      if (!close) return;
      if (getComputedStyle(close).visibility === "visible") close.focus({ preventScroll: true });
      else frame = requestAnimationFrame(focusWhenPainted);
    };
    frame = requestAnimationFrame(focusWhenPainted);
    return () => cancelAnimationFrame(frame);
  }, [showInfo, position.visibility]);

  useEffect(() => {
    if (!showInfo) return;
    function handleClickOutside(e: Event) {
      if (!infoRef.current?.contains(e.target as Node) && !triggerRef.current?.contains(e.target as Node)) {
        setShowInfo(false);
      }
    }
    function escape(e: KeyboardEvent) {
      if (e.key === "Escape") { e.preventDefault(); setShowInfo(false); triggerRef.current?.focus({ preventScroll: true }); }
    }
    document.addEventListener("pointerdown", handleClickOutside);
    document.addEventListener("focusin", handleClickOutside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
      document.removeEventListener("focusin", handleClickOutside);
      document.removeEventListener("keydown", escape);
    };
  }, [showInfo]);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadChartAsPng(containerId, fileName);
    } catch (error) {
      logger.warn("Dashboard", "Erro ao exportar gráfico.", error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={`flex min-w-0 max-w-full flex-wrap items-center gap-1.5 ${className ?? ""}`}>
      {info && (
        <div className="relative">
          <button
            ref={triggerRef}
            type="button"
            aria-label={t("dashboard.informacoesSobreOGrafico")}
            aria-expanded={showInfo}
            aria-controls={showInfo ? infoId : undefined}
            aria-haspopup="dialog"
            onClick={() => setShowInfo((v) => !v)}
            className={`rounded-lg border p-2 transition-colors ${
              showInfo
                ? "border-blue-500/40 bg-blue-500/10 text-blue-400"
                : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Info className="h-4 w-4" />
          </button>

          {showInfo && createPortal(
            <div ref={infoRef} id={infoId} role="dialog" aria-label={t("dashboard.sobreEsteGrafico")} style={position} data-chart-info className="fixed z-[70] max-h-[calc(100dvh-2rem)] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-contain rounded-xl border border-white/10 bg-surface-sunken p-4 font-[Poppins] text-white shadow-2xl shadow-black/60 [overflow-wrap:anywhere]">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  {t("dashboard.sobreEsteGrafico")}</span>
                <button
                  ref={closeRef}
                  type="button"
                  aria-label={t("common.fechar")}
                  onClick={() => { setShowInfo(false); triggerRef.current?.focus({ preventScroll: true }); }}
                  className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="font-[Poppins] text-xs leading-relaxed text-zinc-400">
                {info}
              </p>
            </div>
          , document.body)}
        </div>
      )}

      {insight && (
        <button
          type="button"
          aria-label={t("dashboard.gerarInsightDeIaParaValue0", { value0: insight.title })}
          title={t("dashboard.analisarComIa")}
          disabled={insight.disabled}
          onClick={() =>
            dashboardInsights.openChart(
              insight.chart,
              insight.title,
              insight.filters,
            )
          }
          className="rounded-lg border border-violet-500/20 bg-violet-500/10 p-2 text-violet-400 transition-colors hover:border-violet-500/40 hover:bg-violet-500/15 hover:text-violet-300 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Sparkles className="h-4 w-4" />
        </button>
      )}

      <button
        type="button"
        aria-label={t("dashboard.baixarGraficoComoPng")}
        title={t("dashboard.baixarComoPng")}
        disabled={downloading}
        onClick={handleDownload}
        className="rounded-lg border border-white/10 bg-white/5 p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
      >
        {downloading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-zinc-300" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
