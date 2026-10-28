import { t, useLocale } from "@/i18n";
﻿import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { subscribeToToast, resolveToastMessage, type ToastEvent, type ToastType } from "@/shared/lib/toast";

const translateDismiss = () => t("common.dismiss");
const DURATION = 3500;

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />,
  error:   <XCircle    className="h-4 w-4 text-red-400   shrink-0" />,
  warn:    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />,
  info:    <Info       className="h-4 w-4 text-blue-400  shrink-0" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  useLocale();
  const [toasts, setToasts] = useState<ToastEvent[]>([]);

  useEffect(() => {
    return subscribeToToast((event) => {
      setToasts(prev => [...prev, event]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== event.id));
      }, DURATION);
    });
  }, []);

  const dismiss = (id: string) =>
    setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <>
      {children}
      {createPortal(
        <div className="fixed right-4 top-4 z-[9999] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 pointer-events-none sm:right-6 sm:top-6">
          <>
            {toasts.map(t => (
              <div
                key={t.id}
                className="pointer-events-auto flex items-center gap-3 rounded-lg bg-[#333] px-4 py-3 text-sm text-white shadow-lg"
              >
                {ICONS[t.type]}
                <span className="flex-1 font-[Poppins] leading-snug">{resolveToastMessage(t.message)}</span>
                <button
                  aria-label={translateDismiss()}
                  onClick={() => dismiss(t.id)}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </>
        </div>,
        document.body
      )}
    </>
  );
}
