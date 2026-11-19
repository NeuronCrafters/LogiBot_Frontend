import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { chooseLanguage } from "@/i18n";
import { exercisesApi } from "@/features/exercises/api/exercisesApi";
import { HintPanel } from "@/features/exercises/components/HintPanel";

let hintsReleased = true;
vi.mock("@/features/release/hooks/useFeatures", () => ({ useFeatures: () => ({ isEnabled: () => hintsReleased }) }));
vi.mock("@/features/exercises/api/exercisesApi", () => ({ exercisesApi: { hintStatus: vi.fn(), requestHint: vi.fn() } }));
const status = vi.mocked(exercisesApi.hintStatus);
const request = vi.mocked(exercisesApi.requestHint);

beforeEach(() => {
  chooseLanguage("pt-BR");
  hintsReleased = true;
  status.mockReset();
  request.mockReset();
  status.mockResolvedValue({ hints: [], remaining: 3 });
});

it("asks for progressive hints for the last wrong attempt until none are left", async () => {
  request
    .mockResolvedValueOnce({ level: 1, text: "Revise o condicional.", remaining: 2, usedMaterial: false, materials: [], concepts: ["conditional"] })
    .mockResolvedValueOnce({ level: 2, text: "Olhe a linha 2.", remaining: 1, usedMaterial: true, materials: ["Apostila de lógica"], concepts: [] })
    .mockResolvedValueOnce({ level: 3, text: "Veja este exemplo.", remaining: 0, usedMaterial: false, materials: [], concepts: [] });
  render(<HintPanel exerciseId="tt-1" attemptId="attempt-1" />);
  expect(screen.getByRole("region", { name: "Dicas" })).toBeInTheDocument();
  await waitFor(() => expect(status).toHaveBeenCalledWith("tt-1"));

  fireEvent.click(screen.getByRole("button", { name: "Pedir dica (3 restantes)" }));
  expect(await screen.findByText("Revise o condicional.")).toBeInTheDocument();
  expect(request).toHaveBeenCalledWith("attempt-1");
  fireEvent.click(screen.getByRole("button", { name: "Pedir dica (2 restantes)" }));
  expect(await screen.findByText("Com base no material da turma: Apostila de lógica")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Pedir dica (1 restantes)" }));
  expect(await screen.findByText("Você já usou as 3 dicas deste exercício.")).toBeInTheDocument();
  expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
    "Dica 1Revise o condicional.", "Dica 2Olhe a linha 2.Com base no material da turma: Apostila de lógica", "Dica 3Veja este exemplo.",
  ]);
});

it("brings back earlier hints and shows server errors", async () => {
  status.mockResolvedValue({ hints: [{ level: 1, text: "Dica antiga." }], remaining: 2 });
  request.mockRejectedValue({ response: { data: { message: "Muitos pedidos de dica em pouco tempo" } } });
  render(<HintPanel exerciseId="tt-1" attemptId="attempt-2" />);
  expect(await screen.findByText("Dica antiga.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Pedir dica (2 restantes)" }));
  expect(await screen.findByRole("alert")).toBeInTheDocument();
});

it("stays hidden when hints are not released or the answer was right without hints", async () => {
  hintsReleased = false;
  const { container, rerender } = render(<HintPanel exerciseId="tt-1" attemptId="attempt-1" />);
  expect(container).toBeEmptyDOMElement();
  hintsReleased = true;
  rerender(<HintPanel exerciseId="tt-1" attemptId={null} correct />);
  await waitFor(() => expect(status).toHaveBeenCalled());
  expect(container).toBeEmptyDOMElement();
});

it("explains that offline attempts cannot get hints", () => {
  render(<HintPanel exerciseId={null} attemptId={null} offline />);
  expect(screen.getByText(/A dica precisa da tentativa registrada no servidor/)).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

it("ignores an unexpected answer when loading earlier hints", async () => {
  status.mockResolvedValue([] as never);
  render(<HintPanel exerciseId="tt-1" attemptId="attempt-1" />);
  await waitFor(() => expect(status).toHaveBeenCalled());
  expect(screen.getByRole("button", { name: "Pedir dica (3 restantes)" })).toBeInTheDocument();
});
