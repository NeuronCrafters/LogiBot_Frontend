import { createPortal } from "react-dom";
import { t, useLocale } from "@/i18n";
import { useDialogFocus } from "@/shared/hooks/useDialogFocus";

/** Warning shown before the session expires (idle or absolute limit). */
export function SessionWarning({ kind, pending, error, onContinue, onSignOut }: {
  kind: "idle" | "absolute" | null; pending: boolean; error: boolean;
  onContinue: () => void; onSignOut: () => void;
}) {
  useLocale();
  const dialog = useDialogFocus<HTMLDivElement>(!!kind, undefined, true);
  if (!kind) return null;
  return createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-4">
    <div ref={dialog} role="alertdialog" aria-modal="true" aria-labelledby="session-warning-title" aria-describedby="session-warning-description" tabIndex={-1}
      className="my-auto flex max-h-[calc(100dvh-2rem)] min-w-0 w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface text-white shadow-xl">
      <h2 id="session-warning-title" className="shrink-0 break-words border-b border-white/10 px-4 py-4 text-lg font-semibold">{t("auth.sessionWarningTitle")}</h2>
      <div className="min-h-0 overflow-y-auto px-4 pb-4">
      <p id="session-warning-description" className="mt-3 text-base leading-relaxed text-zinc-400">{t(kind === "absolute" ? "auth.sessionAbsoluteWarning" : "auth.sessionIdleWarning")}</p>
      {error && <p role="status" className="mt-3 text-sm text-zinc-400">{t("auth.sessionConnectionError")}</p>}
      <div className="mt-5 flex flex-wrap gap-3">
        {kind === "idle" && <button type="button" disabled={pending} onClick={onContinue} className="min-h-11 min-w-0 max-w-full rounded-lg bg-blue-600 [overflow-wrap:anywhere] px-4 py-2 text-base font-semibold text-on-accent disabled:opacity-60">{t("auth.sessionContinue")}</button>}
        <button type="button" disabled={pending} onClick={onSignOut} className="min-h-11 min-w-0 max-w-full rounded-lg border border-control [overflow-wrap:anywhere] px-4 py-2 text-base">{t("auth.sessionSignIn")}</button>
      </div>
      </div>
    </div>
  </div>, document.body);
}
