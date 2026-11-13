import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "@/shared/api/httpClient";
import { t, useLocale } from "@/i18n";
import { useDialogFocus } from "@/shared/hooks/useDialogFocus";

export interface ServerSession {
  id: string; serverNow: string; idleExpiresAt: string; expiresAt: string;
  heartbeatSeconds: number; warningSeconds: number;
}

export function useServerSession(session: ServerSession | null, update: (value: ServerSession) => void, expire: () => void) {
  const [warning, setWarning] = useState<"idle" | "absolute" | null>(null);
  const [connectionError, setConnectionError] = useState(false);
  const [pending, setPending] = useState(false);
  const ref = useRef(session);
  const warned = useRef(warning);
  const request = useRef(false);
  const offset = useRef(0);
  ref.current = session;
  warned.current = warning;

  useEffect(() => {
    if (session) offset.current = Date.parse(session.serverNow) - Date.now();
  }, [session]);

  useEffect(() => {
    if (!session?.id) { setWarning(null); return; }
    const key = `logibot.activity.${session.id}`;
    let lastEvent = 0, lastSent = Date.now(), acknowledged = 0, lastStorageWrite = 0;
    let cancelled = false;
    const activity = (event: Event) => {
      if (!event.isTrusted || warned.current || document.visibilityState !== "visible") return;
      lastEvent = Date.now();
      if (lastEvent - lastStorageWrite >= 1000) {
        try { localStorage.setItem(key, String(lastEvent)); } catch { /* restricted storage */ }
        lastStorageWrite = lastEvent;
      }
    };
    const poll = async (forceCheck = false) => {
      const current = ref.current;
      if (!current || cancelled || request.current) return;
      const now = Date.now() + offset.current;
      const idle = Date.parse(current.idleExpiresAt), absolute = Date.parse(current.expiresAt);
      const deadline = Math.min(idle, absolute);
      if (now >= deadline) { expire(); return; }
      setWarning(deadline - now <= current.warningSeconds * 1000 ? (absolute <= idle ? "absolute" : "idle") : null);
      if (document.visibilityState !== "visible" || (!forceCheck && Date.now() - lastSent < current.heartbeatSeconds * 1000)) return;
      let shared = 0;
      try { shared = Number(localStorage.getItem(key) || 0); } catch { /* restricted storage */ }
      const latestEvent = Math.max(lastEvent, shared);
      const active = !warned.current && latestEvent > acknowledged && Date.now() - latestEvent <= 60000 && latestEvent <= Date.now();
      request.current = true;
      lastSent = Date.now();
      try {
        const response = active
          ? await api.post<ServerSession>("/auth/activity", {})
          : await api.get<ServerSession>("/auth/session-status");
        if (!cancelled && response.data.id === current.id) {
          if (active) acknowledged = latestEvent;
          update(response.data);
          setConnectionError(false);
        }
      } catch { if (!cancelled) setConnectionError(true); }
      finally { request.current = false; }
    };
    const events = ["pointerdown", "pointermove", "keydown", "input", "touchstart", "scroll", "wheel"];
    events.forEach(event => window.addEventListener(event, activity, { passive: true, capture: true }));
    const resume = () => { if (document.visibilityState === "visible") void poll(true); };
    window.addEventListener("focus", resume);
    document.addEventListener("visibilitychange", resume);
    const timer = window.setInterval(() => { void poll(); }, 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
      events.forEach(event => window.removeEventListener(event, activity, true));
      window.removeEventListener("focus", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [session?.id, update, expire]);

  const continueSession = async () => {
    if (request.current) return;
    request.current = true;
    setPending(true);
    try {
      const response = await api.post<ServerSession>("/auth/activity", {});
      if (response.data.id === ref.current?.id) { update(response.data); setWarning(null); setConnectionError(false); }
    } catch { setConnectionError(true); }
    finally { request.current = false; setPending(false); }
  };
  return { warning, connectionError, pending, continueSession };
}

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
