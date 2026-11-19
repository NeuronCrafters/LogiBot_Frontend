import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { NavigationTransition } from "@/shared/navigation/NavigationTransition";
import { resetPreferences, setPreference } from "@/shared/preferences";

// The workbench is a learning option like chat and quiz: only the content fades, the layout stays.
function App() {
  return <MemoryRouter initialEntries={["/chat"]}>
    <nav><Link to="/practice">Practice link</Link><Link to="/quiz">Quiz link</Link></nav>
    <NavigationTransition>{location => <Routes location={location}>
      <Route path="/chat" element={<main>Chat content</main>} />
      <Route path="/practice" element={<main>Practice content</main>} />
      <Route path="/quiz" element={<main>Quiz content</main>} />
    </Routes>}</NavigationTransition>
  </MemoryRouter>;
}
const root = (container: HTMLElement) => container.querySelector(".navigation-transition");

beforeEach(() => { vi.useFakeTimers(); resetPreferences(); setPreference("motion", "full"); });
afterEach(() => { vi.useRealTimers(); });

it("fades only the content between chat, workbench and quiz", () => {
  const { container } = render(<App />);
  fireEvent.click(screen.getByText("Practice link"));
  expect(root(container)).toHaveAttribute("data-route-phase", "exit");
  expect(root(container)).toHaveAttribute("data-route-scope", "content");
  expect(container.querySelector("main")).toHaveAttribute("inert");
  act(() => vi.advanceTimersByTime(160));
  expect(screen.getByText("Practice content")).toBeInTheDocument();
  expect(root(container)).toHaveAttribute("data-route-phase", "enter");
  expect(root(container)).toHaveAttribute("data-route-scope", "content");
  act(() => vi.advanceTimersByTime(340));
  expect(root(container)).toHaveAttribute("data-route-phase", "idle");

  fireEvent.click(screen.getByText("Quiz link"));
  expect(root(container)).toHaveAttribute("data-route-scope", "content");
  act(() => vi.advanceTimersByTime(160));
  expect(screen.getByText("Quiz content")).toBeInTheDocument();
});

it("switches immediately when the person prefers reduced motion", () => {
  setPreference("motion", "reduce");
  const { container } = render(<App />);
  fireEvent.click(screen.getByText("Practice link"));
  expect(screen.getByText("Practice content")).toBeInTheDocument();
  expect(root(container)).toHaveAttribute("data-route-phase", "idle");
});
