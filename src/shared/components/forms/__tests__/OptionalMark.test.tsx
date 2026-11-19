import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, expect, it, vi } from "vitest";
import { chooseLanguage } from "@/i18n";
import { OptionalMark } from "@/shared/components/forms/OptionalMark";

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});
beforeEach(() => chooseLanguage("pt-BR"));

const field = () => render(<><label htmlFor="f">Descrição<OptionalMark /></label><input id="f" /></>);

it("keeps the field announced as optional while showing only an asterisk", () => {
  field();
  // Browsers include the button name in the label; jsdom queries see it through the accessible name.
  expect(screen.getByRole("textbox", { name: "Descrição (opcional)" })).toBeInTheDocument();
  const mark = screen.getByRole("button", { name: "(opcional)" });
  expect(mark.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
});

it("explains on hover and closes when the pointer leaves", () => {
  vi.useFakeTimers();
  field();
  const mark = screen.getByRole("button", { name: "(opcional)" });
  fireEvent.mouseEnter(mark);
  expect(screen.getByRole("tooltip", { name: "Campo opcional" })).toHaveTextContent("Este campo não é obrigatório");
  fireEvent.mouseLeave(mark);
  act(() => { vi.advanceTimersByTime(200); });
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  vi.useRealTimers();
});

it("pins the explanation on click, without focusing the field, and closes with Escape", () => {
  field();
  const mark = screen.getByRole("button", { name: "(opcional)" });
  fireEvent.click(mark);
  expect(mark).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("dialog", { name: "Campo opcional" })).toBeInTheDocument();
  expect(screen.getByRole("textbox")).not.toHaveFocus();
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(mark).toHaveFocus();
});
