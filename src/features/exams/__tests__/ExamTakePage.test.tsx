import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { chooseLanguage } from "@/i18n";
import { examsApi } from "@/features/exams/api/examsApi";
import { ExamTakePage } from "@/features/exams/pages/ExamTakePage";
import type { ExamAttempt } from "@/features/exams/types";

globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
vi.mock("@/features/exams/api/examsApi", () => ({ examsApi: { getAttempt: vi.fn(), start: vi.fn(), saveDraft: vi.fn(), submit: vi.fn() } }));
vi.mock("@/shared/lib/toast", () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));
const api = vi.mocked(examsApi);

const now = new Date();
const inProgress = (deadlineInMs: number | null = null): ExamAttempt => ({
  examId: "e1", title: "Prova 1", instructions: "Leia com calma.", status: "in_progress", startedAt: now.toISOString(),
  deadlineAt: deadlineInMs === null ? null : new Date(+now + deadlineInMs).toISOString(), serverNow: now.toISOString(),
  closesAt: null, timeLimitMinutes: 30, lastSavedAt: null, answers: {},
  questions: [
    { id: "q1", type: "quiz", statement: "Quanto é 2 + 2?", language: "pt-BR", weight: 1, content: { options: ["3", "4"] } },
    { id: "q2", type: "essay", statement: "Explique o condicional.", language: "pt-BR", weight: 2, content: {} },
  ],
});

const renderPage = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter initialEntries={["/exams/e1"]}><Routes><Route path="/exams/:id" element={<ExamTakePage />} /></Routes></MemoryRouter>
  </QueryClientProvider>,
);

beforeEach(() => {
  chooseLanguage("pt-BR");
  Object.values(api).forEach((fn) => fn.mockReset());
  api.saveDraft.mockResolvedValue({ savedAt: new Date().toISOString(), deadlineAt: null, serverNow: new Date().toISOString() });
  api.submit.mockResolvedValue({ examId: "e1", title: "Prova 1", status: "submitted", submittedAt: new Date().toISOString(), submitReason: "student" });
});

describe("ExamTakePage", () => {
  it("shows the rules before starting and starts on request", async () => {
    api.getAttempt.mockResolvedValue({ examId: "e1", title: "Prova 1", instructions: null, status: "not_started", state: "open", opensAt: null, closesAt: null, timeLimitMinutes: 30, questionCount: 2, serverNow: now.toISOString() });
    api.start.mockResolvedValue(inProgress());
    renderPage();
    expect(await screen.findByText("Você terá 30 minutos a partir do momento em que começar.")).toBeInTheDocument();
    expect(screen.getByText("Não há correção nem dicas durante a prova.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Começar prova" }));
    expect(await screen.findByRole("article", { name: /Questão 1 de 2/ })).toBeInTheDocument();
  });

  it("saves answers automatically and marks answered questions in the navigation", async () => {
    api.getAttempt.mockResolvedValue(inProgress());
    renderPage();
    expect(await screen.findByRole("button", { name: "Questão 1, sem resposta" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "4" }));
    expect(screen.getByRole("button", { name: "Questão 1, respondida" })).toBeInTheDocument();
    await waitFor(() => expect(api.saveDraft).toHaveBeenCalledWith("e1", { q1: { choice: 1 } }, expect.objectContaining({ q1: [expect.objectContaining({ action: "choose" })] })), { timeout: 3000 });
    expect(await screen.findByText(/^Salvo às/)).toBeInTheDocument();
  });

  it("warns about anonymous grading in essays and never shows marks", async () => {
    api.getAttempt.mockResolvedValue(inProgress());
    renderPage();
    const essay = await screen.findByLabelText("Sua resposta");
    expect(essay).toHaveAccessibleDescription(expect.stringContaining("Não se identifique na resposta"));
    fireEvent.change(essay, { target: { value: "Se p então q." } });
    expect(screen.getByText("13 de 10000 caracteres")).toBeInTheDocument();
    expect(screen.queryByText(/correta|incorreta/)).toBeNull();
  });

  it("confirms before submitting and tells how many questions are blank", async () => {
    api.getAttempt.mockResolvedValue(inProgress());
    renderPage();
    fireEvent.click(await screen.findByRole("radio", { name: "4" }));
    fireEvent.click(screen.getByRole("button", { name: "Enviar prova" }));
    const dialog = screen.getByRole("dialog", { name: "Enviar a prova?" });
    expect(dialog).toHaveTextContent("Questões sem resposta: 1.");
    fireEvent.click(within(dialog).getByRole("button", { name: "Enviar" }));
    expect(await screen.findByRole("heading", { name: "Prova enviada" })).toBeInTheDocument();
    expect(api.submit).toHaveBeenCalledWith("e1", { q1: { choice: 1 } }, expect.anything());
  });

  it("warns near the end and submits automatically when time is up", async () => {
    api.getAttempt.mockResolvedValue(inProgress(4 * 60000));
    renderPage();
    expect(await screen.findByRole("timer")).toHaveTextContent(/Tempo restante: 0[34]:/);
    expect(await screen.findByText("Restam 5 minutos de prova.")).toBeInTheDocument();
  });

  it("submits on its own when the deadline has already passed", async () => {
    api.getAttempt.mockResolvedValue(inProgress(-1000));
    api.submit.mockResolvedValue({ examId: "e1", title: "Prova 1", status: "submitted", submittedAt: new Date().toISOString(), submitReason: "time_limit" });
    renderPage();
    expect(await screen.findByText("Enviada automaticamente ao fim do tempo, com o que estava salvo.")).toBeInTheDocument();
  });

  it("switches to the submitted screen when the server says time is up while saving", async () => {
    api.getAttempt.mockResolvedValueOnce(inProgress()).mockResolvedValueOnce({ examId: "e1", title: "Prova 1", status: "submitted", submittedAt: new Date().toISOString(), submitReason: "exam_closed" });
    api.saveDraft.mockRejectedValue({ response: { status: 409, data: { code: "exams.timeUp" } } });
    renderPage();
    fireEvent.click(await screen.findByRole("radio", { name: "3" }));
    expect(await screen.findByText("Enviada automaticamente no encerramento da prova, com o que estava salvo.", {}, { timeout: 4000 })).toBeInTheDocument();
  });

  it("shows the released grade, the outcome of each question and the comments", async () => {
    api.getAttempt.mockResolvedValue({
      examId: "e1", title: "Prova 1", status: "released", grade: 8.75, submittedAt: now.toISOString(), submitReason: "student", totalWeight: 4,
      questions: [
        { position: 1, type: "quiz", statement: "Quanto é 2 + 2?", language: "pt-BR", weight: 1, outcome: "correct", points: 1, comment: "" },
        { position: 2, type: "essay", statement: "Explique.", language: "pt-BR", weight: 2, outcome: "partial", points: 1, comment: "Faltou o exemplo." },
      ],
    });
    renderPage();
    expect(await screen.findByText("Sua nota: 8,75 de 10")).toBeInTheDocument();
    const essay = screen.getByRole("article", { name: "Questão 2" });
    expect(essay).toHaveTextContent("Parcialmente correta");
    expect(essay).toHaveTextContent("1 de 2 pontos");
    expect(essay).toHaveTextContent("Faltou o exemplo.");
  });
});
