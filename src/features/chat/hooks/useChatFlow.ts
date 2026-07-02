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
};

type Mode = "none" | "chat";

interface UseChatFlowOptions {
  userId: string;
}

export function useChatFlow(_options: UseChatFlowOptions) {
  const [mode, setMode] = useState<Mode>("none");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  const handleInitialChoice = useCallback((choice: "chat") => {
    if (choice === "chat") setMode("chat");
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const now = Date.now();
      const userMsg: ChatMessage = {
        id: `user-${now}`,
        text: text.trim(),
        sender: "user",
        type: "text",
      };
      const typingMsg: ChatMessage = {
        id: `typing-${now}`,
        text: "",
        sender: "bot",
        type: "typing",
        streamStage: "queued",
      };

      setMessages((prev) => [...prev, userMsg, typingMsg]);

      try {
        let streamedText = "";
        let receivedToken = false;

        const result = await chatApi.streamTutor(text.trim(), sessionId, {
          onSession: (event) => {
            if (event.sessionId) setSessionId(event.sessionId);
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
                      retrievedChunks: event.retrievedChunks?.length
                        ? event.retrievedChunks
                        : message.retrievedChunks,
                    }
                  : message,
              ),
            );
          },
        });

        if (result.sessionId) setSessionId(result.sessionId);

        if (!receivedToken) {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === typingMsg.id
                ? {
                    ...message,
                    type: "text",
                    text: streamedText || "Resposta concluida.",
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
        setMessages((prev) =>
          prev
            .filter((m) => m.id !== typingMsg.id)
            .concat({
              id: `error-${Date.now()}`,
              text: "Erro ao processar mensagem. Tente novamente.",
              sender: "bot",
              type: "text",
            }),
        );
      }
    },
    [sessionId],
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
