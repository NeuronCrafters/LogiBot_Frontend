import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/features/notifications/api/notificationsApi";
import type { NotificationList, NotificationPreferences } from "@/features/notifications/types";

const LIST_KEY = ["notifications"] as const;
const PREFERENCES_KEY = ["notifications", "preferences"] as const;
export const NOTIFICATIONS_REFRESH_MS = 60_000;

export function useNotifications() {
  const queryClient = useQueryClient();
  const list = useQuery({
    queryKey: LIST_KEY,
    queryFn: notificationsApi.list,
    refetchInterval: NOTIFICATIONS_REFRESH_MS,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
    retry: 1,
  });

  // Optimistic: the badge drops at once; the next refresh reconciles with the server.
  const markRead = useMutation({
    mutationFn: notificationsApi.markRead,
    onMutate: async (id: string) => {
      // A refresh already on its way would bring the old count back over the optimistic one.
      await queryClient.cancelQueries({ queryKey: LIST_KEY, exact: true });
      queryClient.setQueryData<NotificationList>(LIST_KEY, (current) => {
        if (!current) return current;
        const target = current.items.find((item) => item.id === id);
        if (!target || target.readAt) return current;
        const now = new Date().toISOString();
        return { items: current.items.map((item) => (item.id === id ? { ...item, readAt: now } : item)), unreadCount: Math.max(0, current.unreadCount - 1) };
      });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: LIST_KEY, exact: true }),
  });

  const markAllRead = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: LIST_KEY, exact: true });
      const now = new Date().toISOString();
      queryClient.setQueryData<NotificationList>(LIST_KEY, (current) =>
        current ? { items: current.items.map((item) => ({ ...item, readAt: item.readAt ?? now })), unreadCount: 0 } : current);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: LIST_KEY, exact: true }),
  });

  return { list, markRead, markAllRead };
}

export function useNotificationPreferences(enabled: boolean) {
  const queryClient = useQueryClient();
  const preferences = useQuery({ queryKey: PREFERENCES_KEY, queryFn: notificationsApi.getPreferences, enabled, retry: 1 });
  // Optimistic: the checkbox reflects the choice at once and rolls back if saving fails.
  const save = useMutation({
    mutationFn: (value: NotificationPreferences) => notificationsApi.setPreferences(value),
    onMutate: (value: NotificationPreferences) => {
      const previous = queryClient.getQueryData<NotificationPreferences>(PREFERENCES_KEY);
      queryClient.setQueryData(PREFERENCES_KEY, value);
      return { previous };
    },
    onError: (_error, _value, context) => queryClient.setQueryData(PREFERENCES_KEY, context?.previous),
    onSuccess: (value) => queryClient.setQueryData(PREFERENCES_KEY, value),
  });
  return { preferences, save };
}
