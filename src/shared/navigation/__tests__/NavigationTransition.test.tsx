import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Link, MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { NavigationTransition } from "../NavigationTransition";
import { resetPreferences, setPreference } from "@/shared/preferences";

function Chat() {
  const location = useLocation();
  return <main><p>Chat</p><input aria-label="Draft" defaultValue="Preserved" /><output>{location.search}</output></main>;
}
function App() {
  return <MemoryRouter initialEntries={["/chat"]}>
    <nav><Link to="/quiz">Quiz link</Link><Link to="/profile">Profile link</Link><Link to="/chat?session=saved">Session link</Link></nav>
    <NavigationTransition>{location => <Routes location={location}>
      <Route path="/chat" element={<Chat />} /><Route path="/quiz" element={<main>Quiz content</main>} /><Route path="/profile" element={<main>Profile content</main>} />
    </Routes>}</NavigationTransition>
  </MemoryRouter>;
}
beforeEach(() => { vi.useFakeTimers(); resetPreferences(); setPreference("motion", "full"); });
afterEach(() => { vi.useRealTimers(); });

it("keeps the outgoing page for its exit and then reveals the destination", () => {
  const { container } = render(<App />);
  fireEvent.click(screen.getByText("Quiz link"));
  expect(screen.getByText("Chat")).toBeInTheDocument();
  expect(screen.queryByText("Quiz content")).toBeNull();
  expect(container.querySelector("main")).toHaveAttribute("inert");
  act(() => vi.advanceTimersByTime(160));
  expect(screen.queryByText("Chat")).toBeNull();
  expect(screen.getByText("Quiz content")).toBeInTheDocument();
  expect(container.querySelector(".navigation-transition")).toHaveAttribute("data-route-phase", "enter");
  act(() => vi.advanceTimersByTime(340));
  expect(container.querySelector(".navigation-transition")).toHaveAttribute("data-route-phase", "idle");
});

it("uses the latest navigation when another destination is selected during exit", () => {
  render(<App />);
  fireEvent.click(screen.getByText("Quiz link"));
  act(() => vi.advanceTimersByTime(80));
  fireEvent.click(screen.getByText("Profile link"));
  act(() => vi.advanceTimersByTime(160));
  expect(screen.queryByText("Quiz content")).toBeNull();
  expect(screen.getByText("Profile content")).toBeInTheDocument();
});

it("updates conversation query parameters without replacing the draft or animating", () => {
  const { container } = render(<App />);
  fireEvent.change(screen.getByLabelText("Draft"), { target: { value: "My draft" } });
  fireEvent.click(screen.getByText("Session link"));
  expect(screen.getByText("?session=saved")).toBeInTheDocument();
  expect(screen.getByLabelText("Draft")).toHaveValue("My draft");
  expect(container.querySelector(".navigation-transition")).toHaveAttribute("data-route-phase", "idle");
});

it("skips the exit delay when reduced motion is selected, including during a transition", () => {
  const { container } = render(<App />);
  fireEvent.click(screen.getByText("Quiz link"));
  act(() => setPreference("motion", "reduce"));
  expect(screen.getByText("Quiz content")).toBeInTheDocument();
  expect(container.querySelector(".navigation-transition")).toHaveAttribute("data-route-phase", "idle");
  act(() => vi.advanceTimersByTime(500));
  expect(screen.getByText("Quiz content")).toBeInTheDocument();
});
