import { beforeEach, expect, it, vi } from "vitest";
import { api } from "@/shared/api/httpClient";
import { notificationsApi } from "@/features/notifications/api/notificationsApi";

vi.mock("@/shared/api/httpClient", () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));
beforeEach(() => vi.mocked(api.get).mockReset());

it("treats an unexpected payload as an empty list", async () => {
  vi.mocked(api.get).mockResolvedValue({ data: [] });
  await expect(notificationsApi.list()).resolves.toEqual({ items: [], unreadCount: 0 });
});

it("keeps a valid payload", async () => {
  const data = { items: [{ id: "n" }], unreadCount: 1 };
  vi.mocked(api.get).mockResolvedValue({ data });
  await expect(notificationsApi.list()).resolves.toEqual(data);
});
