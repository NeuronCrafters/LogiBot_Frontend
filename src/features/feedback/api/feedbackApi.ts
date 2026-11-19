import { api } from "@/shared/api/httpClient";

export interface FeedbackItem {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  authorName: string | null;
  authorEmail: string | null;
  /** Where the author belongs (students have all three; professors only the institution). */
  schoolId?: string | null;
  schoolName?: string | null;
  courseId?: string | null;
  courseName?: string | null;
  classId?: string | null;
  className?: string | null;
}

export const feedbackApi = {
  async listAll(): Promise<FeedbackItem[]> {
    const response = await api.get("/feedback");
    return response.data;
  },
};
