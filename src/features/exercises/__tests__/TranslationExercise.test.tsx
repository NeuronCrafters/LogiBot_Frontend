import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { chooseLanguage } from "@/i18n";
import { exercisesApi } from "@/features/exercises/api/exercisesApi";
import { TranslationExercise } from "@/features/exercises/components/TranslationExercise";

// Hints are covered in HintPanel.test.tsx; here they stay off so these flows are unchanged.
vi.mock("@/features/release/hooks/useFeatures", () => ({ useFeatures: () => ({ isEnabled: (feature: string) => feature !== "practice_hints" }) }));

vi.mock("@/features/exercises/api/exercisesApi", () => ({
  exercisesApi: { submitTranslationAttempt: vi.fn(), listPracticeQuestions: vi.fn() },
}));
const submit = vi.mocked(exercisesApi.submitTranslationAttempt);
const answerInput = () => screen.getByLabelText("Sua fórmula") as HTMLInputElement;
const key = (name: string) => screen.getByRole("button", { name });

const listBank = vi.mocked(exercisesApi.listPracticeQuestions);
beforeEach(() => { chooseLanguage("pt-BR"); submit.mockReset(); listBank.mockReset(); listBank.mockRejectedValue(new Error("not a student")); });

describe("TranslationExercise", () => {
  it("shows the sentence and the legend of the first exercise", () => {
    render(<TranslationExercise />);
    expect(screen.getByText("Se chove, então a rua fica molhada.", { selector: "blockquote" })).toBeInTheDocument();
    expect(screen.getByText("a rua fica molhada")).toBeInTheDocument();
  });

  it("builds the formula with the keypad without moving focus to the field", () => {
    render(<TranslationExercise />);
    key("Inserir p (chove)").focus();
    fireEvent.click(key("Inserir p (chove)"));
    fireEvent.click(key("Inserir → (condicional)"));
    fireEvent.click(key("Inserir q (a rua fica molhada)"));
    expect(answerInput().value).toBe("p → q");
    expect(answerInput()).not.toHaveFocus();
    expect(screen.getByText("Leitura: p → q")).toBeInTheDocument();
    fireEvent.click(key("Apagar o último símbolo"));
    expect(answerInput().value).toBe("p →");
  });

  it("inserts at the caret position", () => {
    render(<TranslationExercise />);
    const input = answerInput();
    fireEvent.change(input, { target: { value: "p  q" } });
    input.setSelectionRange(1, 1);
    fireEvent.select(input);
    fireEvent.click(key("Inserir ∧ (conjunção)"));
    expect(input.value).toBe("p ∧   q");
  });

  it("explains invalid formulas before sending", () => {
    render(<TranslationExercise />);
    fireEvent.change(answerInput(), { target: { value: "p -> r" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Use apenas as proposições p, q. Encontrado: r.");
    expect(answerInput()).toHaveAttribute("aria-invalid", "true");
    expect(submit).not.toHaveBeenCalled();
  });

  it("shows an accepted equivalent answer and the attempt number", async () => {
    submit.mockResolvedValue({ attemptId: "a", attemptNumber: 3, exerciseId: "translation:tr-rain-street", concepts: ["conditional"], correct: true, normalizedAnswer: "¬p ∨ q", equivalentTo: "p → q", engineVersion: "1.0.0" });
    render(<TranslationExercise />);
    fireEvent.change(answerInput(), { target: { value: "~p | q" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    const status = screen.getByRole("status");
    await waitFor(() => expect(status).toHaveTextContent("Correto! Sua fórmula traduz a frase."));
    expect(status).toHaveTextContent("Ela é equivalente à forma esperada, p → q.");
    expect(status).toHaveTextContent("Tentativa 3 registrada.");
    expect(submit.mock.calls[0][0]).toMatchObject({ type: "translation", exerciseId: "tr-rain-street", answer: "~p | q", hintsUsed: 0 });
  });

  it("shows the counterexample as a table", async () => {
    submit.mockResolvedValue({ attemptId: "a", attemptNumber: 1, exerciseId: "x", concepts: [], correct: false, normalizedAnswer: "q → p", counterexample: { p: true, q: false }, answerValue: true, expectedValue: false, engineVersion: "1.0.0" });
    render(<TranslationExercise />);
    fireEvent.change(answerInput(), { target: { value: "q -> p" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    const table = await screen.findByRole("table", { name: "Contraexemplo" });
    expect(within(table).getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["Vverdadeiro", "Ffalso", "Ffalso", "Vverdadeiro"]);
    expect(screen.getByRole("status")).toHaveTextContent("Com estes valores, a frase é falso, mas sua fórmula é verdadeiro.");
  });

  it("grades locally and says so when the network fails", async () => {
    submit.mockRejectedValue({ code: "ERR_NETWORK" });
    render(<TranslationExercise />);
    fireEvent.change(answerInput(), { target: { value: "p -> q" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    const status = screen.getByRole("status");
    await waitFor(() => expect(status).toHaveTextContent("Correto!"));
    expect(status).toHaveTextContent("não entra no seu histórico");
    expect(status).not.toHaveTextContent("equivalente");
  });

  it("switches exercise and language", () => {
    render(<TranslationExercise />);
    fireEvent.change(screen.getByLabelText("Frase"), { target: { value: "4" } });
    expect(key("Inserir r (há energia)")).toBeInTheDocument();
    act(() => chooseLanguage("es-ES"));
    expect(screen.getByRole("button", { name: "Insertar r (hay energía)" })).toBeInTheDocument();
  });

  it("offers the professor questions of the class and sends them to the server", async () => {
    listBank.mockResolvedValue([{ id: "q-1", type: "translation", statement: "Se estudo, passo.", language: "pt-BR", concepts: [], content: { legend: [{ letter: "e", text: "estudo" }, { letter: "a", text: "passo" }] } }]);
    submit.mockResolvedValue({ attemptId: "x", attemptNumber: 1, exerciseId: "bank:q-1", concepts: [], correct: true, normalizedAnswer: "e → a", engineVersion: "1" });
    render(<TranslationExercise />);
    const select = screen.getByLabelText("Frase");
    await waitFor(() => expect(within(select).getByRole("group", { name: "Da sua turma" })).toBeInTheDocument());
    fireEvent.change(select, { target: { value: "bank:q-1" } });
    expect(screen.getByText("Se estudo, passo.", { selector: "blockquote" })).toBeInTheDocument();
    fireEvent.change(answerInput(), { target: { value: "e -> a" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    await waitFor(() => expect(submit).toHaveBeenCalledWith(expect.objectContaining({ bankQuestionId: "q-1", answer: "e -> a" })));
    expect(submit.mock.calls[0][0]).not.toHaveProperty("exerciseId");
  });

  it("does not grade professor questions offline", async () => {
    listBank.mockResolvedValue([{ id: "q-1", type: "translation", statement: "Se estudo, passo.", language: "pt-BR", concepts: [], content: { legend: [{ letter: "e", text: "estudo" }, { letter: "a", text: "passo" }] } }]);
    submit.mockRejectedValue(Object.assign(new Error("Network Error"), { isAxiosError: true, code: "ERR_NETWORK" }));
    render(<TranslationExercise />);
    const select = screen.getByLabelText("Frase");
    await waitFor(() => expect(within(select).getByRole("option", { name: "Se estudo, passo." })).toBeInTheDocument());
    fireEvent.change(select, { target: { value: "bank:q-1" } });
    fireEvent.change(answerInput(), { target: { value: "e -> a" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("corrigidas pelo servidor");
  });
});
