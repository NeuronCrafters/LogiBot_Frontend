import { api } from "@/shared/api/httpClient";
import type { BlindReview, BlindReviewItem, ExamAnswer, ExamAttempt, ExamPayload, ExamResults, ManagedExam, ManagedExamSummary, StudentExamSummary } from "@/features/exams/types";

const enc = encodeURIComponent;
const opts = { withCredentials: true };

export const examsApi = {
  // Staff
  async listManaged(): Promise<ManagedExamSummary[]> { const res = await api.get("/exams/manage", opts); return Array.isArray(res.data) ? res.data : []; },
  async getManaged(id: string): Promise<ManagedExam> { return (await api.get(`/exams/manage/${enc(id)}`, opts)).data; },
  async create(payload: ExamPayload): Promise<ManagedExam> { return (await api.post("/exams/manage", payload, opts)).data; },
  async update(id: string, payload: ExamPayload): Promise<ManagedExam> { return (await api.put(`/exams/manage/${enc(id)}`, payload, opts)).data; },
  async remove(id: string): Promise<void> { await api.delete(`/exams/manage/${enc(id)}`, opts); },
  async publish(id: string): Promise<ManagedExam> { return (await api.post(`/exams/manage/${enc(id)}/publish`, undefined, opts)).data; },
  async close(id: string): Promise<ManagedExam> { return (await api.post(`/exams/manage/${enc(id)}/close`, undefined, opts)).data; },
  async getBlindReview(id: string): Promise<BlindReview> { return (await api.get(`/exams/manage/${enc(id)}/blind-review`, opts)).data; },
  async saveReview(reviewId: string, score: number, comment: string): Promise<BlindReviewItem> {
    return (await api.put(`/exams/manage/blind-review/${enc(reviewId)}`, { score, comment }, opts)).data;
  },
  async release(id: string): Promise<{ examId: string; released: boolean; submissions: number }> { return (await api.post(`/exams/manage/${enc(id)}/release`, undefined, opts)).data; },
  async getResults(id: string): Promise<ExamResults> { return (await api.get(`/exams/manage/${enc(id)}/results`, opts)).data; },
  // Students
  async listForStudent(): Promise<StudentExamSummary[]> { const res = await api.get("/exams/student", opts); return Array.isArray(res.data) ? res.data : []; },
  async getAttempt(id: string): Promise<ExamAttempt> { return (await api.get(`/exams/${enc(id)}/attempt`, opts)).data; },
  async start(id: string): Promise<ExamAttempt> { return (await api.post(`/exams/${enc(id)}/start`, undefined, opts)).data; },
  async saveDraft(id: string, answers: Record<string, ExamAnswer>, events: Record<string, Array<{ t: number; action: string }>>): Promise<{ savedAt: string; deadlineAt: string | null; serverNow: string }> {
    return (await api.put(`/exams/${enc(id)}/draft`, { answers, events }, opts)).data;
  },
  async submit(id: string, answers: Record<string, ExamAnswer>, events: Record<string, Array<{ t: number; action: string }>>): Promise<ExamAttempt> {
    return (await api.post(`/exams/${enc(id)}/submit`, { answers, events }, opts)).data;
  },
};
