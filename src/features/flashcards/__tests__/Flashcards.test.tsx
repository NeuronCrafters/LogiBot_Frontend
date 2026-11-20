import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { chooseLanguage } from "@/i18n";
import { AuthContext, type AuthContextData } from "@/app/providers/AuthContext";
import { flashcardsApi } from "@/features/flashcards/api/flashcardsApi";
import { FlashcardsPage } from "@/features/flashcards/pages/FlashcardsPage";
import { FlashcardStudyPage } from "@/features/flashcards/pages/FlashcardStudyPage";
import { FlashcardEditorPage } from "@/features/flashcards/pages/FlashcardEditorPage";

vi.mock("@/features/flashcards/api/flashcardsApi", () => ({
  flashcardsApi: { decks: vi.fn(), deck: vi.fn(), save: vi.fn(), remove: vi.fn(), candidates: vi.fn(), study: vi.fn(), session: vi.fn(), review: vi.fn() },
}));
vi.mock("@/features/questions/hooks/useManagedDisciplines", () => ({
  useManagedDisciplines: () => ({ disciplines: [{ id: "d1", name: "Lógica" }], isLoading: false }),
}));
const api = vi.mocked(flashcardsApi);

const renderAt = (path: string, role: string[], routes: Array<[string, JSX.Element]>) => render(
  <AuthContext.Provider value={{ user: { role } } as unknown as AuthContextData}>
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>{routes.map(([route, element]) => <Route key={route} path={route} element={element} />)}<Route path="*" element={<p>outra página</p>} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>
  </AuthContext.Provider>,
);

beforeEach(() => {
  chooseLanguage("pt-BR");
  vi.clearAllMocks();
});

it("lists the student's decks with what is due and what is mastered", async () => {
  api.study.mockResolvedValue([{ id: "k1", title: "Conectivos", description: "Revisão", language: "pt-BR", disciplineName: "Lógica", cards: 10, due: 3, known: 4, seen: 6 }]);
  renderAt("/flashcards", ["student"], [["/flashcards", <FlashcardsPage />]]);
  const deck = await screen.findByRole("article", { name: "Conectivos" });
  expect(deck).toHaveTextContent("3 para revisar hoje");
  expect(within(deck).getByRole("img", { name: "4 de 10 cartões dominados" })).toBeInTheDocument();
  expect(within(deck).getByRole("link", { name: "Estudar: Conectivos" })).toHaveAttribute("href", "/flashcards/k1");
});

it("sends staff to the management side", async () => {
  renderAt("/flashcards", ["professor"], [["/flashcards", <FlashcardsPage />]]);
  expect(await screen.findByText("outra página")).toBeInTheDocument();
  expect(api.study).not.toHaveBeenCalled();
});

it("flips each card and records the answer, also by keyboard, then sums up the round", async () => {
  api.session.mockResolvedValue({
    deck: { id: "k1", title: "Conectivos", language: "pt-BR" }, ahead: false, total: 2, due: 2,
    cards: [{ id: "c1", front: "p ∧ q", back: "Verdadeiro só se ambos forem", concept: "conjunction", box: 0 }, { id: "c2", front: "¬p", back: "Inverte p", concept: null, box: 1 }],
  });
  api.review.mockResolvedValue({ box: 2, dueAt: "2026-11-20T00:00:00Z" });
  renderAt("/flashcards/k1", ["student"], [["/flashcards/:deckId", <FlashcardStudyPage />]]);
  expect(await screen.findByText("Cartão 1 de 2")).toBeInTheDocument();
  const question = screen.getByRole("heading", { name: "p ∧ q", level: 2 });
  expect(question.closest("section")).not.toHaveAttribute("aria-hidden");
  expect(screen.queryByRole("button", { name: /Acertei/ })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Mostrar resposta" }));
  expect(question.closest("section")).toHaveAttribute("aria-hidden", "true");
  expect(screen.getByText("Resposta: Verdadeiro só se ambos forem")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Acertei/ }));
  await waitFor(() => expect(api.review).toHaveBeenCalledWith("c1", "good"));

  expect(await screen.findByText("Cartão 2 de 2")).toBeInTheDocument();
  fireEvent.keyDown(window, { key: " " });
  fireEvent.keyDown(window, { key: "1" });
  await waitFor(() => expect(api.review).toHaveBeenCalledWith("c2", "again"));
  const summary = await screen.findByRole("region", { name: "Rodada concluída" });
  expect(summary).toHaveTextContent("Errei: 1");
  expect(summary).toHaveTextContent("Acertei: 1");
});

it("builds a deck, brings bank questions as cards and shows the fields the server refuses", async () => {
  api.candidates.mockResolvedValue([{ id: "q1", front: "O que é negação?", back: "Inverte o valor", concept: "negation" }]);
  api.save.mockRejectedValue({ response: { data: { issues: [{ field: "title", code: "REQUIRED" }, { field: "cards.1.back", code: "TOO_LONG", params: { max: 1000 } }] } } });
  renderAt("/flashcards/manage/new", ["professor"], [["/flashcards/manage/new", <FlashcardEditorPage />]]);
  await waitFor(() => expect(screen.getByLabelText("Disciplina")).toHaveValue("d1"));
  fireEvent.change(screen.getByRole("textbox", { name: "Frente (pergunta)" }), { target: { value: "p ∨ q" } });
  fireEvent.change(screen.getByRole("textbox", { name: "Verso (resposta)" }), { target: { value: "Falso só se os dois forem falsos" } });

  fireEvent.click(screen.getByRole("button", { name: "Trazer do Banco de questões" }));
  const dialog = await screen.findByRole("dialog");
  fireEvent.click(await within(dialog).findByRole("checkbox", { name: /O que é negação/ }));
  fireEvent.click(within(dialog).getByRole("button", { name: "Adicionar (1)" }));
  expect(await screen.findByRole("group", { name: "Cartão 2" })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
  await waitFor(() => expect(api.save).toHaveBeenCalledWith(null, expect.objectContaining({
    disciplineId: "d1", cards: [{ front: "p ∨ q", back: "Falso só se os dois forem falsos", concept: null }, { front: "O que é negação?", back: "Inverte o valor", concept: "negation", sourceQuestionId: "q1" }],
  })));
  expect(await screen.findByRole("textbox", { name: "Título" })).toHaveAttribute("aria-invalid", "true");
  const backTwo = within(screen.getByRole("group", { name: "Cartão 2" })).getByRole("textbox", { name: "Verso (resposta)" });
  expect(backTwo).toHaveAccessibleDescription("Use no máximo 1000 caracteres.");
});
