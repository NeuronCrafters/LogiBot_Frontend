import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { chooseLanguage } from "@/i18n";
import { examsApi } from "@/features/exams/api/examsApi";
import { BlindReviewPage } from "@/features/exams/pages/BlindReviewPage";
import type { BlindReview } from "@/features/exams/types";

vi.mock("@/features/exams/api/examsApi", () => ({ examsApi: { getBlindReview: vi.fn(), saveReview: vi.fn() } }));
const api = vi.mocked(examsApi);

const review = (released = false): BlindReview => ({
  examId: "e1", title: "Prova 1", released, reviewed: 1, total: 3,
  questions: [
    { examQuestionId: "eq1", position: 2, statement: "Explique o condicional.", language: "pt-BR", criteria: "Citar a tabela.", weight: 2,
      items: [{ id: "r1", code: "QK7M2", text: "Resposta A", score: null, comment: "" }, { id: "r2", code: "ZP4TX", text: "", score: 1, comment: "Boa" }] },
    { examQuestionId: "eq2", position: 3, statement: "Dê um exemplo.", language: "pt-BR", criteria: "", weight: 1,
      items: [{ id: "r3", code: "H8DNW", text: "Exemplo", score: null, comment: "" }] },
  ],
});
const renderPage = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter initialEntries={["/exams/manage/e1/review"]}><Routes><Route path="/exams/manage/:id/review" element={<BlindReviewPage />} /></Routes></MemoryRouter>
  </QueryClientProvider>,
);

beforeEach(() => {
  chooseLanguage("pt-BR");
  api.getBlindReview.mockReset().mockResolvedValue(review());
  api.saveReview.mockReset().mockImplementation(async (id, score, comment) => ({ id, code: "X", text: "", score, comment: comment.trim() }));
});

it("shows only the anonymous code, the answer, the criteria and the progress", async () => {
  renderPage();
  const card = await screen.findByRole("article", { name: "Resposta #QK7M2" });
  expect(within(card).getByText("Resposta A")).toBeInTheDocument();
  expect(screen.getByRole("article", { name: "Resposta #ZP4TX" })).toHaveTextContent("(resposta em branco)");
  expect(screen.getByText("Citar a tabela.")).toBeInTheDocument();
  expect(screen.getByRole("progressbar", { name: "1 de 3 respostas corrigidas" })).toHaveAttribute("aria-valuenow", "1");
});

it("saves a rubric score with a comment and updates the progress", async () => {
  renderPage();
  const card = await screen.findByRole("article", { name: "Resposta #QK7M2" });
  const save = within(card).getByRole("button", { name: "Salvar correção" });
  expect(save).toBeDisabled();
  fireEvent.click(within(card).getByRole("radio", { name: "Parcial (0,5)" }));
  fireEvent.change(within(card).getByLabelText(/^Comentário para o aluno/, { selector: "input, textarea, select" }), { target: { value: "  Faltou o exemplo. " } });
  fireEvent.click(save);
  await waitFor(() => expect(api.saveReview).toHaveBeenCalledWith("r1", 0.5, "  Faltou o exemplo. "));
  expect(await within(card).findByText("Correção salva.")).toBeInTheDocument();
  expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2");
});

it("goes to the next pending answer, across questions", async () => {
  api.getBlindReview.mockResolvedValue({ ...review(), reviewed: 2, questions: [{ ...review().questions[0], items: review().questions[0].items.map((item) => ({ ...item, score: 1 })) }, review().questions[1]] });
  renderPage();
  fireEvent.click(await screen.findByRole("button", { name: "Ir para a próxima pendente" }));
  await waitFor(() => expect(screen.getByRole("article", { name: "Resposta #H8DNW" })).toHaveFocus());
  expect(screen.getByRole("button", { name: "Questão 3 (0 de 1)" })).toHaveAttribute("aria-current", "true");
});

it("locks grading after release", async () => {
  api.getBlindReview.mockResolvedValue(review(true));
  renderPage();
  expect(await screen.findByText("Os resultados foram liberados: a correção está travada.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Salvar correção" })).toBeNull();
  screen.getAllByRole("radio").forEach((radio) => expect(radio).toBeDisabled());
});

it("moves focus to the next pending answer in the question already open", async () => {
  renderPage();
  fireEvent.click(await screen.findByRole("button", { name: "Ir para a próxima pendente" }));
  expect(screen.getByRole("article", { name: "Resposta #QK7M2" })).toHaveFocus();
});
