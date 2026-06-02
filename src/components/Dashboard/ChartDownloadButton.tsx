import { Download } from "lucide-react";
import { logger } from "@/utils/logger";
import { useRef } from "react";

interface ChartDownloadButtonProps {
  containerId: string;
  fileName: string;
  className?: string;
}

function downloadTextFile(content: string, fileName: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportChartSvg(containerId: string, fileName: string) {
  const container = document.getElementById(containerId);
  const svg = container?.querySelector("svg");

  if (!svg) {
    throw new Error(`Nenhum gráfico SVG encontrado em '${containerId}'.`);
  }

  const clone = svg.cloneNode(true) as SVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  const content = new XMLSerializer().serializeToString(clone);
  downloadTextFile(content, `${fileName}.svg`, "image/svg+xml;charset=utf-8");
}

export function ChartDownloadButton({
  containerId,
  fileName,
  className,
}: ChartDownloadButtonProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const handleExportClick = () => {
    try {
      exportChartSvg(containerId, fileName);
    } catch (error) {
      logger.warn("Dashboard", "Erro ao exportar gráfico.", error);
    }
  };

  return (
    <div ref={menuRef} className={`relative ${className || ""}`}>
      <button
        type="button"
        aria-label="Baixar gráfico"
        title="Baixar gráfico"
        className="rounded-lg border border-white/10 bg-white/5 p-2 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
        onClick={handleExportClick}
      >
        <Download className="h-4 w-4" />
      </button>
    </div>
  );
}
