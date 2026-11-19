import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { chooseLanguage } from "@/i18n";
import { exercisesApi } from "@/features/exercises/api/exercisesApi";
import { ParsonsExercise } from "@/features/exercises/components/ParsonsExercise";

// Hints are covered in HintPanel.test.tsx; here they stay off so these flows are unchanged.
vi.mock("@/features/release/hooks/useFeatures", () => ({ useFeatures: () => ({ isEnabled: (feature: string) => feature !== "practice_hints" }) }));

vi.mock("@/features/exercises/api/exercisesApi", () => ({
  exercisesApi: { submitParsonsAttempt: vi.fn() },
}));
const submit = vi.mocked(exercisesApi.submitParsonsAttempt);

const bank = () => screen.getByRole("list", { name: "Linhas disponíveis" });
const solution = () => screen.getByRole("list", { name: "Sua solução" });
const line = (name: string | RegExp) => screen.getByRole("button", { name });

/** Keyboard-only: select, move to the solution with M, indent with the right arrow. */
function place(text: string, indent: number) {
  fireEvent.click(line(text));
  fireEvent.keyDown(line(text), { key: "m" });
  for (let i = 0; i < indent; i++) fireEvent.keyDown(line(new RegExp(`^${text.replace(/[()%]/g, "\\$&")}, recuo`)), { key: "ArrowRight" });
}
const EVEN_ODD: Array<[string, number]> = [
  ["leia(n)", 0], ["se n % 2 = 0 então", 0], ["escreva(\"par\")", 1], ["senão", 0], ["escreva(\"ímpar\")", 1], ["fimse", 0],
];

beforeEach(() => { chooseLanguage("pt-BR"); submit.mockReset(); });

describe("ParsonsExercise", () => {
  it("starts with every line available, including the distractor, and an empty solution", () => {
    render(<ParsonsExercise />);
    expect(within(bank()).getAllByRole("button")).toHaveLength(7);
    expect(within(bank()).getByRole("button", { name: "enquanto n % 2 = 0 faça" })).toBeInTheDocument();
    expect(solution()).toHaveTextContent("Arraste ou mova linhas para cá.");
  });

  it("moves a selected line with the toolbar and announces it", () => {
    render(<ParsonsExercise />);
    fireEvent.click(line("leia(n)"));
    expect(line("leia(n)")).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Mover para a solução" }));
    expect(within(solution()).getByRole("button", { name: "leia(n), recuo 0" })).toBeInTheDocument();
    expect(screen.getByText("leia(n): Sua solução, posição 1.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Aumentar recuo" }));
    expect(line("leia(n), recuo 1")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Diminuir recuo" }));
    fireEvent.click(screen.getByRole("button", { name: "Devolver às disponíveis" }));
    expect(within(bank()).getByRole("button", { name: "leia(n)" })).toBeInTheDocument();
  });

  it("keeps focus on the line it moves by keyboard and reorders with the arrows", async () => {
    render(<ParsonsExercise />);
    place("senão", 0);
    place("fimse", 0);
    await waitFor(() => expect(line("fimse, recuo 0")).toHaveFocus());
    fireEvent.keyDown(line("fimse, recuo 0"), { key: "ArrowUp" });
    expect(within(solution()).getAllByRole("button").map((button) => button.getAttribute("aria-label"))).toEqual(["fimse, recuo 0", "senão, recuo 0"]);
    fireEvent.keyDown(line("fimse, recuo 0"), { key: "Delete" });
    expect(within(bank()).getByRole("button", { name: "fimse" })).toBeInTheDocument();
  });

  it("asks for at least one line before checking", () => {
    render(<ParsonsExercise />);
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Mova pelo menos uma linha para “Sua solução” antes de verificar.");
    expect(submit).not.toHaveBeenCalled();
  });

  it("sends the arrangement and shows the official marks", async () => {
    submit.mockResolvedValue({ attemptId: "a", attemptNumber: 2, exerciseId: "parsons:pa-even-odd", concepts: [], correct: true, misplaced: 0, wrongIndent: 0, distractors: 0, missing: 0, engineVersion: "1.0.0",
      marks: { read: "correct", if: "correct", even: "correct", else: "correct", odd: "correct", endif: "correct" } });
    render(<ParsonsExercise />);
    EVEN_ODD.forEach(([text, indent]) => place(text, indent));
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    const status = (await screen.findByText("Algoritmo correto!")).closest("[role=status]");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(line("escreva(\"par\"), recuo 1, no lugar certo")).toBeInTheDocument();
    expect(submit.mock.calls[0][0]).toMatchObject({
      type: "parsons", exerciseId: "pa-even-odd",
      solution: [{ id: "read", indent: 0 }, { id: "if", indent: 0 }, { id: "even", indent: 1 }, { id: "else", indent: 0 }, { id: "odd", indent: 1 }, { id: "endif", indent: 0 }],
    });
    expect(submit.mock.calls[0][0].events.some((event) => event.action === "move" && event.via === "keyboard")).toBe(true);
  });

  it("grades locally with the LCS rule when the network fails", async () => {
    submit.mockRejectedValue({ code: "ERR_NETWORK" });
    render(<ParsonsExercise />);
    place("enquanto n % 2 = 0 faça", 0);
    EVEN_ODD.slice(0, 5).forEach(([text, indent]) => place(text, indent));
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    const status = (await screen.findByText("Ainda não.")).closest("[role=status]");
    expect(status).toHaveTextContent("Linhas que não fazem parte da solução: 1.");
    expect(status).toHaveTextContent("Linhas necessárias que faltam: 1.");
    expect(status).not.toHaveTextContent("fora de posição");
    expect(line("leia(n), recuo 0, no lugar certo")).toBeInTheDocument();
    expect(line("enquanto n % 2 = 0 faça, recuo 0, não faz parte da solução")).toBeInTheDocument();
  });

  it("clears the marks after any change", async () => {
    submit.mockRejectedValue({ code: "ERR_NETWORK" });
    render(<ParsonsExercise />);
    place("leia(n)", 0);
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    await screen.findByRole("button", { name: "leia(n), recuo 0, no lugar certo" });
    fireEvent.keyDown(line("leia(n), recuo 0, no lugar certo"), { key: "ArrowRight" });
    expect(line("leia(n), recuo 1")).toBeInTheDocument();
  });

  it("shows the pseudocode in the interface language", () => {
    render(<ParsonsExercise />);
    act(() => chooseLanguage("en-US"));
    expect(screen.getByRole("button", { name: "read(n)" })).toBeInTheDocument();
    act(() => chooseLanguage("es-ES"));
    expect(screen.getByRole("button", { name: "leer(n)" })).toBeInTheDocument();
  });
});
