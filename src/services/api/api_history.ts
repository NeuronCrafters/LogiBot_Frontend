import { api } from "@/services/api/api";

export interface ChatSession {
  sessionId: string;
  title: string;
  lastActivityAt: string;
}

export interface HistoryMessage {
  _id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatHistoryDetail {
  userId: string;
  sessionId: string;
  title: string;
  messages: HistoryMessage[];
}

export const historyService = {
  async getChatSessions(userId: string): Promise<ChatSession[]> {
    const response = await api.get(`/chat/sessions/${userId}`);
    return response.data;
  },

  async getChatMessages(userId: string, sessionId: string): Promise<ChatHistoryDetail> {
    const response = await api.get(`/chat/sessions/${userId}/${sessionId}/messages`);
    return response.data;
  },

  async getQuizHistory(userId: string) {
    const response = await api.get(`/quiz/history/${userId}`);
    return response.data;
  }
};
