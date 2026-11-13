import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { chatApi, type ChatStreamCallbacks, type ChatStreamResult } from "@/features/chat/api/chatApi";
import { useChatFlow, type ChatMessage } from "@/features/chat/hooks/useChatFlow";
import { ChatMessageList } from "@/features/chat/components/StudentChatContent";
import { chooseLanguage } from "@/i18n";
import { resetPreferences, setPreference } from "@/shared/preferences";

function controlledStream() {
  let callbacks!: ChatStreamCallbacks;
  let finish!: (value: ChatStreamResult) => void;
  let fail!: (error: Error) => void;
  vi.spyOn(chatApi, "streamTutor").mockImplementation((_text, _session, handlers) => {
    callbacks = handlers;
    return new Promise((resolve, reject) => { finish = resolve; fail = reject; });
  });
  return { get callbacks() { return callbacks; }, finish: (value: ChatStreamResult = {}) => finish(value), fail: (error: Error) => fail(error) };
}

function setup() {
  const stream = controlledStream();
  const flow = renderHook(() => useChatFlow({ userId: "student" }));
  const view = render(<ChatMessageList messages={flow.result.current.messages} />);
  const sync = () => view.rerender(<ChatMessageList messages={flow.result.current.messages as ChatMessage[]} />);
  return { stream, flow, sync };
}

beforeEach(() => {
  resetPreferences();
  act(() => chooseLanguage("pt-BR"));
});

describe("exibição das respostas do chat", () => {
  it("modo completo esconde os trechos parciais e mostra a resposta ao terminar", async () => {
    act(() => setPreference("chatDisplay", "complete"));
    const { stream, flow, sync } = setup();
    let sending!: Promise<void>;
    act(() => { sending = flow.result.current.sendMessage("Pergunta"); });
    await waitFor(() => expect(chatApi.streamTutor).toHaveBeenCalled());
    act(() => { stream.callbacks.onToken?.("Uma variável "); });
    sync();
    expect(screen.queryByText(/Uma variável/)).toBeNull();
    expect(screen.getByRole("status")).toBeInTheDocument();
    await act(async () => { stream.callbacks.onToken?.("guarda valores."); stream.callbacks.onDone?.({}); stream.finish(); await sending; });
    sync();
    expect(screen.getByText("Uma variável guarda valores.")).toBeInTheDocument();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("modo completo mostra a resposta quando o fluxo termina sem o evento final", async () => {
    act(() => setPreference("chatDisplay", "complete"));
    const { stream, flow, sync } = setup();
    let sending!: Promise<void>;
    act(() => { sending = flow.result.current.sendMessage("Pergunta"); });
    await waitFor(() => expect(chatApi.streamTutor).toHaveBeenCalled());
    await act(async () => { stream.callbacks.onToken?.("Resposta sem evento final."); stream.finish({ sessionId: "s" }); await sending; });
    sync();
    expect(screen.getByText("Resposta sem evento final.")).toBeInTheDocument();
  });

  it("modo completo mostra a mensagem de erro e não exibe o trecho parcial quando o fluxo falha", async () => {
    act(() => setPreference("chatDisplay", "complete"));
    const { stream, flow, sync } = setup();
    let sending!: Promise<void>;
    act(() => { sending = flow.result.current.sendMessage("Pergunta"); });
    await waitFor(() => expect(chatApi.streamTutor).toHaveBeenCalled());
    act(() => { stream.callbacks.onToken?.("Trecho parcial"); });
    await act(async () => { stream.fail(new Error("rede")); await expect(sending).rejects.toThrow("rede"); });
    sync();
    expect(screen.queryByText(/Trecho parcial/)).toBeNull();
    expect(screen.getByText(/Erro ao processar/i)).toBeInTheDocument();
  });

  it("mudar a preferência durante a geração passa a valer na mesma resposta", async () => {
    const { stream, flow, sync } = setup();
    let sending!: Promise<void>;
    act(() => { sending = flow.result.current.sendMessage("Pergunta"); });
    await waitFor(() => expect(chatApi.streamTutor).toHaveBeenCalled());
    act(() => { stream.callbacks.onToken?.("Parcial"); });
    sync();
    expect(screen.getByText("Parcial")).toBeInTheDocument();
    act(() => setPreference("chatDisplay", "complete"));
    expect(screen.queryByText("Parcial")).toBeNull();
    act(() => setPreference("chatDisplay", "progressive"));
    expect(screen.getByText("Parcial")).toBeInTheDocument();
    await act(async () => { stream.callbacks.onDone?.({}); stream.finish(); await sending; });
  });
});
