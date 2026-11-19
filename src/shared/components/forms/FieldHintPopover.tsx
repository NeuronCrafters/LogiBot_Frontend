import { useRef, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useFloatingPosition } from "@/shared/hooks/useFloatingPosition";

/**
 * Floating explanation shown while a field has focus (same panel as the chart
 * information). It is visual only: the field must also reference the same text
 * through aria-describedby, so screen readers get it without the panel.
 * It never captures the pointer, so it does not block the fields below it.
 */
export function FieldHintPopover({ anchor, open, title, text }: { anchor: RefObject<HTMLElement>; open: boolean; title: string; text: string }) {
  const panel = useRef<HTMLDivElement>(null);
  const position = useFloatingPosition(open, anchor, panel);
  if (!open) return null;
  return createPortal(
    <div
      ref={panel}
      aria-hidden="true"
      data-field-hint
      style={position}
      className="pointer-events-none fixed z-[70] w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-white/10 bg-surface-sunken p-4 font-[Poppins] text-white shadow-2xl shadow-black/60 [overflow-wrap:anywhere]"
    >
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</span>
      <p className="text-xs leading-relaxed text-zinc-400">{text}</p>
    </div>,
    document.body,
  );
}
