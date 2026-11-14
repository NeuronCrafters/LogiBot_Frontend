import { t, useLocale, getLanguage, type Language } from "@/i18n";
import { useState, useCallback } from "react";
import {
  chatApi,
  type ChatStreamStage,
  type RetrievedChunk,
} from "@/features/chat/api/chatApi";
import { logger } from "@/shared/lib/logger";

export type ChatMessage = {
  id: string;
  text: string;
  sender: "user" | "bot";
  type: "text" | "typing";
  retrievedChunks?: RetrievedChunk[];
  streamStage?: ChatStreamStage;
  streaming?: boolean;
  outputLanguage?: Language;
  serverId?: string;
  failed?: boolean;
};

type Mode = "none" | "chat";

interface UseChatFlowOptions {
  userId: string;
}

export function useChatFlow(_options: UseChatFlowOptions) {
  const locale = useLocale();

  const [mode, setMode] = useState<Mode>("none");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  const handleInitialChoice = useCallback((choice: "chat") => {
    if (choice === "chat") setMode("chat");
  }, []);

  const sendMessage = useCallback(
    async (text: string, editMessageId?: string) => {
      if (!text.trim()) return;
      const editIndex = editMessageId ? messages.findIndex(message => message.id === editMessageId && message.sender === "user") : -1;
      if (editMessageId && editIndex < 0) throw new Error(t("chat.editFailed", {}, locale));
      const previousMessages = messages;
      let accepted = false;

      const now = Date.now();
      const userMsg: ChatMessage = {
        id: editMessageId || `user-${now}`,
        text: text.trim(),
        sender: "user",
        type: "text",
      };
      const typingMsg: ChatMessage = {
        outputLanguage: getLanguage(),
        id: `typing-${now}`,
        text: "",
        sender: "bot",
        type: "typing",
        streamStage: "queued",
      };

      setMessages((prev) => [...(editMessageId ? prev.slice(0, editIndex) : prev), userMsg, typingMsg]);

      try {
        let streamedText = "";
        let receivedToken = false;

        const result = await chatApi.streamTutor(text.trim(), sessionId, {
          onSession: (event) => {
            accepted = true;
            if (event.sessionId) setSessionId(event.sessionId);
            if (event.userMessageId) setMessages(prev => prev.map(message => message.id === userMsg.id ? { ...message, id: event.userMessageId } : message));
          },
          onStatus: (event) => {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === typingMsg.id
                  ? { ...message, streamStage: event.stage }
                  : message,
              ),
            );
          },
          onRetrieval: (event) => {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === typingMsg.id
                  ? {
                      ...message,
                      retrievedChunks: event.retrievedChunks?.length
                        ? event.retrievedChunks
                        : undefined,
                    }
                  : message,
              ),
            );
          },
          onToken: (token) => {
            streamedText += token;
            receivedToken = true;

            setMessages((prev) =>
              prev.map((message) =>
                message.id === typingMsg.id
                  ? {
                      ...message,
                      text: streamedText,
                      type: "text",
                      streamStage: undefined,
                      streaming: true,
                    }
                  : message,
              ),
            );
          },
          onDone: (event) => {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === typingMsg.id
                  ? {
                      ...message,
                      type: "text",
                      text: streamedText || message.text,
                      streamStage: undefined,
                      streaming: false,
                      serverId: event.assistantMessageId,
                      retrievedChunks: event.retrievedChunks?.length
                        ? event.retrievedChunks
                        : message.retrievedChunks,
                    }
                  : message,
              ),
            );
          },
        }, editMessageId);

        if (result.sessionId) setSessionId(result.sessionId);
        setMessages((prev) =>
          prev.map((message) =>
            message.id === typingMsg.id && message.streaming
              ? { ...message, streaming: false }
              : message,
          ),
        );

        if (!receivedToken) {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === typingMsg.id
                ? {
                    ...message,
                    type: "text",
                    text: streamedText || t("chat.respostaConcluida", {}, locale),
                    streamStage: undefined,
                    retrievedChunks: result.retrievedChunks?.length
                      ? result.retrievedChunks
                      : message.retrievedChunks,
                  }
                : message,
            ),
          );
        }
      } catch (error) {
        logger.error("Chat", "Erro ao enviar mensagem.", error);
        if (editMessageId && !accepted) setMessages(previousMessages);
        else setMessages((prev) =>
          prev
            .filter((m) => m.id !== typingMsg.id)
            .concat({
              id: `error-${Date.now()}`,
              text: t("chat.erroAoProcessarMensagemTenteNovamente", {}, locale),
              sender: "bot",
              type: "text",
              failed: true,
            }),
        );
        throw error;
      }
    },
    [sessionId, locale, messages],
  );

  return {
    mode,
    messages,
    handleInitialChoice,
    sendMessage,
    setMessages,
    setMode,
    setSessionId,
    sessionId,
  };
}
