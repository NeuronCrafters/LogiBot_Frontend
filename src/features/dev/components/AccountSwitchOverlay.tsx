import { useEffect, useState } from "react";
import { FlaskConical } from "lucide-react";
import { useAccountSwitchMessage } from "@/features/dev/hooks/accountSwitch";

/** Soft veil while the account changes; fades in and out (instant with reduced motion). */
export function AccountSwitchOverlay() {
  const message = useAccountSwitchMessage();
  const [shown, setShown] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (message) {
      setShown(message);
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    setVisible(false);
    const timer = window.setTimeout(() => setShown(null), 220);
    return () => window.clearTimeout(timer);
  }, [message]);
  if (!shown) return null;
  return (
    <div data-account-switch aria-busy="true" className={`account-switch fixed inset-0 z-[80] flex items-center justify-center bg-neutral-950/70 backdrop-blur-sm ${visible ? "opacity-100" : "opacity-0"}`}>
      <div role="status" aria-live="polite" className="flex items-center gap-3 rounded-2xl border border-white/10 bg-surface px-5 py-4 font-[Poppins] text-sm font-medium text-white shadow-2xl shadow-black/40">
        <FlaskConical aria-hidden="true" className="h-5 w-5 text-amber-300" />
        <span>{shown}</span>
        <span aria-hidden="true" className="ml-1 h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white motion-reduce:animate-none" />
      </div>
    </div>
  );
}
