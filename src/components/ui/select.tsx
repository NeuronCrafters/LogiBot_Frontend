import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Selecione...",
  className,
  disabled = false,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const items = listRef.current?.querySelectorAll<HTMLLIElement>("[data-option]");
        if (!items?.length) return;
        const arr = Array.from(items);
        const focused = listRef.current?.querySelector<HTMLLIElement>("[data-option]:focus");
        const idx = focused ? arr.indexOf(focused) : -1;
        const next = e.key === "ArrowDown"
          ? arr[Math.min(idx + 1, arr.length - 1)]
          : arr[Math.max(idx - 1, 0)];
        next?.focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  useEffect(() => {
    if (open && selected && listRef.current) {
      const el = listRef.current.querySelector<HTMLLIElement>(`[data-value="${selected.value}"]`);
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [open, selected]);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-neutral-950/60 px-3 font-[Poppins] text-sm outline-none transition-colors",
          open ? "border-blue-500/60" : "hover:border-white/20",
          selected ? "text-white" : "text-zinc-600",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-neutral-900 py-1 shadow-xl shadow-black/40"
        >
          {placeholder && (
            <li
              data-option
              data-value=""
              tabIndex={0}
              role="option"
              aria-selected={value === ""}
              onClick={() => { onChange(""); setOpen(false); }}
              onKeyDown={(e) => e.key === "Enter" && (onChange(""), setOpen(false))}
              className={cn(
                "flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm font-[Poppins] outline-none transition-colors focus:bg-white/5",
                value === "" ? "text-white" : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300",
              )}
            >
              <span className="flex-1 truncate">{placeholder}</span>
            </li>
          )}
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li
                key={opt.value}
                data-option
                data-value={opt.value}
                tabIndex={0}
                role="option"
                aria-selected={isSelected}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                onKeyDown={(e) => e.key === "Enter" && (onChange(opt.value), setOpen(false))}
                className={cn(
                  "flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm font-[Poppins] outline-none transition-colors focus:bg-white/5",
                  isSelected
                    ? "bg-blue-500/10 text-blue-200"
                    : "text-zinc-300 hover:bg-white/5 hover:text-white",
                )}
              >
                <span className="flex-1 truncate">{opt.label}</span>
                {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-blue-400" />}
              </li>
            );
          })}
          {options.length === 0 && (
            <li className="px-3 py-2.5 text-sm font-[Poppins] text-zinc-600">
              Nenhuma opção disponível.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
