import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { chooseLanguage } from "@/i18n";
import { rankingApi, type RankingData, type RankingScopes } from "@/features/ranking/api/rankingApi";
import { RankingPage } from "@/features/ranking/pages/RankingPage";

vi.mock("@/features/ranking/api/rankingApi", async (original) => ({
  ...(await original<typeof import("@/features/ranking/api/rankingApi")>()),
  rankingApi: { scopes: vi.fn(), ranking: vi.fn(), settings: vi.fn(), saveSettings: vi.fn(), clearSettings: vi.fn() },
}));
const api = vi.mocked(rankingApi);

const scopes: RankingScopes = {
  allowed: true, level: "coordinator", institutions: [],
  courses: [{ id: "c1", name: "Informática", institutionId: "i1" }],
  classes: [{ id: "k1", name: "A", courseId: "c1", courseName: "Informática", institutionId: "i1" }],
};
const board: RankingData = {
  scope: "course", id: "c1", name: "Informática", since: "2026-10-20T12:00:00Z", minGroupSize: 5, groupLevel: "class", hiddenGroups: 1,
  rules: { periodDays: 30, weights: { practice: 10, quiz: 5, exam: 10, flashcards: 0 }, studentNames: false },
  viewer: { level: "coordinator", canConfigure: false },
  groups: [{ id: "k1", name: "A", students: 5, averagePoints: 23.8, position: 1 }],
  students: [
    { position: 1, name: "Ana", className: "A", points: 80, me: false, breakdown: { practice: 0, quiz: 0, exam: 80, flashcards: 0 } },
    { position: 2, name: "Bruno", className: "A", points: 20, me: false, breakdown: { practice: 20, quiz: 0, exam: 0, flashcards: 0 } },
  ],
};
const renderPage = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><RankingPage /></MemoryRouter></QueryClientProvider>,
);

beforeEach(() => { chooseLanguage("pt-BR"); vi.clearAllMocks(); });

it("shows the rules, the classes compared by average and the students with what each activity gave", async () => {
  api.scopes.mockResolvedValue(scopes);
  api.ranking.mockResolvedValue(board);
  renderPage();
  expect(await screen.findByText("Atividades dos últimos 30 dias (desde 20/10/2026).")).toBeInTheDocument();
  expect(api.ranking).toHaveBeenCalledWith("course", "c1");
  expect(screen.getByText("Cada flash card dominado: 0 pontos")).toBeInTheDocument();
  const classes = screen.getByRole("table", { name: "Turmas de Informática" });
  expect(within(classes).getAllByRole("row")[1]).toHaveTextContent("1ºA523,8");
  expect(screen.getByText("1 grupo(s) com menos de 5 alunos fora da comparação.")).toBeInTheDocument();
  const students = screen.getByRole("table", { name: "Alunos · Informática" });
  // Activities worth 0 points are not columns.
  expect(within(students).getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual(["Posição", "Aluno", "Turma", "Bancada", "Quizzes", "Provas", "Pontos"]);
  expect(within(students).getByRole("row", { name: /Ana/ })).toHaveTextContent("1º");
  fireEvent.change(screen.getByLabelText("Seleção"), { target: { value: "class:k1" } });
  await waitFor(() => expect(api.ranking).toHaveBeenCalledWith("class", "k1"));
});

it("shows students only their own name and line when classmates' names are off", async () => {
  api.scopes.mockResolvedValue({ ...scopes, level: "student", courses: [] });
  api.ranking.mockResolvedValue({
    ...board, scope: "class", id: "k1", name: "A", groupLevel: null, groups: [], hiddenGroups: 0, viewer: { level: "student", canConfigure: false },
    students: [{ position: 1, name: null, className: "A", points: 80, me: false }, { position: 2, name: "Bruno", className: "A", points: 20, me: true, breakdown: { practice: 20, quiz: 0, exam: 0, flashcards: 0 } }],
  });
  renderPage();
  const students = await screen.findByRole("table", { name: "Alunos · A" });
  expect(within(students).getByRole("row", { name: /Colega/ })).toHaveTextContent("—");
  expect(within(students).getByRole("row", { name: /Bruno/ })).toHaveTextContent("Você");
  expect(screen.getByText("Os nomes dos colegas não são mostrados.")).toBeInTheDocument();
});

it("tells the profile when the ranking is not released for it", async () => {
  api.scopes.mockResolvedValue({ ...scopes, allowed: false, courses: [], classes: [] });
  renderPage();
  expect(await screen.findByText("Ranking indisponível")).toBeInTheDocument();
  expect(api.ranking).not.toHaveBeenCalled();
});

it("lets the owner change the rules for the platform", async () => {
  api.scopes.mockResolvedValue({ ...scopes, level: "admin", institutions: [{ id: "i1", name: "Instituto" }] });
  api.ranking.mockResolvedValue({ ...board, viewer: { level: "admin", canConfigure: true } });
  const effective = { periodDays: 30, weights: { practice: 10, quiz: 5, exam: 10, flashcards: 2 }, visibleTo: { student: false, professor: true, coordinator: true, admin: true }, studentNames: false };
  api.settings.mockResolvedValue({ defaults: effective, global: null, institution: null, effective, periods: [7, 30, 90, 180, 365] });
  api.saveSettings.mockResolvedValue({ defaults: effective, global: null, institution: null, effective, periods: [7, 30] });
  renderPage();
  fireEvent.click(await screen.findByText("Regras do ranking"));
  fireEvent.change(await screen.findByLabelText("Período"), { target: { value: "7" } });
  fireEvent.change(screen.getByRole("spinbutton", { name: "Quizzes" }), { target: { value: "8" } });
  fireEvent.click(screen.getByRole("checkbox", { name: "Alunos (só a própria turma)" }));
  fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
  await waitFor(() => expect(api.saveSettings).toHaveBeenCalledWith("global", "", expect.objectContaining({ periodDays: 7, weights: expect.objectContaining({ quiz: 8 }), visibleTo: expect.objectContaining({ student: true }) })));
});
