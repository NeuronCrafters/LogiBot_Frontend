import { useCallback, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";

/** Message shown while switching between the owner's account and a test account (null when idle). */
let message: string | null = null;
const listeners = new Set<() => void>();
const set = (next: string | null) => { message = next; listeners.forEach((listener) => listener()); };

export function useAccountSwitchMessage() {
  return useSyncExternalStore((listener) => { listeners.add(listener); return () => listeners.delete(listener); }, () => message, () => null);
}

/**
 * Switches account without reloading the page: the server swaps the session, cached data of the
 * previous account is dropped, the session is read again and the router moves on, so the usual
 * page transition plays instead of a blank reload.
 */
export function useAccountSwitch() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { getUser } = useAuth();
  return useCallback(async (label: string, action: () => Promise<unknown>, destination: string) => {
    set(label);
    try {
      await action();
      queryClient.clear();
      await getUser();
      navigate(destination, { replace: true });
    } finally {
      // Let the new page paint before the veil fades out.
      requestAnimationFrame(() => requestAnimationFrame(() => set(null)));
    }
  }, [queryClient, navigate, getUser]);
}
