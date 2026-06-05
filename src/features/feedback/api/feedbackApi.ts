import { api } from "@/shared/api/httpClient";

export interface FeedbackItem {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  authorName: string | null;
  authorEmail: string | null;
}

export const feedbackApi = {
  async listAll(): Promise<FeedbackItem[]> {
    const response = await api.get("/feedback");
    return response.data;
  },
};
