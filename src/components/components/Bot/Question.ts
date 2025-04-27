// src/components/components/Bot/Question.ts

/**
 * Representa uma pergunta com múltiplas opções.
 */
export interface Question {
  /** Texto da pergunta */
  question: string;
  /** Array de opções (a), (b), (c), (d), (e) */
  options: string[];
}
