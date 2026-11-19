import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { chooseLanguage } from "@/i18n";
import { examsApi } from "@/features/exams/api/examsApi";
import { questionBankApi } from "@/features/questions/api/questionBankApi";
import { ExamEditorPage } from "@/features/exams/pages/ExamEditorPage";

vi.mock("@/features/exams/api/examsApi", () => ({ examsApi: { create: vi.fn(), update: vi.fn(), getManaged: vi.fn() } }));
vi.mock("@/features/questions/api/questionBankApi", () => ({ questionBankApi: { list: vi.fn() } }));
vi.mock("@/features/questions/hooks/useManagedDisciplines", () => ({ useManagedDisciplines: () => ({ disciplines: [{ id: "d1", name: "Lógica" }], isLoading: false }) }));
vi.mock("@/features/exams/hooks/useDisciplineClasses", () => ({ useDisciplineClasses: () => [{ id: "c1", name: "Turma A" }] }));
vi.mock("@/shared/lib/toast", () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));

const question = (id: string, statement: string) => ({ id, statement, type: "quiz", weight: 1, language: "pt-BR", disciplineId: "d1" });
beforeEach(() => {
  chooseLanguage("pt-BR");
  vi.mocked(questionBankApi.list).mockResolvedValue([question("a", "Primeira"), question("b", "Segunda")] as never);
  vi.mocked(examsApi.create).mockReset();
});
const renderEditor = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter initialEntries={["/exams/manage/new"]}><Routes><Route path="/exams/manage/new" element={<ExamEditorPage />} /><Route path="/exams/manage/:id" element={<p>detalhe</p>} /></Routes></MemoryRouter>
  </QueryClientProvider>,
);

it("orders the chosen bank questions and sends the draft", async () => {
  vi.mocked(examsApi.create).mockResolvedValue({ id: "e1" } as never);
  renderEditor();
  fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Prova 1" } });
  fireEvent.click(await screen.findByRole("checkbox", { name: /Primeira/ }));
  fireEvent.click(screen.getByRole("checkbox", { name: /Segunda/ }));
  fireEvent.click(screen.getByRole("button", { name: "Subir questão 2" }));
  fireEvent.change(screen.getByLabelText(/^Limite de tempo em minutos/, { selector: "input, textarea, select" }), { target: { value: "45" } });
  fireEvent.click(screen.getByRole("checkbox", { name: "Embaralhar a ordem das questões para cada aluno" }));
  fireEvent.click(screen.getByRole("button", { name: "Salvar rascunho" }));
  await waitFor(() => expect(examsApi.create).toHaveBeenCalledWith(expect.objectContaining({
    title: "Prova 1", disciplineId: "d1", classId: null, shuffle: true, timeLimitMinutes: 45, questionIds: ["b", "a"],
  })));
  expect(await screen.findByText("detalhe")).toBeInTheDocument();
});

it("marks the fields the server rejects and focuses the first one", async () => {
  vi.mocked(examsApi.create).mockRejectedValue({ response: { status: 400, data: { code: "exams.invalid", issues: [
    { field: "title", code: "REQUIRED", params: {} }, { field: "closesAt", code: "WINDOW_INVALID", params: {} },
  ] } } });
  renderEditor();
  fireEvent.click(screen.getByRole("button", { name: "Salvar rascunho" }));
  const title = screen.getByLabelText("Título");
  await waitFor(() => expect(title).toHaveFocus());
  expect(title).toHaveAccessibleDescription("Preencha este campo.");
  expect(screen.getByLabelText(/^Fecha em/, { selector: "input, textarea, select" })).toHaveAccessibleDescription(expect.stringContaining("O fechamento precisa ser depois da abertura."));
  expect(screen.getByRole("alert")).toHaveTextContent("Revise os campos marcados (2).");
});
