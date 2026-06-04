import { toPng } from "html-to-image";
import { Download, Info, X } from "lucide-react";
import { logger } from "@/shared/lib/logger";
import { useState, useRef, useEffect } from "react";

interface ChartDownloadButtonProps {
  containerId: string;
  fileName: string;
  info?: string;
  className?: string;
}

async function downloadChartAsPng(
  containerId: string,
  fileName: string,
): Promise<void> {
  const container = document.getElementById(containerId);
  if (!container) throw new Error(`Container '${containerId}' não encontrado.`);

  const dataUrl = await toPng(container, {
    backgroundColor: "#1f1f1f",
    pixelRatio: 2,
    cacheBust: true,
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
}: ChartDownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const infoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showInfo) return;
    function handleClickOutside(e: MouseEvent) {
      if (infoRef.current && !infoRef.current.contains(e.target as Node)) {
        setShowInfo(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    <div className={`flex items-center gap-1.5 ${className ?? ""}`}>
      {info && (
        <div ref={infoRef} className="relative">
          <button
            type="button"
            aria-label="Informações sobre o gráfico"
            onClick={() => setShowInfo((v) => !v)}
            className={`rounded-lg border p-2 transition-colors ${
              showInfo
                ? "border-blue-500/40 bg-blue-500/10 text-blue-400"
                : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Info className="h-4 w-4" />
          </button>

          {showInfo && (
            <div className="absolute right-0 top-11 z-50 w-72 rounded-xl border border-white/10 bg-[#141414] p-4 shadow-2xl shadow-black/60">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Sobre este gráfico
                </span>
                <button
                  onClick={() => setShowInfo(false)}
                  className="text-zinc-600 transition-colors hover:text-zinc-400"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="font-[Poppins] text-xs leading-relaxed text-zinc-400">
                {info}
              </p>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        aria-label="Baixar gráfico como PNG"
        title="Baixar como PNG"
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
