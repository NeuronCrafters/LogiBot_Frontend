import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
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

type DropdownRect = { top: number; left: number; width: number };

export function Select({
  value,
  onChange,
  options,
  placeholder = "Selecione...",
  className,
  disabled = false,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DropdownRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value);

  const updateRect = useCallback(() => {
    if (!buttonRef.current) return;
    const r = buttonRef.current.getBoundingClientRect();
    setRect({ top: r.bottom + 4, left: r.left, width: r.width });
  }, []);

  const handleOpen = () => {
    if (disabled) return;
    updateRect();
    setOpen((o) => !o);
  };

  // Recalculate on scroll/resize so the dropdown tracks the button
  useEffect(() => {
    if (!open) return;
    const onScroll = () => updateRect();
    const onResize = () => updateRect();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, updateRect]);

  // Click outside — check both the button and the portal dropdown
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      )
        return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const items =
          dropdownRef.current?.querySelectorAll<HTMLLIElement>("[data-option]");
        if (!items?.length) return;
        const arr = Array.from(items);
        const focused =
          dropdownRef.current?.querySelector<HTMLLIElement>(
            "[data-option]:focus",
          );
        const idx = focused ? arr.indexOf(focused) : -1;
        const next =
          e.key === "ArrowDown"
            ? arr[Math.min(idx + 1, arr.length - 1)]
            : arr[Math.max(idx - 1, 0)];
        next?.focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  // Scroll selected option into view when opening
  useEffect(() => {
    if (open && selected && dropdownRef.current) {
      const el = dropdownRef.current.querySelector<HTMLLIElement>(
        `[data-value="${selected.value}"]`,
      );
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [open, selected]);

  const dropdown =
    open && rect
      ? createPortal(
          <ul
            ref={dropdownRef}
            role="listbox"
            style={{
              position: "fixed",
              top: rect.top,
              left: rect.left,
              width: rect.width,
              zIndex: 9999,
            }}
            className="max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-neutral-900 py-1 shadow-xl shadow-black/40"
          >
            {placeholder && (
              <li
                data-option
                data-value=""
                tabIndex={0}
                role="option"
                aria-selected={value === ""}
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                onKeyDown={(e) =>
                  e.key === "Enter" && (onChange(""), setOpen(false))
                }
                className={cn(
                  "flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm font-[Poppins] outline-none transition-colors focus:bg-white/5",
                  value === ""
                    ? "text-white"
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300",
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
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (onChange(opt.value), setOpen(false))
                  }
                  className={cn(
                    "flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm font-[Poppins] outline-none transition-colors focus:bg-white/5",
                    isSelected
                      ? "bg-blue-500/10 text-blue-200"
                      : "text-zinc-300 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <span className="flex-1 truncate">{opt.label}</span>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                  )}
                </li>
              );
            })}
            {options.length === 0 && (
              <li className="px-3 py-2.5 text-sm font-[Poppins] text-zinc-600">
                Nenhuma opção disponível.
              </li>
            )}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div className={cn("relative w-full", className)}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={handleOpen}
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

      {dropdown}
    </div>
  );
}
