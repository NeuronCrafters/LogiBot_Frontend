import { api } from "@/shared/api/httpClient";
import type { BankQuestion, ImportResult, QuestionPayload } from "@/features/questions/types";

export const questionBankApi = {
  async list(filters: { disciplineId?: string; type?: string } = {}): Promise<BankQuestion[]> {
    const params: Record<string, string> = {};
    if (filters.disciplineId) params.disciplineId = filters.disciplineId;
    if (filters.type) params.type = filters.type;
    const res = await api.get("/questions", { params, withCredentials: true });
    return Array.isArray(res.data) ? res.data : [];
  },
  async get(id: string): Promise<BankQuestion> {
    const res = await api.get(`/questions/${encodeURIComponent(id)}`, { withCredentials: true });
    return res.data;
  },
  async create(payload: QuestionPayload): Promise<BankQuestion> {
    const res = await api.post("/questions", payload, { withCredentials: true });
    return res.data;
  },
  async update(id: string, payload: QuestionPayload): Promise<BankQuestion> {
    const res = await api.put(`/questions/${encodeURIComponent(id)}`, payload, { withCredentials: true });
    return res.data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/questions/${encodeURIComponent(id)}`, { withCredentials: true });
  },
  async importQuiz(quizId: string): Promise<ImportResult> {
    const res = await api.post(`/questions/import-quiz/${encodeURIComponent(quizId)}`, undefined, { withCredentials: true });
    return res.data;
  },
};
