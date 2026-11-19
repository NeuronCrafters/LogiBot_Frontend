import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeAll, beforeEach, expect, it, vi } from "vitest";
import { chooseLanguage } from "@/i18n";
import { chatFeedbackApi } from "@/features/chat/api/chatFeedbackApi";
import { AnswerFeedback } from "@/features/chat/components/AnswerFeedback";

vi.mock("@/features/chat/api/chatFeedbackApi", async (original) => ({
  ...(await original<typeof import("@/features/chat/api/chatFeedbackApi")>()),
  chatFeedbackApi: { listSession: vi.fn(), save: vi.fn(), summary: vi.fn() },
}));
const api = vi.mocked(chatFeedbackApi);
const MESSAGE = "20000000-0000-4000-8000-000000000001";
let stored: Awaited<ReturnType<typeof chatFeedbackApi.listSession>> = [];

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});
beforeEach(() => {
  chooseLanguage("pt-BR");
  vi.clearAllMocks();
  // Behaves like the server: what was saved is what the next load returns.
  stored = [];
  api.listSession.mockImplementation(async () => stored);
  api.save.mockImplementation(async (messageId, body) => {
    const saved = { messageId, rating: body.rating, reason: body.reason ?? null, comment: body.comment ?? null };
    stored = [saved];
    return saved;
  });
});

const setup = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <AnswerFeedback sessionId="s1" messageId={MESSAGE} />
  </QueryClientProvider>,
);

it("stores yes at once and locks the rating", async () => {
  setup();
  const group = screen.getByRole("group", { name: "Esta resposta ajudou?" });
  expect(within(group).getAllByRole("button").map((button) => button.textContent)).toEqual(["Sim", "Mais ou menos", "Não"]);
  fireEvent.click(within(group).getByRole("button", { name: "Sim" }));
  await waitFor(() => expect(api.save).toHaveBeenCalledWith(MESSAGE, { rating: "up" }));
  await waitFor(() => expect(within(group).getByRole("button", { name: "Sim" })).toHaveAttribute("aria-pressed", "true"));
  for (const button of within(group).getAllByRole("button")) expect(button).toBeDisabled();
  expect(group).toHaveTextContent("Avaliação registrada");
  expect(screen.getByRole("status")).toHaveTextContent("Obrigado! Sua avaliação foi registrada.");
});

it("sends more or less only with the details and never twice", async () => {
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Mais ou menos" }));
  expect(api.save).not.toHaveBeenCalled();
  fireEvent.click(await screen.findByRole("radio", { name: "Incompleta" }));
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "  Faltou um exemplo.  " } });
  expect(screen.getByRole("textbox")).toHaveAccessibleDescription(expect.stringContaining("Não inclua dados pessoais"));
  const send = screen.getByRole("button", { name: "Enviar avaliação" });
  expect(send).toHaveAccessibleDescription("Depois de enviada, a avaliação não pode ser alterada.");
  fireEvent.click(send);
  await waitFor(() => expect(api.save).toHaveBeenCalledWith(MESSAGE, { rating: "partial", reason: "incomplete", comment: "Faltou um exemplo." }));
  await waitFor(() => expect(screen.queryByRole("textbox")).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole("button", { name: "Não" }));
  expect(api.save).toHaveBeenCalledTimes(1);
});

it("cancelling the details stores nothing", async () => {
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Não" }));
  fireEvent.click(await screen.findByRole("button", { name: "Cancelar" }));
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Não" })).toHaveAttribute("aria-pressed", "false");
  expect(api.save).not.toHaveBeenCalled();
});

it("shows a stored rating as final", async () => {
  stored = [{ messageId: MESSAGE, rating: "down", reason: null, comment: null }];
  setup();
  const no = screen.getByRole("button", { name: "Não" });
  await waitFor(() => expect(no).toHaveAttribute("aria-pressed", "true"));
  expect(no).toBeDisabled();
  expect(screen.getByRole("button", { name: "Sim" })).toBeDisabled();
});

it("keeps the answer open when saving fails", async () => {
  api.save.mockRejectedValue({ response: { status: 500, data: { message: "Falhou" } } });
  setup();
  const yes = screen.getByRole("button", { name: "Sim" });
  fireEvent.click(yes);
  await waitFor(() => expect(api.save).toHaveBeenCalled());
  await waitFor(() => expect(yes).not.toBeDisabled());
  expect(yes).toHaveAttribute("aria-pressed", "false");
});
