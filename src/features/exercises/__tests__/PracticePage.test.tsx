import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { chooseLanguage } from "@/i18n";
import { PracticePage } from "@/features/exercises/pages/PracticePage";

// Hints are covered in HintPanel.test.tsx; here they stay off so these flows are unchanged.
vi.mock("@/features/release/hooks/useFeatures", () => ({ useFeatures: () => ({ isEnabled: (feature: string) => feature !== "practice_hints" }) }));

vi.mock("@/features/exercises/api/exercisesApi", () => ({ exercisesApi: {} }));
beforeEach(() => chooseLanguage("pt-BR"));

function Where() {
  return <output aria-label="path">{useLocation().pathname}</output>;
}
const renderAt = (path: string) => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/practice" element={<PracticePage />} />
      <Route path="/practice/:exercise" element={<PracticePage />} />
    </Routes>
    <Where />
  </MemoryRouter>,
);

it.each([
  ["/practice/truth-table", "Tabela-verdade"],
  ["/practice/translation", "Tradução para fórmula"],
  ["/practice/parsons", "Montar algoritmo"],
])("%s shows only its own exercise", (path, heading) => {
  renderAt(path);
  expect(screen.getByRole("heading", { level: 1, name: heading })).toBeInTheDocument();
  expect(screen.queryAllByRole("heading", { level: 2 })).toHaveLength(0);
  expect(screen.getByText(/Cada verificação é registrada/)).toBeInTheDocument();
  expect(screen.queryByRole("navigation")).toBeNull();
});

it.each(["/practice", "/practice/essay"])("redirects %s to the truth table", (path) => {
  renderAt(path);
  expect(screen.getByLabelText("path")).toHaveTextContent("/practice/truth-table");
  expect(screen.getByRole("heading", { level: 1, name: "Tabela-verdade" })).toBeInTheDocument();
});
