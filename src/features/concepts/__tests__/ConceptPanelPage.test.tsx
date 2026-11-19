import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import { chooseLanguage } from "@/i18n";
import { conceptsApi, type ProficiencyData } from "@/features/concepts/api/conceptsApi";
import { ConceptPanelPage } from "@/features/concepts/pages/ConceptPanelPage";
import { proficiencyCsv } from "@/features/concepts/lib/proficiencyExport";

vi.mock("@/features/concepts/api/conceptsApi", () => ({ conceptsApi: { scopes: vi.fn(), proficiency: vi.fn() } }));
const scopes = vi.mocked(conceptsApi.scopes);
const proficiency = vi.mocked(conceptsApi.proficiency);
const rate = (total: number, score: number | null) => ({ total, score });
const data = (score: number, students?: ProficiencyData["students"]): ProficiencyData => ({
  scope: "class", id: "c1", days: 90, minGroupSize: 5, aggregated: !students, hidden: students ? 0 : 1, students,
  concepts: [{ concept: "conditional", ...rate(20, score), students: 6, practice: rate(14, score), exam: rate(6, 0.5), trend: [{ week: "2026-11-02", ...rate(8, 0.5) }, { week: "2026-11-09", ...rate(12, 0.75) }] }],
});

const renderPage = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><ConceptPanelPage /></QueryClientProvider>);

beforeEach(() => {
  chooseLanguage("pt-BR");
  scopes.mockReset();
  proficiency.mockReset();
  scopes.mockResolvedValue({ me: false, all: false, institutions: [], courses: [], classes: [
    { id: "c1", name: "Turma A", courseId: "k", courseName: "Computação", institutionId: "i", teaches: true },
    { id: "c2", name: "Turma B", courseId: "k", courseName: "Computação", institutionId: "i", teaches: true },
  ] });
});

it("shows each concept with its rate, sources, weekly table and the students of the class", async () => {
  proficiency.mockResolvedValue(data(0.7, [{ id: "s1", name: "Ana", concepts: { conditional: rate(3, 1 / 3) } }]));
  renderPage();
  const card = (await screen.findByRole("heading", { name: "Condicional" })).closest("li")!;
  expect(within(card).getByText("Condicional: 70% de acerto")).toBeInTheDocument();
  expect(within(card).getByText("Bancada: 70% (14) · Provas: 50% (6)")).toBeInTheDocument();
  expect(within(card).getByRole("table", { name: "Evolução semanal de Condicional" })).toBeInTheDocument();
  const students = screen.getByRole("table", { name: "Por aluno" });
  expect(within(students).getByRole("row", { name: /Ana/ })).toHaveTextContent("33%");
  expect(proficiency).toHaveBeenCalledWith({ scope: "class", id: "c1", days: 90 });
});

it("compares with another selection of the same type", async () => {
  proficiency.mockImplementation(async ({ id }) => data(id === "c1" ? 0.8 : 0.4));
  renderPage();
  await screen.findByRole("heading", { name: "Condicional" });
  const compare = screen.getByLabelText("Comparar com");
  expect(within(compare).getAllByRole("option").map((option) => option.textContent)).toEqual(["Sem comparação", "Turma B · Computação"]);
  fireEvent.change(compare, { target: { value: "class:c2" } });
  expect(await screen.findByText("Condicional na seleção B: 40% de acerto")).toBeInTheDocument();
  expect(screen.getByText("Condicional: 80% de acerto")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Comparação: Turma A · Computação × Turma B · Computação" })).toBeInTheDocument();
  expect(screen.getByText("1 conceito(s) ocultos por terem menos de 5 alunos.")).toBeInTheDocument();
});

it("explains when there is nothing to choose", async () => {
  scopes.mockResolvedValue({ me: false, all: false, institutions: [], courses: [], classes: [] });
  renderPage();
  expect(await screen.findByText("Nenhuma seleção disponível")).toBeInTheDocument();
  await waitFor(() => expect(proficiency).not.toHaveBeenCalled());
});

it("exports one row per concept and per student, escaping separators", () => {
  const csv = proficiencyCsv(data(0.7, [{ id: "s1", name: "Silva, Ana", concepts: { conditional: rate(3, 0.5) } }]), (concept) => concept.toUpperCase());
  expect(csv.split("\n")).toEqual([
    "concept,label,answers,score,students,practice_answers,practice_score,exam_answers,exam_score",
    "conditional,CONDITIONAL,20,0.7,6,14,0.7,6,0.5",
    "",
    "student,concept,answers,score",
    "\"Silva, Ana\",CONDITIONAL,3,0.5",
    "",
  ]);
});

it("shows placeholders while loading and capitalises only the first letter of concept names", async () => {
  let release: (value: ProficiencyData) => void = () => {};
  proficiency.mockReturnValue(new Promise((resolve) => { release = resolve; }));
  renderPage();
  expect(await screen.findByRole("status")).toHaveTextContent("Carregando dados");
  release({ ...data(0.5), concepts: [{ ...data(0.5).concepts[0], concept: "input_output" }] });
  expect(await screen.findByRole("heading", { name: "Entrada e saída" })).toBeInTheDocument();
  expect(screen.queryByText(/Provas entram só depois/)).not.toBeInTheDocument();
});
