import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { chooseLanguage } from "@/i18n";
import { normalizeFormula } from "@/shared/logic/logicCore";
import { TRUTH_TABLE_CATALOG } from "@/features/exercises/catalog";
import { exercisesApi } from "@/features/exercises/api/exercisesApi";
import { TruthTableExercise } from "@/features/exercises/components/TruthTableExercise";

// Hints are covered in HintPanel.test.tsx; here they stay off so these flows are unchanged.
vi.mock("@/features/release/hooks/useFeatures", () => ({ useFeatures: () => ({ isEnabled: (feature: string) => feature !== "practice_hints" }) }));

// jsdom has no ResizeObserver; the floating V/F picker uses it to follow its cell.
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;

vi.mock("@/features/exercises/api/exercisesApi", () => ({
  exercisesApi: { submitTruthTableAttempt: vi.fn() },
}));
const submit = vi.mocked(exercisesApi.submitTruthTableAttempt);

const cell = (row: number, value = "vazia") =>
  screen.getByRole("button", { name: `Linha ${row}, coluna p → q: ${value}` });

function fillPImpliesQ(values: string[]) {
  values.forEach((key, index) => fireEvent.keyDown(cell(index + 1), { key }));
}

beforeEach(() => {
  chooseLanguage("pt-BR");
  submit.mockReset();
});

describe("TruthTableExercise", () => {
  it("only offers catalog formulas that the logic core accepts", () => {
    expect(TRUTH_TABLE_CATALOG.map((source) => normalizeFormula(source))).toHaveLength(TRUTH_TABLE_CATALOG.length);
  });

  it("renders the first catalog formula as a labelled table with one control per cell", () => {
    render(<TruthTableExercise />);
    const table = screen.getByRole("table", { name: "Tabela-verdade de p → q" });
    expect(within(table).getAllByRole("columnheader").map((header) => header.textContent)).toEqual(["p", "q", "p → q"]);
    expect(within(table).getAllByRole("button")).toHaveLength(4);
    expect(within(table).getAllByRole("button").filter((button) => button.tabIndex === 0)).toHaveLength(1);
  });

  it("opens an explicit V/F choice on click instead of filling a value", async () => {
    render(<TruthTableExercise />);
    fireEvent.click(cell(1));
    const choice = screen.getByRole("group", { name: "Linha 1, coluna p → q" });
    expect(screen.getByRole("table").contains(choice)).toBe(false);
    expect(cell(1)).toHaveAttribute("aria-expanded", "true");
    expect(within(choice).getAllByRole("button").map((button) => button.getAttribute("aria-label"))).toEqual(["V (verdadeiro)", "F (falso)", "Deixar vazia"]);
    await waitFor(() => expect(within(choice).getByRole("button", { name: "V (verdadeiro)" })).toHaveFocus());
    expect(within(choice).getByRole("button", { name: "Deixar vazia" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(within(choice).getByRole("button", { name: "F (falso)" }));
    expect(screen.queryByRole("group", { name: "Linha 1, coluna p → q" })).toBeNull();
    await waitFor(() => expect(cell(1, "F (falso)")).toHaveFocus());

    fireEvent.click(cell(1, "F (falso)"));
    await waitFor(() => expect(screen.getByRole("button", { name: "F (falso)" })).toHaveFocus());
    fireEvent.click(screen.getByRole("button", { name: "Deixar vazia" }));
    expect(cell(1)).toBeInTheDocument();
  });

  it("navigates the choice with arrows and closes it with Escape without changing the cell", async () => {
    render(<TruthTableExercise />);
    fireEvent.click(cell(2));
    const first = screen.getByRole("button", { name: "V (verdadeiro)" });
    await waitFor(() => expect(first).toHaveFocus());
    fireEvent.keyDown(first, { key: "ArrowRight" });
    expect(screen.getByRole("button", { name: "F (falso)" })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole("button", { name: "F (falso)" }), { key: "Escape" });
    await waitFor(() => expect(cell(2)).toHaveFocus());
    fireEvent.click(cell(2));
    await waitFor(() => expect(screen.getByRole("button", { name: "V (verdadeiro)" })).toHaveFocus());
    fireEvent.keyDown(screen.getByRole("button", { name: "V (verdadeiro)" }), { key: "f" });
    expect(cell(2, "F (falso)")).toBeInTheDocument();
  });

  it("fills and navigates by keyboard with a single tab stop", () => {
    render(<TruthTableExercise />);
    cell(1).focus();
    fireEvent.keyDown(cell(1), { key: "f" });
    expect(cell(1, "F (falso)")).toHaveFocus();
    fireEvent.keyDown(cell(1, "F (falso)"), { key: "ArrowDown" });
    expect(cell(2)).toHaveFocus();
    expect(cell(2).tabIndex).toBe(0);
    expect(cell(1, "F (falso)").tabIndex).toBe(-1);
    fireEvent.keyDown(cell(2), { key: "1" });
    fireEvent.keyDown(cell(2, "V (verdadeiro)"), { key: "Backspace" });
    expect(cell(2)).toBeInTheDocument();
  });

  it("asks to fill every cell and moves focus to the first empty one", async () => {
    render(<TruthTableExercise />);
    fireEvent.keyDown(cell(1), { key: "v" });
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Preencha todas as células antes de verificar (3 vazias).");
    await waitFor(() => expect(cell(2)).toHaveFocus());
    expect(submit).not.toHaveBeenCalled();
  });

  it("sends the state to the server and shows the official result with marks", async () => {
    submit.mockResolvedValue({
      attemptId: "attempt", attemptNumber: 2, exerciseId: "truth_table:p → q", formula: "p → q", concepts: ["conditional"],
      correct: false, total: 4, right: 3, empty: 0, wrong: [{ row: 3, column: "p → q", concept: "conditional" }],
      errorsByConcept: { conditional: 1 }, engineVersion: "1.0.0",
      marks: { "0|p → q": "correct", "1|p → q": "correct", "2|p → q": "correct", "3|p → q": "wrong" },
    });
    render(<TruthTableExercise />);
    fillPImpliesQ(["v", "f", "v", "f"]);
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));

    const status = screen.getByRole("status");
    await waitFor(() => expect(status).toHaveTextContent("3 de 4 células certas."));
    expect(status).toHaveTextContent("Erros por conceito: condicional (1).");
    expect(status).toHaveTextContent("Tentativa 2 registrada.");
    expect(cell(4, "F (falso), incorreta")).toBeInTheDocument();
    expect(cell(1, "V (verdadeiro), correta")).toBeInTheDocument();

    const payload = submit.mock.calls[0][0];
    expect(payload).toMatchObject({
      type: "truth_table", source: "catalog", formula: "p → q", hintsUsed: 0,
      cells: { "0|p → q": true, "1|p → q": false, "2|p → q": true, "3|p → q": false },
    });
    expect(payload.events[0]).toEqual({ t: 0, action: "load" });
    expect(payload.events.filter((event) => event.action === "mark")).toHaveLength(4);
  });

  it("clears the mark of a cell that is edited after checking", async () => {
    submit.mockResolvedValue({
      attemptId: "a", attemptNumber: 1, exerciseId: "x", formula: "p → q", concepts: ["conditional"], correct: false, total: 4,
      right: 3, empty: 0, wrong: [], errorsByConcept: {}, engineVersion: "1.0.0", marks: { "3|p → q": "wrong" },
    });
    render(<TruthTableExercise />);
    fillPImpliesQ(["v", "f", "v", "f"]);
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    await screen.findByRole("button", { name: "Linha 4, coluna p → q: F (falso), incorreta" });
    fireEvent.keyDown(cell(4, "F (falso), incorreta"), { key: "v" });
    expect(cell(4, "V (verdadeiro)")).toBeInTheDocument();
  });

  it("falls back to local feedback, clearly not recorded, when the network fails", async () => {
    submit.mockRejectedValue({ code: "ERR_NETWORK" });
    render(<TruthTableExercise />);
    fillPImpliesQ(["v", "f", "v", "v"]);
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    const status = screen.getByRole("status");
    await waitFor(() => expect(status).toHaveTextContent("Correto! As 4 células estão certas."));
    expect(status).toHaveTextContent("não entra no seu histórico");
  });

  it("shows the server message when the request is refused", async () => {
    submit.mockRejectedValue({ response: { status: 403, data: { message: "Apenas alunos podem registrar exercícios da bancada" }, headers: {} } });
    render(<TruthTableExercise />);
    fillPImpliesQ(["v", "f", "v", "v"]);
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Apenas alunos podem registrar exercícios da bancada");
  });

  it("validates a custom formula with translated messages and loads it", () => {
    render(<TruthTableExercise />);
    fireEvent.change(screen.getByLabelText("Fórmula"), { target: { value: "custom" } });
    const input = screen.getByLabelText("Sua fórmula (até 10 proposições, letras minúsculas)");
    fireEvent.change(input, { target: { value: "P & q" } });
    fireEvent.click(screen.getByRole("button", { name: "Usar fórmula" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Use letras minúsculas: troque “P” por “p”.");
    expect(input).toHaveAttribute("aria-invalid", "true");

    fireEvent.change(input, { target: { value: "(p & q" } });
    fireEvent.click(screen.getByRole("button", { name: "Usar fórmula" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Falta fechar o parêntese aberto na posição 1.");

    fireEvent.change(input, { target: { value: "p & q | ~r" } });
    fireEvent.click(screen.getByRole("button", { name: "Usar fórmula" }));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(input).not.toHaveAttribute("aria-invalid");
    const table = screen.getByRole("table", { name: "Tabela-verdade de (p ∧ q) ∨ ¬r" });
    expect(within(table).getAllByRole("row")).toHaveLength(9);
    expect(screen.getByText("Conceitos: negação, conjunção, disjunção")).toBeInTheDocument();
  });

  it("handles large formulas: asks for the final column only and shows the rows in pages", async () => {
    render(<TruthTableExercise />);
    fireEvent.change(screen.getByLabelText("Fórmula"), { target: { value: "custom" } });
    const input = screen.getByLabelText("Sua fórmula (até 10 proposições, letras minúsculas)");
    const big = "p & q & r & s & t & u & v & w & x & y";
    fireEvent.change(input, { target: { value: big } });
    fireEvent.click(screen.getByRole("button", { name: "Usar fórmula" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Com todas as colunas, esta tabela teria 9216 células (o limite é 2048). Peça só a coluna final.");

    fireEvent.click(screen.getByRole("checkbox", { name: /Preencher só a coluna final/ }));
    fireEvent.click(screen.getByRole("button", { name: "Usar fórmula" }));
    expect(screen.getByText("Nesta tabela, preencha só a coluna final.")).toBeInTheDocument();
    expect(screen.getByText("1024 linhas × 1 colunas · 0 de 1024 preenchidas")).toBeInTheDocument();
    const table = screen.getByRole("table");
    // Header + one page of 16 rows.
    expect(within(table).getAllByRole("row")).toHaveLength(17);
    expect(screen.getByText("Linhas 1–16 de 1024")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Próxima" }));
    expect(screen.getByText("Linhas 17–32 de 1024")).toBeInTheDocument();

    // Checking with empty cells goes back to the page of the first empty one.
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("1024 vazias");
    expect(screen.getByText("Linhas 1–16 de 1024")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: /^Linha 1, coluna/ })).toHaveFocus());
  });

  it("moves to the next page of rows with the arrow keys", async () => {
    render(<TruthTableExercise />);
    fireEvent.change(screen.getByLabelText("Fórmula"), { target: { value: "custom" } });
    fireEvent.change(screen.getByLabelText("Sua fórmula (até 10 proposições, letras minúsculas)"), { target: { value: "p & q & r & s & t" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /Preencher só a coluna final/ }));
    fireEvent.click(screen.getByRole("button", { name: "Usar fórmula" }));
    const row16 = screen.getByRole("button", { name: /^Linha 16, coluna/ });
    row16.focus();
    fireEvent.keyDown(row16, { key: "ArrowDown" });
    await waitFor(() => expect(screen.getByRole("button", { name: /^Linha 17, coluna/ })).toHaveFocus());
    expect(screen.getByText("Linhas 17–32 de 32")).toBeInTheDocument();
  });

  it("offers a row-by-row view with pressed-state buttons", () => {
    render(<TruthTableExercise />);
    fireEvent.click(screen.getByRole("button", { name: "Por linha" }));
    expect(screen.getByRole("button", { name: "Por linha" })).toHaveAttribute("aria-pressed", "true");
    const list = screen.getByRole("list", { name: "Tabela-verdade de p → q" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(4);
    const group = screen.getByRole("group", { name: "Linha 1, coluna p → q" });
    const trueButton = within(group).getByRole("button", { name: "V" });
    fireEvent.click(trueButton);
    expect(trueButton).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(trueButton);
    expect(trueButton).toHaveAttribute("aria-pressed", "false");
  });

  it("follows the interface language, including truth-value letters", () => {
    render(<TruthTableExercise />);
    act(() => chooseLanguage("en-US"));
    fireEvent.keyDown(screen.getByRole("button", { name: "Row 1, column p → q: empty" }), { key: "t" });
    expect(screen.getByRole("button", { name: "Row 1, column p → q: T (true)" })).toHaveTextContent("T");
    expect(screen.getByRole("button", { name: "Check" })).toBeInTheDocument();
    act(() => chooseLanguage("es-ES"));
    expect(screen.getByRole("button", { name: "Fila 1, columna p → q: V (verdadero)" })).toBeInTheDocument();
  });
});
