// src/services/api/mock/chartDataMock.ts

export const mockUserAnalysis = [
  {
    studentId: "1",
    totalTime: 120,
    totalCorrect: 30,
    totalWrong: 10,
    sessionCount: 5,
    totalInteractions: 80,
    topicsFrequency: [
      { topic: "Variáveis", accessCount: 10, correctCount: 6, wrongCount: 4 },
      { topic: "Funções", accessCount: 12, correctCount: 10, wrongCount: 2 },
    ],
  },
  {
    studentId: "2",
    totalTime: 90,
    totalCorrect: 20,
    totalWrong: 15,
    sessionCount: 4,
    totalInteractions: 60,
    topicsFrequency: [
      { topic: "Variáveis", accessCount: 5, correctCount: 2, wrongCount: 3 },
      { topic: "Funções", accessCount: 8, correctCount: 5, wrongCount: 3 },
    ],
  },
];
