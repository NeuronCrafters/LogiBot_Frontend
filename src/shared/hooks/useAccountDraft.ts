import { useCallback, useEffect, useState, type SetStateAction } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";

// Tab-scoped, account-scoped drafts survive reauthentication, expire after a day,
// and are never restored into another account. Passwords are not stored here.
export function useAccountDraft<T>(name: string, initial: T) {
  const { user } = useAuth();
  const key = user?._id ? `logibot.draft.${user._id}.${name}` : null;
  const read = useCallback((): T => {
    if (!key) return initial;
    try {
      const raw = JSON.parse(sessionStorage.getItem(key) || "null");
      if (raw && Date.now() - raw.at < 86400000) return raw.value;
      sessionStorage.removeItem(key);
    } catch { /* unavailable or invalid storage */ }
    return initial;
  }, [key]); // initial is the empty fallback, not a dependency
  const [state, setState] = useState(() => ({ key, value: read() }));
  useEffect(() => { setState({ key, value: read() }); }, [key, read]);
  const value = state.key === key ? state.value : initial;
  const setValue = useCallback((next: SetStateAction<T>) => {
    setState(previous => {
      const old = previous.key === key ? previous.value : read();
      const value = typeof next === "function" ? (next as (old: T) => T)(old) : next;
      if (key) try { sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), value })); } catch { /* full storage */ }
      return { key, value };
    });
  }, [key, read]);
  const clear = useCallback(() => {
    if (key) try { sessionStorage.removeItem(key); } catch { /* restricted storage */ }
    setState({ key, value: initial });
  }, [key]);
  return [value, setValue, clear] as const;
}
