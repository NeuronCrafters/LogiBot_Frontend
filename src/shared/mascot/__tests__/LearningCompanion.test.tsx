import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { chooseLanguage } from "@/i18n";
import { getPreferences, resetPreferences, sanitizePreferences, setPreference } from "@/shared/preferences";
import { LearningCompanion } from "../LearningCompanion";

vi.mock("../RobotAvatar", () => ({ RobotAvatar: () => <div aria-hidden="true" /> }));
beforeEach(() => { resetPreferences(); chooseLanguage("pt-BR"); });
afterEach(() => { vi.useRealTimers(); });

it("adds a safe default to old preferences and preserves the user's explicit choice", () => {
  expect(sanitizePreferences({ theme: "light" }).mascot).toBe("animated");
  expect(sanitizePreferences({ mascot: "unsupported" }).mascot).toBe("animated");
  expect(sanitizePreferences({ mascot: "hidden" }).mascot).toBe("legacy");
  setPreference("mascot", "static");
  expect(JSON.parse(localStorage.getItem("logibot.preferences")!).mascot).toBe("static");
});

it("offers contextual guidance without answering the quiz or moving focus", () => {
  render(<LearningCompanion context="quiz" />);
  const trigger = screen.getAllByRole("button", { name: "Ver sugestão do LogiBot" })[0];
  trigger.focus();
  fireEvent.click(trigger);
  expect(screen.getByText(/Leia o enunciado com calma/)).toBeVisible();
  expect(trigger).toHaveFocus();
  fireEvent.keyDown(trigger, { key: "Escape" });
  expect(trigger).toHaveFocus();
  expect(screen.getByText(/Leia o enunciado com calma/).closest("[aria-hidden]"))
    .toHaveAttribute("aria-hidden", "true");
  expect(screen.queryByRole("button", { name: "Pausar animações" })).toBeNull();
});

it("allows pausing and selecting the legacy logo without hiding the companion", () => {
  render(<LearningCompanion context="chat" />);
  fireEvent.click(screen.getAllByRole("button", { name: "Ver sugestão do LogiBot" })[0]);
  fireEvent.click(screen.getByRole("button", { name: "Pausar animações" }));
  expect(getPreferences().mascot).toBe("static");
  fireEvent.click(screen.getByRole("button", { name: "Usar logo antiga" }));
  expect(getPreferences().mascot).toBe("legacy");
  expect(screen.getByRole("region", { name: "Assistente LogiBot" })).toBeVisible();
  act(() => setPreference("mascot", "animated"));
  expect(screen.getByRole("region", { name: "Assistente LogiBot" })).toBeVisible();
});

it("keeps reduced-motion users on the static version", () => {
  setPreference("motion", "reduce");
  render(<LearningCompanion context="chat" />);
  fireEvent.click(screen.getAllByRole("button", { name: "Ver sugestão do LogiBot" })[0]);
  expect(screen.getByText(/O movimento reduzido está ativo/)).toBeVisible();
  expect(screen.getByRole("button", { name: "Pausar animações" })).toBeDisabled();
});

it("shows one quiet reminder without moving focus, opening a popup or making a request", () => {
  vi.useFakeTimers();
  const fetch = vi.spyOn(window, "fetch");
  render(<LearningCompanion context="quiz" />);
  const trigger = screen.getAllByRole("button", { name: "Ver sugestão do LogiBot" })[0];
  trigger.focus();
  act(() => vi.advanceTimersByTime(90000));
  expect(screen.getByText("Sem pressa. Quer uma sugestão?")).toBeVisible();
  expect(trigger).toHaveFocus();
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(fetch).not.toHaveBeenCalled();
});
