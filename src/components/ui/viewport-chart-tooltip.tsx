import { useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useFloatingPosition } from "@/shared/hooks/useFloatingPosition";
import { t } from "@/i18n";

export function ViewportChartTooltip({ active, interactive, children }: { active?: boolean; interactive?: boolean; children: ReactNode }) {
  const anchor = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const position = useFloatingPosition(Boolean(active), anchor, panel);
  return <span ref={anchor}>
    {active && createPortal(
      <div ref={panel} data-chart-tooltip role="region" aria-label={t("common.details")} tabIndex={0} className={`viewport-chart-tooltip fixed z-[60] max-h-[calc(100dvh-2rem)] w-max max-w-[min(22rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain whitespace-normal font-[Poppins] text-white [overflow-wrap:anywhere] ${interactive ? "pointer-events-auto" : "pointer-events-none"}`} style={position}>
        {children}
      </div>, document.body,
    )}
  </span>;
}
