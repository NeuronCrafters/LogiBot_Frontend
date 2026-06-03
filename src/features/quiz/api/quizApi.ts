import { api } from "@/shared/api/httpClient";
import type {
  ProfessorQuiz,
  ProfessorQuizResult,
  QuizAttemptResult,
  QuizDetail,
  QuizHistoryItem,
  QuizQuestionWithAnswer,
  StudentQuizItem,
} from "@/features/quiz/types";

// ── Professor ──────────────────────────────────────────────────────────────────

export const professorQuizApi = {
  async getMyQuizzes(disciplineId?: string): Promise<ProfessorQuiz[]> {
    const params = disciplineId ? `?disciplineId=${disciplineId}` : "";
    const res = await api.get(`/quiz/professor${params}`, { withCredentials: true });
    return res.data;
  },

  async createQuiz(data: {
    title: string;
    disciplineId: string;
    topic: string;
    description?: string;
  }): Promise<ProfessorQuiz> {
    const res = await api.post("/quiz/professor", data, { withCredentials: true });
    return res.data;
  },

  async updateQuiz(
    id: string,
    data: Partial<{ title: string; topic: string; description: string; disciplineId: string }>,
  ): Promise<ProfessorQuiz> {
    const res = await api.put(`/quiz/professor/${id}`, data, { withCredentials: true });
    return res.data;
  },

  async deleteQuiz(id: string): Promise<void> {
    await api.delete(`/quiz/professor/${id}`, { withCredentials: true });
  },

  async getQuestions(quizId: string): Promise<QuizQuestionWithAnswer[]> {
    const res = await api.get(`/quiz/professor/${quizId}/questions`, { withCredentials: true });
    return res.data;
  },

  async addQuestion(
    quizId: string,
    data: {
      question: string;
      options: string[];
      correctOption: string;
      explanation?: string;
    },
  ): Promise<QuizQuestionWithAnswer> {
    const res = await api.post(`/quiz/professor/${quizId}/questions`, data, {
      withCredentials: true,
    });
    return res.data;
  },

  async updateQuestion(
    quizId: string,
    questionId: string,
    data: Partial<{
      question: string;
      options: string[];
      correctOption: string;
      explanation: string;
    }>,
  ): Promise<QuizQuestionWithAnswer> {
    const res = await api.put(`/quiz/professor/${quizId}/questions/${questionId}`, data, {
      withCredentials: true,
    });
    return res.data;
  },

  async deleteQuestion(quizId: string, questionId: string): Promise<void> {
    await api.delete(`/quiz/professor/${quizId}/questions/${questionId}`, {
      withCredentials: true,
    });
  },

  async getResults(quizId: string): Promise<ProfessorQuizResult> {
    const res = await api.get(`/quiz/professor/${quizId}/results`, { withCredentials: true });
    return res.data;
  },
};

// ── Student ────────────────────────────────────────────────────────────────────

export const studentQuizApi = {
  async getHub(): Promise<StudentQuizItem[]> {
    const res = await api.get("/quiz/student/hub", { withCredentials: true });
    return res.data;
  },

  async getQuiz(id: string): Promise<QuizDetail> {
    const res = await api.get(`/quiz/student/${id}`, { withCredentials: true });
    return res.data;
  },

  async submitAttempt(
    id: string,
    answers: Record<string, string>,
  ): Promise<QuizAttemptResult> {
    const res = await api.post(
      `/quiz/student/${id}/attempt`,
      { answers },
      { withCredentials: true },
    );
    return res.data;
  },
};

// ── Shared ─────────────────────────────────────────────────────────────────────

export const quizHistoryApi = {
  async getHistory(userId: string): Promise<QuizHistoryItem[]> {
    const res = await api.get(`/quiz/history/${userId}`, { withCredentials: true });
    return res.data;
  },
};
