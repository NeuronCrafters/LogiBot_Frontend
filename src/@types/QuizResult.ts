export interface AnswerDetail {
  question: string;
  selectedOption: {
    question: string;
    isCorrect: string;
    isSelected: string;
  };
  correctOption: string;
  explanation: string;
}

export interface QuizResult {
  detalhes?: { questions?: AnswerDetail[] };
  totalCorrectAnswers: number;
  totalWrongAnswers: number;
}
