import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { chooseLanguage } from "@/i18n";
import { QuestionForm } from "@/features/questions/components/QuestionForm";
import type { BankQuestion } from "@/features/questions/types";

// Every question type released here; blocking a type is covered in useQuestionTypes.test.ts.
vi.mock("@/features/release/hooks/useFeatures", () => ({ useFeatures: () => ({ isEnabled: () => true }) }));

const disciplines = [{ id: "d1", name: "Lógica" }];
const setup = (props: Partial<Parameters<typeof QuestionForm>[0]> = {}) => {
  const onSubmit = vi.fn();
  render(<QuestionForm disciplines={disciplines} saving={false} serverIssues={null} onSubmit={onSubmit} {...props} />);
  return onSubmit;
};
const save = () => fireEvent.click(screen.getByRole("button", { name: "Salvar questão" }));
const chooseType = (label: string) => fireEvent.change(screen.getByLabelText("Tipo de questão"), { target: { value: label } });

beforeEach(() => chooseLanguage("pt-BR"));

describe("QuestionForm", () => {
  it("sends a valid multiple-choice question", () => {
    const onSubmit = setup();
    fireEvent.change(screen.getByLabelText("Enunciado"), { target: { value: "Quanto vale p → q com p = V e q = F?" } });
    fireEvent.change(screen.getByLabelText("Alternativa A"), { target: { value: "V" } });
    fireEvent.change(screen.getByLabelText("Alternativa B"), { target: { value: "F" } });
    fireEvent.click(screen.getByRole("radio", { name: "Alternativa B é a correta" }));
    fireEvent.change(screen.getByLabelText(/^Conceitos \(separados por vírgula\)/, { selector: "input, textarea, select" }), { target: { value: "condicional, tabela" } });
    save();
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      disciplineId: "d1", type: "quiz", weight: 1, language: "pt-BR", concepts: ["condicional", "tabela"],
      content: { options: ["V", "F"], correct: 1 },
    }));
  });

  it("summarizes the issues, marks the fields and focuses the first one", async () => {
    const onSubmit = setup();
    save();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Revise os campos marcados (4).");
    const statement = screen.getByLabelText("Enunciado");
    await waitFor(() => expect(statement).toHaveFocus());
    expect(statement).toHaveAttribute("aria-invalid", "true");
    expect(statement).toHaveAccessibleDescription("Preencha este campo.");
    expect(screen.getByText("Marque qual alternativa é a correta.")).toBeInTheDocument();
  });

  it("keeps the same field element while typing (no remount, no focus loss)", () => {
    setup();
    const statement = screen.getByLabelText("Enunciado");
    statement.focus();
    fireEvent.change(statement, { target: { value: "a" } });
    fireEvent.change(statement, { target: { value: "ab" } });
    expect(screen.getByLabelText("Enunciado")).toBe(statement);
    expect(statement).toHaveFocus();
  });

  it("validates a truth-table formula and shows detected concepts", () => {
    setup();
    chooseType("truth_table");
    fireEvent.change(screen.getByLabelText("Enunciado"), { target: { value: "Monte a tabela." } });
    fireEvent.change(screen.getByLabelText("Fórmula"), { target: { value: "p" } });
    save();
    expect(screen.getByText("A fórmula precisa de pelo menos um operador.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Fórmula"), { target: { value: "(p -> q) & ~q" } });
    expect(screen.getByText("Leitura: (p → q) ∧ ¬q")).toBeInTheDocument();
    expect(screen.getByText("Detectados automaticamente: negação, conjunção, condicional")).toBeInTheDocument();
  });

  it("lets the professor ask large tables with the final column only, with the size of each choice", () => {
    const onSubmit = setup();
    chooseType("truth_table");
    fireEvent.change(screen.getByLabelText("Enunciado"), { target: { value: "Monte a tabela." } });
    fireEvent.change(screen.getByLabelText("Fórmula"), { target: { value: "p & q & r & s & t & u & v & w & x & y" } });
    const all = screen.getByRole("radio", { name: /Todas as etapas/ });
    const final = screen.getByRole("radio", { name: /Só o resultado final/ });
    expect(all).toBeChecked();
    expect(all.closest("label")).toHaveTextContent("Grande demais: 9216 células (limite 2048). Use só o resultado final.");
    expect(final.closest("label")).toHaveTextContent("1024 linhas · 1024 células para preencher");
    fireEvent.click(final);
    const key = screen.getByRole("region", { name: /^Gabarito: tabela-verdade de/ });
    // One page of 16 rows (plus the header), with pages to browse the rest.
    expect(within(key).getAllByRole("row")).toHaveLength(17);
    expect(screen.getByText("Linhas 1–16 de 1024")).toBeInTheDocument();
    save();
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ type: "truth_table", content: { formula: "p & q & r & s & t & u & v & w & x & y", columns: "final" } }));
  });

  it("explains Parsons indentation problems and previews the solution", () => {
    setup();
    chooseType("parsons");
    fireEvent.change(screen.getByLabelText("Enunciado"), { target: { value: "Monte." } });
    fireEvent.change(screen.getByLabelText("Solução (uma linha de código por linha)"), { target: { value: "se x > 0 então\n   escreva(x)\nfimse" } });
    save();
    expect(screen.getByText("Linha 2: use um número par de espaços (2 por nível).")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Solução (uma linha de código por linha)"), { target: { value: "se x > 0 então\n  escreva(x)\nfimse" } });
    const preview = screen.getByRole("heading", { name: "Pré-visualização da solução" }).parentElement!;
    expect(within(preview).getByText("Linha 2, recuo 1: escreva(x)")).toBeInTheDocument();
  });

  it("checks the translation target against the legend", () => {
    const onSubmit = setup();
    chooseType("translation");
    fireEvent.change(screen.getByLabelText("Frase a traduzir"), { target: { value: "Se chove, a rua molha." } });
    fireEvent.change(screen.getByLabelText("Significado da proposição 1"), { target: { value: "chove" } });
    fireEvent.change(screen.getByLabelText("Significado da proposição 2"), { target: { value: "a rua molha" } });
    fireEvent.change(screen.getByLabelText("Fórmula esperada"), { target: { value: "p -> r" } });
    save();
    expect(screen.getByText("Use apenas as proposições p, q. Encontrado: r.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Fórmula esperada"), { target: { value: "p -> q" } });
    save();
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ type: "translation", content: { legend: [{ letter: "p", text: "chove" }, { letter: "q", text: "a rua molha" }], target: "p -> q" } }));
  });

  it("shows issues returned by the API on the right fields", () => {
    setup({ serverIssues: [{ field: "weight", code: "WEIGHT_RANGE", params: { min: 0.5, max: 10 } }] });
    expect(screen.getByLabelText("Peso")).toHaveAccessibleDescription(expect.stringContaining("Use um peso de 0.5 a 10"));
  });

  it("edits an existing Parsons question with its type locked", () => {
    const initial = {
      id: "q1", ownerId: "u", disciplineId: "d1", disciplineName: "Lógica", version: 3, sourceQuizQuestionId: null, createdAt: "", updatedAt: "",
      type: "parsons", statement: "Monte.", weight: 2, subject: "condicionais", concepts: ["seleção"], language: "pt-BR",
      content: { type: "parsons", lines: [{ id: "x1", text: "se a então" }, { id: "x2", text: "b" }, { id: "x3", text: "c", distractor: true }], solutions: [[["x1", 0], ["x2", 1]]] },
    } as BankQuestion;
    const onSubmit = setup({ initial });
    expect(screen.getByLabelText("Tipo de questão")).toBeDisabled();
    expect(screen.getByLabelText("Solução (uma linha de código por linha)")).toHaveValue("se a então\n  b");
    expect(screen.getByLabelText(/^Linhas distratoras/, { selector: "input, textarea, select" })).toHaveValue("c");
    save();
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ type: "parsons", weight: 2, subject: "condicionais", concepts: ["seleção"] }));
  });

  it("offers workbench practice only for compatible types and shows the answer key", () => {
    const onSubmit = setup();
    expect(screen.queryByRole("checkbox", { name: "Usar na bancada de exercícios" })).not.toBeInTheDocument();
    chooseType("truth_table");
    fireEvent.change(screen.getByLabelText("Enunciado"), { target: { value: "Monte a tabela." } });
    fireEvent.change(screen.getByLabelText("Fórmula"), { target: { value: "p -> q" } });
    const key = screen.getByRole("region", { name: "Gabarito: tabela-verdade de p → q" });
    expect(within(key).getAllByRole("row")).toHaveLength(5);
    expect(within(key).getAllByRole("row").map((row) => row.textContent)).toContain("VverdadeiroFfalsoFfalso");
    const practice = screen.getByRole("checkbox", { name: "Usar na bancada de exercícios" });
    expect(practice).toHaveAccessibleDescription(expect.stringContaining("O gabarito não é mostrado a eles"));
    fireEvent.click(practice);
    save();
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ type: "truth_table", practiceEnabled: true }));
  });

  it("explains that equivalent translations are accepted", () => {
    setup();
    chooseType("translation");
    fireEvent.change(screen.getByLabelText("Significado da proposição 1"), { target: { value: "chove" } });
    fireEvent.change(screen.getByLabelText("Significado da proposição 2"), { target: { value: "molha" } });
    fireEvent.change(screen.getByLabelText("Fórmula esperada"), { target: { value: "p -> q" } });
    expect(screen.getByRole("heading", { name: "Gabarito" }).parentElement).toHaveTextContent("Respostas equivalentes também são aceitas");
  });
});
