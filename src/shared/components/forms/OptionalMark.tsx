import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Asterisk, X } from "lucide-react";
import { t, useLocale } from "@/i18n";
import { useFloatingPosition } from "@/shared/hooks/useFloatingPosition";

/**
 * Asterisk placed inside a field label to mark it as optional. Hovering shows
 * the explanation and clicking pins it (same panel as the chart information).
 * Its accessible name is "(optional)", so the field is still announced as
 * optional by screen readers.
 */
export function OptionalMark() {
  useLocale();
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hovered || pinned;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const leaveTimer = useRef<number>();
  const panelId = useId();
  const position = useFloatingPosition(open, triggerRef, panelRef);

  const enter = () => { window.clearTimeout(leaveTimer.current); setHovered(true); };
  // A short delay lets the pointer travel to the panel without closing it (WCAG 1.4.13).
  const leave = () => { leaveTimer.current = window.setTimeout(() => setHovered(false), 150); };
  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);

  const close = (returnFocus: boolean) => {
    setPinned(false);
    setHovered(false);
    if (returnFocus) triggerRef.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (!pinned || position.visibility !== "visible") return;
    let frame = 0;
    const focusWhenPainted = () => {
      const button = closeRef.current;
      if (!button) return;
      if (getComputedStyle(button).visibility === "visible") button.focus({ preventScroll: true });
      else frame = requestAnimationFrame(focusWhenPainted);
    };
    frame = requestAnimationFrame(focusWhenPainted);
    return () => cancelAnimationFrame(frame);
  }, [pinned, position.visibility]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: Event) => {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !triggerRef.current?.contains(target)) close(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      close(pinned);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    document.addEventListener("keydown", escape, true);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
      document.removeEventListener("keydown", escape, true);
    };
  }, [open, pinned]);

  return (
    <>
      {" "}
      <button
        ref={triggerRef}
        type="button"
        data-optional-mark
        aria-expanded={pinned}
        aria-controls={pinned ? panelId : undefined}
        aria-haspopup="dialog"
        onClick={(event) => { event.preventDefault(); if (pinned) close(false); else setPinned(true); }}
        onMouseEnter={enter}
        onMouseLeave={leave}
        className="inline-flex h-6 min-w-6 items-center justify-center rounded-md align-middle font-semibold text-blue-300 transition-colors hover:bg-white/10 hover:text-blue-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"
      >
        <Asterisk className="h-3.5 w-3.5" strokeWidth={2.75} aria-hidden="true" />
        <span className="sr-only">{t("common.optionalMark")}</span>
      </button>
      {open && createPortal(
        <div
          ref={panelRef}
          id={panelId}
          role={pinned ? "dialog" : "tooltip"}
          aria-label={t("common.optionalFieldTitle")}
          style={position}
          onMouseEnter={enter}
          onMouseLeave={leave}
          className="fixed z-[70] w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-white/10 bg-surface-sunken p-4 font-[Poppins] text-white shadow-2xl shadow-black/60 [overflow-wrap:anywhere]"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{t("common.optionalFieldTitle")}</span>
            {pinned && (
              <button
                ref={closeRef}
                type="button"
                aria-label={t("common.fechar")}
                onClick={() => close(true)}
                className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
          <p className="text-xs font-normal normal-case leading-relaxed tracking-normal text-zinc-400">{t("common.optionalFieldInfo")}</p>
        </div>,
        document.body,
      )}
    </>
  );
}
