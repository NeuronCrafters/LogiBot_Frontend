import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { chooseLanguage } from "@/i18n";
import { questionBankApi } from "@/features/questions/api/questionBankApi";
import { professorQuizApi } from "@/features/quiz/api/quizApi";
import { QuestionBankPage } from "@/features/questions/pages/QuestionBankPage";

vi.mock("@/features/questions/api/questionBankApi", () => ({ questionBankApi: { list: vi.fn(), remove: vi.fn(), importQuiz: vi.fn() } }));
vi.mock("@/features/quiz/api/quizApi", () => ({ professorQuizApi: { getMyQuizzes: vi.fn() } }));
vi.mock("@/features/questions/hooks/useManagedDisciplines", () => ({ useManagedDisciplines: () => ({ disciplines: [{ id: "d1", name: "Lógica" }], isLoading: false }) }));
vi.mock("@/shared/lib/toast", () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));

const question = {
  id: "q1", ownerId: "u", disciplineId: "d1", disciplineName: "Lógica", version: 2, sourceQuizQuestionId: "s1", createdAt: "", updatedAt: "",
  type: "truth_table", statement: "Monte a tabela de p → q.", weight: 1.5, subject: "operadores_logicos", concepts: ["conditional"], language: "pt-BR",
  content: { type: "truth_table", formula: "p → q" },
};

beforeEach(() => {
  chooseLanguage("pt-BR");
  vi.mocked(questionBankApi.list).mockReset().mockResolvedValue([question] as never);
  vi.mocked(questionBankApi.remove).mockReset().mockResolvedValue();
  vi.mocked(questionBankApi.importQuiz).mockReset().mockResolvedValue({ imported: 2, skipped: 1, invalid: 0 });
  vi.mocked(professorQuizApi.getMyQuizzes).mockReset().mockResolvedValue([{ id: "quiz1", title: "Quiz 1", disciplineName: "Lógica" }] as never);
});

const renderPage = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter><QuestionBankPage /></MemoryRouter>
  </QueryClientProvider>,
);

it("lists questions with type, metadata and labelled actions", async () => {
  renderPage();
  const card = await screen.findByRole("article", { name: "Monte a tabela de p → q." });
  expect(within(card).getByText("Tabela-verdade")).toBeInTheDocument();
  expect(within(card).getByText("Importada de quiz")).toBeInTheDocument();
  expect(within(card).getByText(/Peso 1,5 · Versão 2 · Operadores Lógicos · condicional/i)).toBeInTheDocument();
  expect(within(card).getByRole("link", { name: "Editar questão: Monte a tabela de p → q." })).toHaveAttribute("href", "/questions/q1/edit");
});

it("filters by type", async () => {
  renderPage();
  await screen.findByRole("article");
  fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "parsons" } });
  await waitFor(() => expect(questionBankApi.list).toHaveBeenLastCalledWith({ disciplineId: "", type: "parsons" }));
});

it("asks before removing", async () => {
  renderPage();
  fireEvent.click(await screen.findByRole("button", { name: "Remover questão: Monte a tabela de p → q." }));
  const dialog = screen.getByRole("dialog", { name: "Remover questão do banco?" });
  fireEvent.click(within(dialog).getByRole("button", { name: "Remover" }));
  await waitFor(() => expect(questionBankApi.remove).toHaveBeenCalledWith("q1"));
});

it("imports a quiz chosen in the dialog", async () => {
  renderPage();
  fireEvent.click(screen.getByRole("button", { name: "Importar de um quiz" }));
  const dialog = screen.getByRole("dialog", { name: "Importar questões de um quiz" });
  await within(dialog).findByRole("option", { name: "Quiz 1 (Lógica)" });
  fireEvent.change(within(dialog).getByLabelText("Quiz"), { target: { value: "quiz1" } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Importar" }));
  await waitFor(() => expect(questionBankApi.importQuiz).toHaveBeenCalledWith("quiz1"));
});

it("shows an empty state", async () => {
  vi.mocked(questionBankApi.list).mockResolvedValue([]);
  renderPage();
  expect(await screen.findByText("Nenhuma questão por aqui.")).toBeInTheDocument();
});
