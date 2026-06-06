import { api } from "@/shared/api/httpClient";

export interface RetrievedChunk {
  chromaId: string;
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  score: number;
  content: string;
}

interface ChatActionResponse {
  responses: { text: string }[];
  sessionId?: string;
  retrievedChunks?: RetrievedChunk[];
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
  ): Promise<ChatActionResponse> {
    const response = await api.post(
      "/chat/messages",
      { message, senderId, sessionId },
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
