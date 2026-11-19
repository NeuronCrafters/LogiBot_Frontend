import { useEffect, useRef, type KeyboardEvent, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Eraser } from "lucide-react";
import { t } from "@/i18n";
import { cn } from "@/shared/lib/cn";
import { useFloatingPosition } from "@/shared/hooks/useFloatingPosition";
import { truthValueLabel, truthValueSpoken, valueFromKey } from "@/features/exercises/lib/logicLabels";

const CHOICES = [true, false, null] as const;

interface TruthValuePickerProps {
  id: string;
  anchor: RefObject<HTMLElement>;
  label: string;
  value: boolean | undefined;
  /** `null` leaves the cell empty. */
  onChoose: (value: boolean | null) => void;
  /** Called when the picker is dismissed without a choice; `restoreFocus` is false when focus already moved elsewhere. */
  onDismiss: (restoreFocus: boolean) => void;
}

/**
 * Small floating choice (V, F, empty) anchored to a truth-table cell. It is portalled
 * to the body, so opening it never changes the table layout.
 */
export function TruthValuePicker({ id, anchor, label, value, onChoose, onDismiss }: TruthValuePickerProps) {
  const panel = useRef<HTMLDivElement>(null);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const position = useFloatingPosition(true, anchor, panel);

  // Focus starts on the value the cell had when the picker opened (or V when empty).
  // It starts hidden until positioned (hidden elements cannot take focus).
  const initialValue = useRef(value);
  const focused = useRef(false);
  useEffect(() => {
    if (focused.current || position.visibility !== "visible") return;
    focused.current = true;
    buttons.current[initialValue.current === false ? 1 : 0]?.focus();
  }, [position.visibility]);

  // Clicking anywhere else dismisses it; the anchor handles its own toggle.
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panel.current?.contains(target) || anchor.current?.contains(target)) return;
      onDismiss(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [anchor, onDismiss]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onDismiss(true);
      return;
    }
    if (event.key === "Tab") {
      onDismiss(false);
      return;
    }
    const direct = valueFromKey(event.key);
    if (direct === true || direct === false) {
      event.preventDefault();
      onChoose(direct);
      return;
    }
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const current = buttons.current.indexOf(document.activeElement as HTMLButtonElement);
    buttons.current[(current + step + CHOICES.length) % CHOICES.length]?.focus();
  }

  return createPortal(
    <div
      ref={panel}
      id={id}
      role="group"
      aria-label={label}
      onKeyDown={onKeyDown}
      style={{ position: "fixed", left: position.left, top: position.top, visibility: position.visibility }}
      className="truth-picker z-50 flex items-center gap-1 rounded-xl border border-white/15 bg-surface-raised p-1.5 shadow-xl shadow-black/30"
    >
      {CHOICES.map((choice, index) => {
        const pressed = choice === null ? value === undefined : value === choice;
        return (
          <button
            key={String(choice)}
            ref={(element) => { buttons.current[index] = element; }}
            type="button"
            aria-pressed={pressed}
            aria-label={choice === null ? t("exercises.truthTable.clearCell") : `${truthValueLabel(choice)} (${truthValueSpoken(choice)})`}
            onClick={() => onChoose(choice)}
            className={cn(
              "inline-flex h-11 min-w-[2.75rem] items-center justify-center rounded-lg border px-2 font-mono font-semibold transition-colors",
              pressed ? "border-blue-400/40 bg-blue-600 text-on-accent" : "border-control bg-neutral-950/60 text-white hover:bg-white/10",
            )}
          >
            {choice === null ? <Eraser aria-hidden="true" className="h-4 w-4" /> : <span aria-hidden="true">{truthValueLabel(choice)}</span>}
          </button>
        );
      })}
    </div>,
    document.body,
  );
}
