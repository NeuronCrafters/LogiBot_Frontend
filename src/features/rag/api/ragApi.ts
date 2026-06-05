import { api } from "@/shared/api/httpClient";
import type {
  RagClass,
  RagDocument,
  RagMode,
  RagSettings,
  RagTestChatResponse,
} from "../types";

export const ragApi = {
  async listClasses(): Promise<RagClass[]> {
    const response = await api.get<{ classes: RagClass[] }>("/rag/classes");
    return response.data.classes;
  },

  async getSettings(classId: string): Promise<RagSettings> {
    const response = await api.get<RagSettings>(
      `/rag/classes/${classId}/settings`,
    );
    return response.data;
  },

  async updateSettings(
    classId: string,
    input: {
      ragMode: RagMode;
      topK: number;
      minScore: number;
      systemPrompt: string | null;
    },
  ): Promise<RagSettings> {
    const response = await api.patch<RagSettings>(
      `/rag/classes/${classId}/settings`,
      input,
    );
    return response.data;
  },

  async listDocuments(classId: string): Promise<RagDocument[]> {
    const response = await api.get<{ documents: RagDocument[] }>(
      `/rag/classes/${classId}/documents`,
    );
    return response.data.documents;
  },

  async uploadDocument(classId: string, file: File, title?: string) {
    const form = new FormData();
    form.append("file", file);
    if (title?.trim()) form.append("title", title.trim());

    const response = await api.post(`/rag/classes/${classId}/documents`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  async deleteDocument(documentId: string) {
    const response = await api.delete(`/rag/documents/${documentId}`);
    return response.data;
  },

  async reprocessDocument(documentId: string) {
    const response = await api.post(`/rag/documents/${documentId}/reprocess`);
    return response.data;
  },

  async testChat(
    classId: string,
    input: {
      message: string;
      override?: {
        ragMode?: RagMode;
        topK?: number;
        minScore?: number;
        systemPrompt?: string | null;
      };
    },
  ): Promise<RagTestChatResponse> {
    const response = await api.post<RagTestChatResponse>(
      `/rag/classes/${classId}/test-chat`,
      input,
    );
    return response.data;
  },
};
