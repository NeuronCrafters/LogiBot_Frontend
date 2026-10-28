import { t, type Language } from "@/i18n";
export const QUIZ_TOPICS = [
  { value: "variaveis", get label() { return t("common.variaveis"); } },
  { value: "listas", get label() { return t("common.listas"); } },
  { value: "condicionais", get label() { return t("common.condicionais"); } },
  { value: "funcoes", get label() { return t("common.funcoes"); } },
  { value: "operadores_logicos", get label() { return t("quiz.operadoresLogicos"); } },
] as const;

export type QuizTopic = (typeof QUIZ_TOPICS)[number]["value"];

export type QuizStatus = "draft" | "published";

export type GenerationSource = "manual" | "ai";

export interface ProfessorQuiz {
  language?: Language | null;
  id: string;
  title: string;
  topic: QuizTopic;
  description: string | null;
  disciplineId: string;
  disciplineName: string;
  classId?: string | null;
  generationSource?: GenerationSource;
  questionCount: number;
  status: QuizStatus;
  createdAt: string;
}

export interface AiQuizGenerationInput {
  language?: Language;
  disciplineId: string;
  theme: string;
  questionCount: number;
  documentIds: string[];
  title?: string;
  description?: string;
}

export interface AiQuizGenerationResult {
  quiz: ProfessorQuiz;
  questions: QuizQuestionWithAnswer[];
  sourceSummary: {
    documentCount: number;
    retrievedChunkCount: number;
  };
}

export interface StudentQuizItem extends ProfessorQuiz {
  attempted: boolean;
  bestScore?: number;
  bestTotalQuestions?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  orderIndex: number;
}

export interface QuizQuestionWithAnswer extends QuizQuestion {
  correctOption: string;
  explanation: string | null;
}

export interface QuizDetail extends Omit<ProfessorQuiz, "questionCount"> {
  questions: QuizQuestion[];
}

export interface AttemptDetail {
  question: string;
  selected: string;
  correct: string;
  isCorrect: boolean;
  explanation: string;
  selectedText: string;
  correctText: string;
}

export interface QuizAttemptResult {
  attemptId: string;
  score: number;
  totalQuestions: number;
  detalhes: AttemptDetail[];
}

export interface QuizHistoryItem {
  quizId: string;
  title: string;
  topic: QuizTopic;
  disciplineName: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
}

export interface ProfessorQuizResult {
  quiz: { id: string; title: string; topic: string };
  attempts: Array<{
    attemptId: string;
    studentId: string;
    studentName: string;
    score: number;
    totalQuestions: number;
    completedAt: string;
  }>;
}
