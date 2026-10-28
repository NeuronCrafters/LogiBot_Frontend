import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { chatApi, type ChatStreamCallbacks, type ChatStreamResult } from "@/features/chat/api/chatApi";
import { useChatFlow } from "@/features/chat/hooks/useChatFlow";
import { chooseLanguage } from "..";

it("preserva tokens e idioma da geração enquanto a interface muda, e aplica a mudança à próxima", async () => {
  let callbacks: ChatStreamCallbacks;
  let finish: (value: ChatStreamResult) => void;
  const stream = vi.spyOn(chatApi, "streamTutor").mockImplementation((_text, _session, handlers) => {
    callbacks = handlers;
    return new Promise(resolve => { finish = resolve; });
  });
  act(() => chooseLanguage("en-US"));
  const { result } = renderHook(() => useChatFlow({ userId: "student" }));
  let first: Promise<void>;
  act(() => { first = result.current.sendMessage("Pergunta original em português"); });
  await waitFor(() => expect(stream).toHaveBeenCalledTimes(1));
  act(() => { callbacks.onSession?.({ sessionId: "session", userMessageId: "user" }); callbacks.onToken?.("English first "); });
  act(() => chooseLanguage("es-ES"));
  expect(result.current.messages.at(-1)).toMatchObject({ text: "English first ", outputLanguage: "en-US" });
  await act(async () => { callbacks.onToken?.("answer."); callbacks.onDone?.({ provider: "openrouter" }); finish({ sessionId: "session" }); await first; });
  expect(result.current.messages[0].text).toBe("Pergunta original em português");
  expect(result.current.messages[1]).toMatchObject({ text: "English first answer.", outputLanguage: "en-US" });
  let next: Promise<void>;
  act(() => { next = result.current.sendMessage("Outra pergunta original"); });
  expect(result.current.messages.at(-1)?.outputLanguage).toBe("es-ES");
  await act(async () => { callbacks.onToken?.("Respuesta en español."); callbacks.onDone?.({}); finish({}); await next; });
  expect(result.current.messages[1].text).toBe("English first answer.");
  expect(result.current.messages.at(-1)?.text).toBe("Respuesta en español.");
});
