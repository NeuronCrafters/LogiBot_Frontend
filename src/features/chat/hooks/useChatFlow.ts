import { useState, useCallback } from "react";
import {
  chatApi,
  type ChatJobStatusResponse,
  type RetrievedChunk,
} from "@/features/chat/api/chatApi";
import { logger } from "@/shared/lib/logger";

export type ChatMessage = {
  id: string;
  text: string;
  sender: "user" | "bot";
  type: "text" | "typing";
  retrievedChunks?: RetrievedChunk[];
  jobStatus?: "queued" | "running";
  queuePosition?: number | null;
};

type Mode = "none" | "chat";

interface UseChatFlowOptions {
  userId: string;
}

const FAST_POLL_MS = 2000;
const SLOW_POLL_MS = 5000;
const SLOW_POLL_AFTER_MS = 60000;

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function useChatFlow({ userId }: UseChatFlowOptions) {
  const [mode, setMode] = useState<Mode>("none");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  const handleInitialChoice = useCallback((choice: "chat") => {
    if (choice === "chat") setMode("chat");
  }, []);

  const waitForJob = useCallback(async (jobId: string, typingId: string) => {
    const startedAt = Date.now();

    for (;;) {
      const elapsed = Date.now() - startedAt;
      await wait(elapsed > SLOW_POLL_AFTER_MS ? SLOW_POLL_MS : FAST_POLL_MS);

      const job = await chatApi.getJobStatus(jobId);
      if (job.status === "done" || job.status === "failed") return job;

      const jobStatus = job.status;
      setMessages((prev) =>
        prev.map((message) =>
          message.id === typingId
            ? {
                ...message,
                jobStatus,
                queuePosition: job.queuePosition ?? null,
              }
            : message,
        ),
      );
    }
  }, []);

  const replaceTypingWithJobResult = useCallback(
    (typingId: string, job: ChatJobStatusResponse) => {
      if (job.status === "failed") {
        setMessages((prev) =>
          prev
            .filter((m) => m.id !== typingId)
            .concat({
              id: `error-${job.jobId}`,
              text:
                job.errorMessage ||
                "Nao consegui concluir sua resposta agora. Tente novamente.",
              sender: "bot",
              type: "text",
            }),
        );
        return;
      }

      const botText =
        job.responses?.map((response) => response.text).join("\n") ||
        "Nao consegui processar sua mensagem.";

      setMessages((prev) =>
        prev
          .filter((m) => m.id !== typingId)
          .concat({
            id: `bot-${job.jobId}`,
            text: botText,
            sender: "bot",
            type: "text",
            retrievedChunks: job.retrievedChunks?.length
              ? job.retrievedChunks
              : undefined,
          }),
      );
    },
    [],
  );

  const pollJobIntoTyping = useCallback(
    async (jobId: string, typingId: string) => {
      const job = await waitForJob(jobId, typingId);
      if (job.sessionId) setSessionId(job.sessionId);
      replaceTypingWithJobResult(typingId, job);
      return job;
    },
    [replaceTypingWithJobResult, waitForJob],
  );

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
      };

      setMessages((prev) => [...prev, userMsg, typingMsg]);

      try {
        const response = await chatApi.askTutor(text.trim(), userId, sessionId);
        if (response.sessionId) setSessionId(response.sessionId);
        await pollJobIntoTyping(response.jobId, typingMsg.id);
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
    [pollJobIntoTyping, userId, sessionId],
  );

  const resumeOpenJobs = useCallback(
    async (targetSessionId: string) => {
      try {
        const jobs = await chatApi.getOpenJobs(userId, targetSessionId);
        jobs.forEach((job) => {
          const typingId = `typing-${job.jobId}`;
          setMessages((prev) => {
            if (prev.some((message) => message.id === typingId)) return prev;
            return [
              ...prev,
              {
                id: typingId,
                text: "",
                sender: "bot",
                type: "typing",
              },
            ];
          });

          void pollJobIntoTyping(job.jobId, typingId).catch((error) => {
            logger.error("Chat", "Erro ao acompanhar job pendente.", error);
            setMessages((prev) =>
              prev
                .filter((m) => m.id !== typingId)
                .concat({
                  id: `error-${job.jobId}`,
                  text: "Erro ao acompanhar resposta pendente. Tente novamente.",
                  sender: "bot",
                  type: "text",
                }),
            );
          });
        });
      } catch (error) {
        logger.error("Chat", "Erro ao buscar jobs pendentes.", error);
      }
    },
    [pollJobIntoTyping, userId],
  );

  return {
    mode,
    messages,
    handleInitialChoice,
    sendMessage,
    resumeOpenJobs,
    setMessages,
    setMode,
    setSessionId,
    sessionId,
  };
}
