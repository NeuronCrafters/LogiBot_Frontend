import { useEffect, useRef, useState } from "react";
import { api } from "@/shared/api/httpClient";

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
