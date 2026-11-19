import { api } from "@/shared/api/httpClient";
import type { NotificationList, NotificationPreferences } from "@/features/notifications/types";

/** Tolerates unexpected payloads (e.g. an older API) as an empty list. */
function normalizeList(data: unknown): NotificationList {
  const value = data as Partial<NotificationList> | null;
  return {
    items: Array.isArray(value?.items) ? value!.items : [],
    unreadCount: typeof value?.unreadCount === "number" ? value.unreadCount : 0,
  };
}

export const notificationsApi = {
  async list(): Promise<NotificationList> {
    const res = await api.get("/notifications", { params: { limit: 30 }, withCredentials: true });
    return normalizeList(res.data);
  },
  async markRead(id: string): Promise<void> {
    await api.post(`/notifications/${encodeURIComponent(id)}/read`, undefined, { withCredentials: true });
  },
  async markAllRead(): Promise<void> {
    await api.post("/notifications/read-all", undefined, { withCredentials: true });
  },
  async getPreferences(): Promise<NotificationPreferences> {
    const res = await api.get("/notifications/preferences", { withCredentials: true });
    return { emailEnabled: res.data?.emailEnabled === true };
  },
  async setPreferences(preferences: NotificationPreferences): Promise<NotificationPreferences> {
    const res = await api.put("/notifications/preferences", preferences, { withCredentials: true });
    return { emailEnabled: res.data?.emailEnabled === true };
  },
};
