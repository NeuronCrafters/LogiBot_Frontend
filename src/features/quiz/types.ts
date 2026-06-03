export const QUIZ_TOPICS = [
  { value: "variaveis", label: "Variáveis" },
  { value: "listas", label: "Listas" },
  { value: "condicionais", label: "Condicionais" },
  { value: "funcoes", label: "Funções" },
  { value: "operadores_logicos", label: "Operadores Lógicos" },
] as const;

export type QuizTopic = (typeof QUIZ_TOPICS)[number]["value"];

export interface ProfessorQuiz {
  id: string;
  title: string;
  topic: QuizTopic;
  description: string | null;
  disciplineId: string;
  disciplineName: string;
  questionCount: number;
  createdAt: string;
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
