import { useRef } from "react";
import type { PracticeEvent } from "@/features/exercises/types";

/** Same limit as the API: enough for a 1024-row table filled cell by cell. */
const MAX_EVENTS = 3000;
const MAX_DURATION_MS = 24 * 60 * 60 * 1000;
const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

/**
 * Interaction log of the current attempt: events and time since the exercise was
 * loaded or since the previous recorded attempt. Capped like the API limits.
 */
export function useAttemptLog() {
  const startedAt = useRef(now());
  const events = useRef<PracticeEvent[]>([{ t: 0, action: "load" }]);
  const elapsed = () => Math.min(MAX_DURATION_MS, Math.max(0, Math.round(now() - startedAt.current)));
  return {
    record(event: Omit<PracticeEvent, "t">) {
      if (events.current.length < MAX_EVENTS) events.current.push({ t: elapsed(), ...event });
    },
    restart() {
      startedAt.current = now();
      events.current = [{ t: 0, action: "load" }];
    },
    snapshot() {
      return { events: events.current.slice(), durationMs: elapsed() };
    },
  };
}

/** Network or server failure: the browser may show local feedback, clearly not recorded. */
export function isOfflineError(error: unknown): boolean {
  const status = (error as { response?: { status?: number } }).response?.status;
  return status === undefined || status >= 500;
}
