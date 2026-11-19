import { api } from "@/shared/api/httpClient";

export type ChatRating = "up" | "partial" | "down";
export const CHAT_FEEDBACK_REASONS = ["incorrect", "incomplete", "unclear", "off_topic", "other"] as const;
export type ChatFeedbackReason = (typeof CHAT_FEEDBACK_REASONS)[number];

export interface ChatFeedback {
  messageId: string;
  rating: ChatRating;
  reason: ChatFeedbackReason | null;
  comment: string | null;
}

export interface FeedbackGroup { key: string; up: number; partial: number; down: number; total: number; score: number | null }
export interface FeedbackSummary {
  days: number;
  minGroupSize: number;
  total: number;
  up: number;
  partial: number;
  down: number;
  score: number | null;
  reasons: Record<string, number>;
  byRole: { groups: FeedbackGroup[]; hidden: number };
  byCourse: { groups: FeedbackGroup[]; hidden: number };
  byTopic: { groups: FeedbackGroup[]; hidden: number };
  byLanguage: { groups: FeedbackGroup[]; hidden: number };
  recentNotUseful: NotUsefulItem[];
}

export interface NotUsefulItem { rating: ChatRating; question: string; answer: string; reason: ChatFeedbackReason | null; comment: string | null; topic: string | null; language: string | null; ratedAt: string }
export interface NotUsefulPage { items: NotUsefulItem[]; total: number; page: number; pageSize: number; totalPages: number }
export interface ChatFeedbackFilters { days: number; institutionId?: string; courseId?: string; classId?: string }

function filterParams(filters: ChatFeedbackFilters) {
  const params: Record<string, string | number> = { days: filters.days };
  if (filters.institutionId) params.institutionId = filters.institutionId;
  if (filters.courseId) params.courseId = filters.courseId;
  if (filters.classId) params.classId = filters.classId;
  return params;
}

export const chatFeedbackApi = {
  async listSession(sessionId: string): Promise<ChatFeedback[]> {
    const res = await api.get(`/chat-feedback/sessions/${encodeURIComponent(sessionId)}`);
    return res.data;
  },
  async save(messageId: string, body: { rating: ChatRating; reason?: ChatFeedbackReason | null; comment?: string | null }): Promise<ChatFeedback> {
    const res = await api.put(`/chat-feedback/messages/${encodeURIComponent(messageId)}`, body);
    return res.data;
  },
  async summary(filters: ChatFeedbackFilters): Promise<FeedbackSummary> {
    const res = await api.get("/chat-feedback/summary", { params: filterParams(filters) });
    return res.data;
  },
  async notUseful(filters: ChatFeedbackFilters & { page: number; pageSize: number; rating?: "partial" | "down" }): Promise<NotUsefulPage> {
    const params = { ...filterParams(filters), page: filters.page, pageSize: filters.pageSize, ...(filters.rating ? { rating: filters.rating } : {}) };
    const res = await api.get("/chat-feedback/not-useful", { params });
    return res.data;
  },
};
