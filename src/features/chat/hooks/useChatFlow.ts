import { useState, useCallback } from "react";
import { chatApi, type RetrievedChunk } from "@/features/chat/api/chatApi";
import { logger } from "@/shared/lib/logger";

export type ChatMessage = {
  id: string;
  text: string;
  sender: "user" | "bot";
  type: "text" | "typing";
  retrievedChunks?: RetrievedChunk[];
};

type Mode = "none" | "chat";

interface UseChatFlowOptions {
  userId: string;
}

export function useChatFlow({ userId }: UseChatFlowOptions) {
  const [mode, setMode] = useState<Mode>("none");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  const handleInitialChoice = useCallback(
    (choice: "chat") => {
      if (choice === "chat") setMode("chat");
    },
    [],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        text: text.trim(),
        sender: "user",
        type: "text",
      };
      const typingMsg: ChatMessage = {
        id: `typing-${Date.now()}`,
        text: "",
        sender: "bot",
        type: "typing",
      };

      setMessages((prev) => [...prev, userMsg, typingMsg]);
      setInputText("");

      try {
        const response = await chatApi.askTutor(text.trim(), userId, sessionId);

        if (response.sessionId) setSessionId(response.sessionId);

        const botText =
          response.responses?.map((r) => r.text).join("\n") ||
          "Não consegui processar sua mensagem.";

        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          text: botText,
          sender: "bot",
          type: "text",
          retrievedChunks: response.retrievedChunks?.length ? response.retrievedChunks : undefined,
        };

        setMessages((prev) => prev.filter((m) => m.type !== "typing").concat(botMsg));
      } catch (error) {
        logger.error("Chat", "Erro ao enviar mensagem.", error);
        setMessages((prev) =>
          prev
            .filter((m) => m.type !== "typing")
            .concat({
              id: `error-${Date.now()}`,
              text: "Erro ao processar mensagem. Tente novamente.",
              sender: "bot",
              type: "text",
            }),
        );
      }
    },
    [userId, sessionId],
  );

  return {
    mode,
    messages,
    inputText,
    setInputText,
    handleInitialChoice,
    sendMessage,
    setMessages,
    setMode,
    setSessionId,
    sessionId,
  };
}
