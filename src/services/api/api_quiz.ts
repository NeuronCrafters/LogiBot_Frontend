import { api } from "./api";
import { Question } from "@/@types/QuestionType";

interface Button {
  title: string;
  payload: string;
}
interface LevelResponse { buttons: Button[]; }
interface CategoryResponse { message: string; categories: Button[]; }
interface SubcategoryResponse { buttons: Button[]; }
interface GenerateQuizResponse {
  success: boolean;
  assunto: string;
  nivel: string;
  questions: Question[];
}

interface ResultDetail {
  question: string;
  selected: string;
  correct: string;
  isCorrect: boolean;
  explanation: string;
  selectedText: string;
  correctText: string;
}

export interface VerifyQuizResponse {
  success: boolean;
  message: string;
  totalCorrectAnswers: number;
  totalWrongAnswers: number;
  detalhes: ResultDetail[];
}

export const quizService = {
  async listLevels(): Promise<LevelResponse> {
    const response = await api.get("/quiz/levels");
    return response.data;
  },

  async setLevel(nivel: string): Promise<CategoryResponse> {
    const response = await api.post("/quiz/set-level", { nivel });
    return response.data;
  },

  async listSubcategories(category: string): Promise<SubcategoryResponse> {
    const response = await api.post("/quiz/subcategories", { category });
    return response.data;
  },

  async generateQuiz(subtopic: string): Promise<GenerateQuizResponse> {
    const response = await api.post("/quiz/generate", { subtopic });
    return response.data;
  },

  async verifyQuiz(answers: string[]): Promise<VerifyQuizResponse> {
    const response = await api.post("/quiz/verify", { answers });
    return response.data;
  },
};