import { useEffect, useRef } from "react";
import { useModalScrollLock } from "./useModalScrollLock";

export function useDialogFocus<T extends HTMLElement>(open: boolean, onClose?: () => void) {
  const ref = useRef<T>(null);
  useModalScrollLock(open, ref);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const root = ref.current;
    if (!open || !root) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () => Array.from(root.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]')).filter(element => !element.closest('[aria-hidden="true"]'));
    focusable()[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !root.querySelector('[aria-expanded="true"][aria-haspopup="listbox"]')) { event.stopPropagation(); close.current?.(); }
      if (event.key !== "Tab") return;
      const items = focusable();
      const first = items[0], last = items.at(-1);
      if (!first) { event.preventDefault(); root.focus(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    root.addEventListener("keydown", keydown);
    return () => { root.removeEventListener("keydown", keydown); if (previous?.isConnected) previous.focus(); };
  }, [open]);
  return ref;
}
