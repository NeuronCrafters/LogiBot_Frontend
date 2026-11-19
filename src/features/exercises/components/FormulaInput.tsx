import { forwardRef, useId, useImperativeHandle, useMemo, useRef } from "react";
import { Delete, Eraser } from "lucide-react";
import { t, useLocale, type MessageKey } from "@/i18n";
import { cn } from "@/shared/lib/cn";
import { checkFormula } from "@/shared/logic/logicCore";
import type { PracticeEvent } from "@/features/exercises/types";

const OPERATORS: Array<{ symbol: string; name: MessageKey }> = [
  { symbol: "¬", name: "exercises.concept.negation" },
  { symbol: "∧", name: "exercises.concept.conjunction" },
  { symbol: "∨", name: "exercises.concept.disjunction" },
  { symbol: "→", name: "exercises.concept.conditional" },
  { symbol: "↔", name: "exercises.concept.biconditional" },
  { symbol: "(", name: "exercises.translation.openParen" },
  { symbol: ")", name: "exercises.translation.closeParen" },
];
const BINARY = ["∧", "∨", "→", "↔"];
const keyClass = "inline-flex h-11 min-w-[2.75rem] items-center justify-center rounded-lg border border-control bg-neutral-950/60 px-3 font-mono text-base font-semibold text-white transition-colors hover:bg-white/10";

interface FormulaInputProps {
  legend: Array<{ letter: string; text: string }>;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  /** Extra ids for aria-describedby (e.g. an error message). */
  describedBy?: string;
  onEvent?: (event: Omit<PracticeEvent, "t">) => void;
}

/**
 * Formula field with a symbol keypad, shared by the workbench and exams. Keys insert
 * at the last caret position without focusing the field, so phones do not pop up
 * the virtual keyboard on every tap.
 */
export const FormulaInput = forwardRef<HTMLInputElement, FormulaInputProps>(function FormulaInput(
  { legend, value, onChange, invalid, describedBy, onEvent },
  ref,
) {
  useLocale();
  const baseId = useId();
  const input = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => input.current as HTMLInputElement, []);
  const caret = useRef({ start: value.length, end: value.length });
  const letters = useMemo(() => legend.map((entry) => entry.letter), [legend]);
  const preview = useMemo(() => {
    const check = checkFormula(value, { allowedPropositions: letters });
    return check.ok ? check.normalized : null;
  }, [value, letters]);

  function rememberCaret() {
    const element = input.current;
    if (element) caret.current = { start: element.selectionStart ?? element.value.length, end: element.selectionEnd ?? element.value.length };
  }

  function insert(symbol: string) {
    const text = BINARY.indexOf(symbol) !== -1 ? ` ${symbol} ` : symbol;
    const start = Math.min(caret.current.start, value.length);
    const end = Math.min(Math.max(caret.current.end, start), value.length);
    caret.current = { start: start + text.length, end: start + text.length };
    onChange(value.slice(0, start) + text + value.slice(end));
    onEvent?.({ action: "insert", text: symbol, via: "button" });
  }

  function backspace() {
    const next = value.replace(/\s*\S\s*$/, "");
    caret.current = { start: next.length, end: next.length };
    onChange(next);
    onEvent?.({ action: "edit", text: next, via: "button" });
  }

  function clear() {
    caret.current = { start: 0, end: 0 };
    onChange("");
    onEvent?.({ action: "clear" });
  }

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={baseId + "-input"} className="mb-1.5 block font-[Poppins] text-sm font-medium text-zinc-300">
          {t("exercises.translation.answerLabel")}
        </label>
        <div className="flex h-12 items-center rounded-xl border border-control bg-neutral-950/60 px-3 transition-colors focus-within:border-blue-500/60">
          <input
            ref={input}
            id={baseId + "-input"}
            value={value}
            onChange={(event) => { onChange(event.target.value); rememberCaret(); onEvent?.({ action: "edit", text: event.target.value, via: "keyboard" }); }}
            onSelect={rememberCaret}
            onKeyUp={rememberCaret}
            onClick={rememberCaret}
            placeholder={t("exercises.translation.answerPlaceholder")}
            aria-invalid={invalid ? true : undefined}
            aria-describedby={[baseId + "-preview", describedBy].filter(Boolean).join(" ")}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="h-full min-w-0 flex-1 bg-transparent font-mono text-base text-white outline-none placeholder:text-zinc-600"
          />
        </div>
        <p id={baseId + "-preview"} className="mt-1.5 min-h-[1.25rem] break-words font-mono text-sm text-zinc-400">
          {preview ? t("exercises.translation.preview", { formula: preview }) : ""}
        </p>
      </div>

      <div role="group" aria-label={t("exercises.translation.keypadLabel")} className="flex flex-wrap gap-2">
        {legend.map((entry) => (
          <button key={entry.letter} type="button" className={keyClass} onClick={() => insert(entry.letter)}
            aria-label={t("exercises.translation.insertProposition", { letter: entry.letter, text: entry.text })}>
            {entry.letter}
          </button>
        ))}
        {OPERATORS.map((operator) => (
          <button key={operator.symbol} type="button" className={keyClass} onClick={() => insert(operator.symbol)}
            aria-label={t("exercises.translation.insertSymbol", { symbol: operator.symbol, name: t(operator.name) })}>
            {operator.symbol}
          </button>
        ))}
        <button type="button" className={keyClass} onClick={backspace} aria-label={t("exercises.translation.backspace")}>
          <Delete aria-hidden="true" className="h-5 w-5" />
        </button>
        <button type="button" className={cn(keyClass, "gap-2 font-[Poppins] text-sm")} onClick={clear}>
          <Eraser aria-hidden="true" className="h-4 w-4" />
          {t("exercises.translation.clear")}
        </button>
      </div>
    </div>
  );
});
