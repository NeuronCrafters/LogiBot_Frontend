import type { ReactNode } from "react";
import { OptionalMark } from "@/shared/components/forms/OptionalMark";
import { cn } from "@/shared/lib/cn";

export const fieldClass =
  "w-full min-w-0 rounded-xl border border-control bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-blue-500/60 aria-[invalid=true]:border-red-400";

/**
 * Labelled field used by the institution and profile forms: optional fields carry the platform's
 * asterisk, the hint and the error are linked to the input for screen readers.
 */
export function TextField({ id, label, value, onChange, optional = false, hint, error, multiline = false, maxLength, type = "text", autoComplete, inputMode, readOnly = false, children }: {
  id: string; label: string; value: string; onChange?: (value: string) => void; optional?: boolean; hint?: string; error?: string;
  multiline?: boolean; maxLength?: number; type?: string; autoComplete?: string; inputMode?: "text" | "tel" | "url" | "email" | "decimal" | "numeric"; readOnly?: boolean;
  /** Replaces the input (e.g. a select) while keeping the label, hint and error. */
  children?: ReactNode;
}) {
  const describedBy = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
  const common = { id, value, readOnly, maxLength, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy };
  return (
    <div className="grid min-w-0 gap-1.5 font-[Poppins]">
      <label htmlFor={id} className="text-sm font-medium text-zinc-200">
        {label}{optional && <OptionalMark />}
      </label>
      {children ?? (multiline ? (
        <textarea {...common} rows={4} onChange={(event) => onChange?.(event.target.value)} className={cn(fieldClass, "min-h-[6rem] resize-y py-2")} />
      ) : (
        <input {...common} type={type} autoComplete={autoComplete} inputMode={inputMode} onChange={(event) => onChange?.(event.target.value)}
          className={cn(fieldClass, "h-11", readOnly && "opacity-75")} />
      ))}
      {hint && <p id={`${id}-hint`} className="text-xs text-zinc-400">{hint}</p>}
      {error && <p id={`${id}-error`} className="text-xs font-medium text-red-300">{error}</p>}
    </div>
  );
}
