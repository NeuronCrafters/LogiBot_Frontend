import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { chooseLanguage } from "@/i18n";
import { notificationsApi } from "@/features/notifications/api/notificationsApi";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import type { NotificationList } from "@/features/notifications/types";

globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;

vi.mock("@/features/notifications/api/notificationsApi", () => ({
  notificationsApi: { list: vi.fn(), markRead: vi.fn(), markAllRead: vi.fn(), getPreferences: vi.fn(), setPreferences: vi.fn() },
}));
const api = vi.mocked(notificationsApi);

const sample = (): NotificationList => ({
  unreadCount: 2,
  items: [
    { id: "n1", type: "quiz_published", params: { quizTitle: "Laços", disciplineName: "Lógica" }, link: "/quiz/q1", readAt: null, createdAt: "2026-11-16T10:00:00Z", updatedAt: "2026-11-16T10:00:00Z" },
    { id: "n2", type: "quiz_completion_progress", params: { quizTitle: "Vetores", completed: 3, total: 10, lastStudentName: "Bia" }, link: "/quiz/manage", readAt: null, createdAt: "2026-11-15T10:00:00Z", updatedAt: "2026-11-15T10:00:00Z" },
    { id: "n3", type: "quiz_published", params: { quizTitle: "Antigo", disciplineName: "Lógica" }, link: null, readAt: "2026-11-01T10:00:00Z", createdAt: "2026-11-01T10:00:00Z", updatedAt: "2026-11-01T10:00:00Z" },
  ],
});

function Where() {
  return <output aria-label="path">{useLocation().pathname}</output>;
}
function renderBell() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/chat"]}>
        <NotificationBell />
        <Routes><Route path="*" element={<Where />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  chooseLanguage("pt-BR");
  Object.values(api).forEach((fn) => fn.mockReset());
  // Stateful like the real API, so refetches after a change keep it.
  let state = sample();
  const unreadCount = () => state.items.filter((item) => !item.readAt).length;
  api.list.mockImplementation(async () => ({ ...state, unreadCount: unreadCount() }));
  api.markRead.mockImplementation(async (id: string) => {
    state = { ...state, items: state.items.map((item) => (item.id === id ? { ...item, readAt: "2026-11-16T12:00:00Z" } : item)) };
  });
  api.markAllRead.mockImplementation(async () => {
    state = { ...state, items: state.items.map((item) => ({ ...item, readAt: item.readAt ?? "2026-11-16T12:00:00Z" })) };
  });
  api.getPreferences.mockResolvedValue({ emailEnabled: false });
  api.setPreferences.mockImplementation(async (value) => value);
});

describe("NotificationBell", () => {
  it("shows the unread count in the badge and in the accessible name", async () => {
    renderBell();
    const bell = await screen.findByRole("button", { name: "Notificações (2 não lidas)" });
    expect(bell).toHaveTextContent("2");
    expect(bell).toHaveAttribute("aria-expanded", "false");
  });

  it("lists notifications in a dialog and opens the linked page, marking it as read", async () => {
    renderBell();
    fireEvent.click(await screen.findByRole("button", { name: "Notificações (2 não lidas)" }));
    const dialog = screen.getByRole("dialog", { name: "Notificações" });
    expect(within(dialog).getByText("Novo quiz para a sua turma: “Laços” (Lógica).")).toBeInTheDocument();
    expect(within(dialog).getByText("3 de 10 alunos concluíram “Vetores”. Último: Bia.")).toBeInTheDocument();
    expect(within(dialog).getAllByText(", não lida", { exact: false })).toHaveLength(2);
    fireEvent.click(within(dialog).getByRole("link", { name: /Laços/ }));
    await waitFor(() => expect(api.markRead).toHaveBeenCalledWith("n1", expect.anything()));
    expect(screen.getByLabelText("path")).toHaveTextContent("/quiz/q1");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(await screen.findByRole("button", { name: "Notificações (1 não lidas)" })).toBeInTheDocument();
  });

  it("marks everything as read", async () => {
    renderBell();
    fireEvent.click(await screen.findByRole("button", { name: /Notificações \(2/ }));
    fireEvent.click(screen.getByRole("button", { name: "Marcar todas como lidas" }));
    await waitFor(() => expect(api.markAllRead).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByRole("button", { name: "Marcar todas como lidas" })).toBeDisabled());
    expect(await screen.findByRole("button", { name: "Notificações" })).toBeInTheDocument();
  });

  it("turns e-mail notifications on", async () => {
    renderBell();
    fireEvent.click(await screen.findByRole("button", { name: /Notificações \(2/ }));
    const toggle = await screen.findByRole("checkbox", { name: /Receber também por e-mail/ });
    await waitFor(() => expect(toggle).toBeEnabled());
    fireEvent.click(toggle);
    await waitFor(() => expect(api.setPreferences).toHaveBeenCalledWith({ emailEnabled: true }));
    await waitFor(() => expect(toggle).toBeChecked());
  });

  it("closes with Escape and returns focus to the bell", async () => {
    renderBell();
    const bell = await screen.findByRole("button", { name: /Notificações \(2/ });
    bell.focus();
    fireEvent.click(bell);
    const dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(bell).toHaveFocus());
  });

  it("shows an empty state and follows the interface language", async () => {
    api.list.mockResolvedValue({ items: [], unreadCount: 0 });
    renderBell();
    act(() => chooseLanguage("es-ES"));
    fireEvent.click(await screen.findByRole("button", { name: "Notificaciones" }));
    expect(screen.getByText("Todavía no hay notificaciones.")).toBeInTheDocument();
  });
});

describe("NotificationBell e-mail preference", () => {
  it("rolls back and explains when saving fails", async () => {
    api.setPreferences.mockRejectedValue(new Error("offline"));
    renderBell();
    fireEvent.click(await screen.findByRole("button", { name: /Notificações \(2/ }));
    const toggle = await screen.findByRole("checkbox", { name: /Receber também por e-mail/ });
    await waitFor(() => expect(toggle).toBeEnabled());
    fireEvent.click(toggle);
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível salvar a preferência.");
    expect(toggle).not.toBeChecked();
  });
});
