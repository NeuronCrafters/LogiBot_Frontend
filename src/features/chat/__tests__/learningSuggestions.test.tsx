import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { chooseLanguage } from "@/i18n";
import type { StudentQuizItem } from "@/features/quiz/types";
import { studentQuizApi } from "@/features/quiz/api/quizApi";
import { chatApi } from "../api/chatApi";
import { getConversationTopic, getImmediateFollowUps, pickPracticeQuiz } from "../lib/learningSuggestions";
import { ChatFollowUpSuggestions } from "../components/ChatFollowUpSuggestions";
import { ChatQuizPracticeInvitation } from "../components/ChatQuizPracticeInvitation";
import { MarkdownMessageBubble } from "../components/MarkdownMessageBubble";

beforeEach(() => { chooseLanguage("pt-BR"); sessionStorage.clear(); });
const quiz = (overrides: Partial<StudentQuizItem> = {}): StudentQuizItem => ({
  id: "quiz", title: "Variáveis na prática", topic: "variaveis", description: null,
  disciplineId: "discipline", disciplineName: "Lógica", questionCount: 3, status: "published", createdAt: "2026-11-14", attempted: false,
  ...overrides,
});
function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>;
}

it.each([
  ["O que é uma variável?", "variaveis"],
  ["How do functions work?", "funcoes"],
  ["¿Cómo recorrer listas?", "listas"],
  ["Como combinar operadores lógicos?", "operadores_logicos"],
  ["Como funciona if/else?", "condicionais"],
] as const)("recognizes the subject of %s", (question, topic) => {
  expect(getConversationTopic([question])).toBe(topic);
});

it("uses the latest explicit topic and inherits context only for a related follow-up", () => {
  expect(getConversationTopic(["Como usar variáveis?", "Como criar uma função?"])).toBe("funcoes");
  expect(getConversationTopic(["Como usar variáveis?", "Ainda não entendi. Pode mostrar outro exemplo?"])).toBe("variaveis");
  expect(getConversationTopic(["Como usar variáveis?", "Não entendi SQL, pode explicar?"])).toBeNull();
  expect(getConversationTopic(["Como usar variáveis?", "Olá!"])).toBeNull();
});

it("offers only nonempty published quizzes of the current subject and prefers new practice", () => {
  const questions = ["Como usar variáveis?"];
  const available = [quiz({ id: "draft", status: "draft" }), quiz({ id: "empty", questionCount: 0 }), quiz({ id: "functions", topic: "funcoes" }), quiz({ id: "answered", attempted: true }), quiz({ id: "new" })];
  expect(pickPracticeQuiz(available, questions)?.id).toBe("new");
  expect(pickPracticeQuiz(available.slice(0, 3), questions)).toBeNull();
  expect(pickPracticeQuiz([], questions)).toBeNull();
});

it("produces localized next questions immediately without repeating a question already asked", () => {
  const questions = ["O que é uma variável?", "Qual a diferença entre variável e constante?"];
  const result = getImmediateFollowUps(questions, "pt-BR");
  expect(result).toHaveLength(3);
  expect(result).not.toContain(questions[1]);
  expect(getImmediateFollowUps(["How do functions work?"], "en-US")[0]).toContain("parameters");
});

it("matches free-form subjects from actual published quizzes, including attempted vector quizzes", () => {
  const available = [
    quiz({ id: "python", topic: "linguagem Python", title: "Quiz de linguagem Python" }),
    quiz({ id: "vectors", topic: "Vetores, Matrizes e Arrays", title: "Vetores, Matrizes e Arrays – Quiz de Conceitos", attempted: true, bestScore: 0, bestTotalQuestions: 5 }),
    quiz({ id: "loops", topic: "Estruturas de Repetição", title: "Quiz Estruturas de Repetição" }),
  ];
  expect(pickPracticeQuiz(available, ["Como usar vetores?"])?.id).toBe("vectors");
  expect(pickPracticeQuiz(available, ["Como percorrer um array?"])?.id).toBe("vectors");
  expect(pickPracticeQuiz(available, ["Como usar laços?"])?.id).toBe("loops");
  expect(pickPracticeQuiz(available, ["Como funciona Python?"])?.id).toBe("python");
  expect(pickPracticeQuiz(available, ["Como funciona SQL?"])).toBeNull();
});

it("shows Continue exploring while the suggestion request is still pending and keeps clicked targets stable", async () => {
  let finish!: (value: string[]) => void;
  vi.spyOn(chatApi, "getFollowUps").mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const onSelect = vi.fn();
  render(<ChatFollowUpSuggestions sessionId="s" messageId="m" questions={["Como usar variáveis?"]} onSelect={onSelect} />, { wrapper });
  const button = screen.getByRole("button", { name: "Como funcionam os tipos de dados?" });
  expect(button).toBeVisible();
  fireEvent.focus(button);
  await act(async () => finish(["Sugestão refinada"]));
  expect(button).toBeVisible();
  fireEvent.click(button);
  expect(onSelect).toHaveBeenCalledWith("Como funcionam os tipos de dados?");
});

it("retains immediate suggestions when the refinement request fails", async () => {
  vi.spyOn(chatApi, "getFollowUps").mockRejectedValue(new Error("offline"));
  render(<ChatFollowUpSuggestions sessionId="s" messageId="m" questions={["Como usar variáveis?"]} onSelect={vi.fn()} />, { wrapper });
  await waitFor(() => expect(chatApi.getFollowUps).toHaveBeenCalled());
  expect(screen.getByRole("button", { name: "Como funcionam os tipos de dados?" })).toBeVisible();
});

it("closes the editor on confirmation before the resend finishes, and restores the draft on rejection", async () => {
  let reject!: (error: Error) => void;
  const onEdit = vi.fn(() => new Promise<void>((_resolve, fail) => { reject = fail; }));
  render(<MarkdownMessageBubble sender="user" text="Pergunta original" onEdit={onEdit} />);
  fireEvent.click(screen.getByRole("button", { name: "Editar mensagem" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Editar mensagem" }), { target: { value: "Pergunta corrigida" } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar e reenviar" }));
  expect(screen.queryByRole("textbox", { name: "Editar mensagem" })).toBeNull();
  expect(onEdit).toHaveBeenCalledWith("Pergunta corrigida");
  await act(async () => reject(new Error("rejected")));
  expect(screen.getByRole("textbox", { name: "Editar mensagem" })).toHaveValue("Pergunta corrigida");
  expect(screen.getByRole("alert")).toBeVisible();
});

it("encourages practice with an available matching quiz and remembers an optional dismissal", async () => {
  vi.spyOn(studentQuizApi, "getHub").mockResolvedValue([quiz()]);
  const props = { userId: "student", sessionId: "session", questions: ["Como usar variáveis?"] };
  const view = render(<ChatQuizPracticeInvitation {...props} />, { wrapper });
  const link = await screen.findByRole("link", { name: "Praticar no quiz" });
  expect(link).toHaveAttribute("href", "/quiz/quiz");
  expect(screen.getByText(/Cada tentativa ajuda a aprender/)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Agora não" }));
  expect(screen.queryByRole("link", { name: "Praticar no quiz" })).toBeNull();
  view.unmount();
  render(<ChatQuizPracticeInvitation {...props} />, { wrapper });
  await waitFor(() => expect(studentQuizApi.getHub).toHaveBeenCalledTimes(2));
  expect(screen.queryByRole("link", { name: "Praticar no quiz" })).toBeNull();
});

it("does not offer unrelated quizzes", async () => {
  vi.spyOn(studentQuizApi, "getHub").mockResolvedValue([quiz({ topic: "funcoes" })]);
  render(<ChatQuizPracticeInvitation userId="student" sessionId="session" questions={["Como usar variáveis?"]} />, { wrapper });
  await waitFor(() => expect(studentQuizApi.getHub).toHaveBeenCalled());
  expect(screen.queryByRole("link", { name: "Praticar no quiz" })).toBeNull();
});
