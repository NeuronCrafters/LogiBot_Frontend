import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { AuthContext, type AuthContextData } from "@/app/providers/AuthContext";
import { useAccountDraft } from "../useAccountDraft";
import { ChatInput } from "@/features/chat/components/ChatInput";

const wrapper = (id: string) => ({ children }: { children: ReactNode }) => <AuthContext.Provider value={{ user: { _id: id } } as AuthContextData}>{children}</AuthContext.Provider>;
beforeEach(() => { sessionStorage.clear(); });

it("restores an unsubmitted draft only for the same account", () => {
  const first = renderHook(() => useAccountDraft("quiz.test", {} as Record<string, string>), { wrapper: wrapper("student-a") });
  act(() => first.result.current[1]({ question: "A" }));
  first.unmount();
  const other = renderHook(() => useAccountDraft("quiz.test", {} as Record<string, string>), { wrapper: wrapper("student-b") });
  expect(other.result.current[0]).toEqual({});
  other.unmount();
  const same = renderHook(() => useAccountDraft("quiz.test", {} as Record<string, string>), { wrapper: wrapper("student-a") });
  expect(same.result.current[0]).toEqual({ question: "A" });
  act(() => same.result.current[2]());
  expect(sessionStorage.getItem("logibot.draft.student-a.quiz.test")).toBeNull();
});

it("discards expired drafts", () => {
  sessionStorage.setItem("logibot.draft.student-a.quiz.test", JSON.stringify({ at: Date.now() - 86400001, value: { question: "A" } }));
  const draft = renderHook(() => useAccountDraft("quiz.test", {}), { wrapper: wrapper("student-a") });
  expect(draft.result.current[0]).toEqual({});
});

it("keeps the chat draft if sending fails", async () => {
  const send = vi.fn().mockRejectedValue(new Error("offline"));
  render(<ChatInput sendMessage={send} />, { wrapper: wrapper("student-a") });
  const input = screen.getByRole("textbox");
  fireEvent.change(input, { target: { value: "Minha pergunta ainda não enviada" } });
  await act(async () => { fireEvent.click(screen.getByRole("button")); });
  expect(input).toHaveValue("Minha pergunta ainda não enviada");
  expect(JSON.parse(sessionStorage.getItem("logibot.draft.student-a.chat.input")!).value).toBe("Minha pergunta ainda não enviada");
});
