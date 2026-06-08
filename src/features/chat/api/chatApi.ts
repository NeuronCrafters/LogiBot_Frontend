import { api } from "@/shared/api/httpClient";

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
  jobId: string;
  sessionId: string;
  userMessageId: string;
  detectedTopic?: string | null;
}

export interface ChatJobStatusResponse {
  status: "queued" | "running" | "done" | "failed";
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

  async getJobStatus(jobId: string): Promise<ChatJobStatusResponse> {
    const response = await api.get(`/chat/jobs/${jobId}`, {
      withCredentials: true,
    });
    return response.data;
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
