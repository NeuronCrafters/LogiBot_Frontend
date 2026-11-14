import { t, requestLanguageHeaders, type Language } from "@/i18n";
import { api, apiKey, baseURL } from "@/shared/api/httpClient";

export interface RetrievedChunk {
  chromaId: string;
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  score: number;
  content: string;
}

export interface ChatSubmitResponse {
  status: "queued";
  outputLanguage: Language;
  jobId: string;
  sessionId: string;
  userMessageId: string;
  detectedTopic?: string | null;
}

export interface ChatJobStatusResponse {
  status: "queued" | "running" | "done" | "failed";
  outputLanguage: Language;
  jobId: string;
  sessionId: string;
  userMessageId: string;
  responses?: { text: string }[];
  provider?: string;
  retrievedChunks?: RetrievedChunk[];
  timingsMs?: Record<string, number>;
  queuePosition?: number | null;
  errorMessage?: string;
}

export type ChatStreamStage = "queued" | "history" | "rag" | "agent";

export interface ChatStreamSessionEvent {
  sessionId: string;
  userMessageId: string;
}

export interface ChatStreamDoneEvent {
  assistantMessageId?: string;
  provider?: string;
  retrievedChunks?: RetrievedChunk[];
  timingsMs?: Record<string, number>;
  usage?: unknown;
}

export interface ChatStreamCallbacks {
  onSession?: (event: ChatStreamSessionEvent) => void;
  onStatus?: (event: { stage: ChatStreamStage }) => void;
  onRetrieval?: (event: { retrievedChunks: RetrievedChunk[] }) => void;
  onToken?: (text: string) => void;
  onDone?: (event: ChatStreamDoneEvent) => void;
  onError?: (message: string) => void;
}

export interface ChatStreamResult extends ChatStreamDoneEvent {
  sessionId?: string;
  userMessageId?: string;
}

type SseDispatch = (event: string, data: string) => void;

function createSseParser(dispatch: SseDispatch) {
  let eventName = "message";
  let dataLines: string[] = [];
  let lineBuffer = "";

  function flushEvent() {
    if (dataLines.length === 0) {
      eventName = "message";
      return;
    }

    dispatch(eventName, dataLines.join("\n"));
    eventName = "message";
    dataLines = [];
  }

  function processLine(rawLine: string) {
    const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;

    if (!line) {
      flushEvent();
      return;
    }

    if (line.startsWith(":")) return;

    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
      return;
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  return {
    push(chunk: string) {
      lineBuffer += chunk;
      const lines = lineBuffer.split("\n");
      lineBuffer = lines.pop() ?? "";
      lines.forEach(processLine);
    },
    end() {
      if (lineBuffer) {
        processLine(lineBuffer);
        lineBuffer = "";
      }
      flushEvent();
    },
  };
}

function parseSseJson<T>(data: string): T | null {
  try {
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

export const chatApi = {
  async sendMessage(message: string) {
    const response = await api.post(
      "/chat/messages",
      { message },
      { withCredentials: true },
    );
    return response.data;
  },

  async askTutor(
    message: string,
    senderId: string,
    sessionId?: string,
  ): Promise<ChatSubmitResponse> {
    const response = await api.post(
      "/chat/messages",
      { message, senderId, sessionId },
      { withCredentials: true },
    );
    return response.data;
  },

  async streamTutor(
    message: string,
    sessionId: string | undefined,
    callbacks: ChatStreamCallbacks = {},
    editMessageId?: string,
  ): Promise<ChatStreamResult> {
    const response = await fetch(`${baseURL}/chat/messages/stream`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...requestLanguageHeaders(),
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ message, sessionId, editMessageId }),
    });

    if (!response.ok) {
      if (response.status === 401) window.dispatchEvent(new Event("logibot:unauthorized"));
      throw new Error(t("chat.streamFalhouComStatusValue0", { value0: response.status }));
    }

    if (!response.body) {
      throw new Error(t("chat.respostaDeStreamSemBody"));
    }

    const result: ChatStreamResult = {};
    const decoder = new TextDecoder();

    const parser = createSseParser((event, data) => {
      if (event === "session") {
        const payload = parseSseJson<ChatStreamSessionEvent>(data);
        if (!payload) return;
        result.sessionId = payload.sessionId;
        result.userMessageId = payload.userMessageId;
        callbacks.onSession?.(payload);
        return;
      }

      if (event === "status") {
        const payload = parseSseJson<{ stage: ChatStreamStage }>(data);
        if (payload) callbacks.onStatus?.(payload);
        return;
      }

      if (event === "retrieval") {
        const payload = parseSseJson<{ retrievedChunks: RetrievedChunk[] }>(
          data,
        );
        if (!payload) return;
        result.retrievedChunks = payload.retrievedChunks;
        callbacks.onRetrieval?.(payload);
        return;
      }

      if (event === "token") {
        const payload = parseSseJson<{ text: string }>(data);
        if (payload?.text) callbacks.onToken?.(payload.text);
        return;
      }

      if (event === "done") {
        const payload = parseSseJson<ChatStreamDoneEvent>(data) ?? {};
        result.provider = payload.provider;
        result.assistantMessageId = payload.assistantMessageId;
        result.retrievedChunks =
          payload.retrievedChunks ?? result.retrievedChunks;
        result.timingsMs = payload.timingsMs;
        result.usage = payload.usage;
        callbacks.onDone?.(payload);
        return;
      }

      if (event === "error") {
        const payload = parseSseJson<{ message?: string }>(data);
        const message =
          payload?.message || t("chat.naoConseguiConcluirSuaRespostaAgora");
        callbacks.onError?.(message);
        throw new Error(message);
      }
    });

    const reader = response.body.getReader();

    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        parser.push(decoder.decode(value, { stream: true }));
      }
      parser.push(decoder.decode());
      parser.end();
      return result;
    } finally {
      reader.releaseLock();
    }
  },

  async getJobStatus(jobId: string): Promise<ChatJobStatusResponse> {
    const response = await api.get(`/chat/jobs/${jobId}`, {
      withCredentials: true,
    });
    return response.data;
  },

  async getFollowUps(sessionId: string, messageId: string, signal?: AbortSignal): Promise<string[]> {
    const response = await api.post(`/chat/sessions/${encodeURIComponent(sessionId)}/follow-ups`, { messageId }, { signal });
    return Array.isArray(response.data?.suggestions) ? response.data.suggestions.filter((value: unknown) => typeof value === "string").slice(0, 3) : [];
  },

  async getOpenJobs(
    userId: string,
    sessionId: string,
  ): Promise<ChatJobStatusResponse[]> {
    const response = await api.get(
      `/chat/sessions/${userId}/${sessionId}/jobs/open`,
      { withCredentials: true },
    );
    return response.data;
  },

  async conversar() {
    const response = await api.post(
      "/chat/messages",
      { message: "conversar" },
      { withCredentials: true },
    );
    return response.data;
  },
};
