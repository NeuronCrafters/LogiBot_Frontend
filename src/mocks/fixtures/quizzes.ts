import type {
  ProfessorQuiz,
  ProfessorQuizResult,
  QuizAttemptResult,
  QuizHistoryItem,
  QuizQuestionWithAnswer,
  StudentQuizItem,
} from "@/features/quiz/types";
import {
  DISC_ESTRUTURAS_ID,
  DISC_LOGICA_ID,
  QUIZ_CONDICIONAIS_ID,
  QUIZ_FUNCOES_DRAFT_ID,
  QUIZ_LISTAS_ID,
  QUIZ_OPERADORES_ID,
  QUIZ_VARIAVEIS_ID,
  STUDENT_USER_ID,
} from "./ids";

function iso(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 86_400_000).toISOString();
}

const disciplineRefLogica = { id: DISC_LOGICA_ID, name: "Programming Logic" };
const disciplineRefEstruturas = { id: DISC_ESTRUTURAS_ID, name: "Data Structures" };

// ── Quiz: Variáveis e Tipos (publicado, já respondido pelo aluno) ──────────────

export const quizVariaveisQuestions: QuizQuestionWithAnswer[] = [
  {
    id: "q-var-1",
    orderIndex: 0,
    question: "Which data type is used in Python to represent integers?",
    options: ["int", "float", "str", "bool"],
    correctOption: "A",
    explanation: "`int` represents integers; `float` is for decimal numbers.",
  },
  {
    id: "q-var-2",
    orderIndex: 1,
    question: "What does the line `x = 10` do in Python?",
    options: [
      "Compares x with 10",
      "Creates the variable x and assigns the value 10 to it",
      "Declares a constant named 10",
      "Raises a syntax error",
    ],
    correctOption: "B",
    explanation: "The `=` operator is the assignment operator: it creates (or updates) the variable x with the value 10.",
  },
  {
    id: "q-var-3",
    orderIndex: 2,
    question: "Which symbol starts a single-line comment in Python?",
    options: ["#", "//", "/* */", "--"],
    correctOption: "A",
    explanation: "In Python, line comments start with `#`.",
  },
  {
    id: "q-var-4",
    orderIndex: 3,
    question: "Which values can a boolean variable take?",
    options: ["True or False", "0 to 9", "Any text", "Only negative numbers"],
    correctOption: "A",
    explanation: "The `bool` type has only two possible values: `True` and `False`.",
  },
  {
    id: "q-var-5",
    orderIndex: 4,
    question: "What happens when you try to add a string and a number without conversion in Python?",
    options: [
      "Type error (TypeError)",
      "Automatic concatenation",
      "The result is always zero",
      "Python automatically converts to float",
    ],
    correctOption: "A",
    explanation: "Python does not convert types automatically; you must use `int()`, `str()` or `float()` explicitly.",
  },
];

export const quizVariaveisProfessor: ProfessorQuiz = {
  id: QUIZ_VARIAVEIS_ID,
  title: "Variables and Types Quiz",
  topic: "variaveis",
  description: "Review of the basic concepts of variables, primitive types and type conversion.",
  disciplineId: DISC_LOGICA_ID,
  disciplineName: disciplineRefLogica.name,
  disciplines: [disciplineRefLogica],
  generationSource: "manual",
  questionCount: quizVariaveisQuestions.length,
  status: "published",
  createdAt: iso(18),
};

// ── Quiz: Estruturas Condicionais (publicado, ainda não respondido) ───────────

export const quizCondicionaisQuestions: QuizQuestionWithAnswer[] = [
  {
    id: "q-cond-1",
    orderIndex: 0,
    question: "Which structure allows running a block of code only if a condition is true?",
    options: ["if", "for", "def", "import"],
    correctOption: "A",
    explanation: "`if` runs a block only when the evaluated condition is `True`.",
  },
  {
    id: "q-cond-2",
    orderIndex: 1,
    question: "What does `elif` allow you to do?",
    options: [
      "End the program",
      "Test an additional condition if the previous one is false",
      "Repeat a block of code",
      "Import a library",
    ],
    correctOption: "B",
    explanation: "`elif` (else if) tests another condition when the previous `if` was not satisfied.",
  },
  {
    id: "q-cond-3",
    orderIndex: 2,
    question: "Which logical operator requires both conditions to be true?",
    options: ["and", "or", "not", "xor"],
    correctOption: "A",
    explanation: "`and` only returns true if both conditions involved are true.",
  },
  {
    id: "q-cond-4",
    orderIndex: 3,
    question: "What does the `else` block represent in a conditional structure?",
    options: [
      "A mandatory condition",
      "The path executed when no previous condition is true",
      "A type of loop",
      "A built-in Python function",
    ],
    correctOption: "B",
    explanation: "`else` covers all cases not handled by the previous `if`/`elif` conditions.",
  },
];

export const quizCondicionaisProfessor: ProfessorQuiz = {
  id: QUIZ_CONDICIONAIS_ID,
  title: "Conditional Structures in Practice",
  topic: "condicionais",
  description: "Practice if/elif/else and logical operators with everyday cases.",
  disciplineId: DISC_LOGICA_ID,
  disciplineName: disciplineRefLogica.name,
  disciplines: [disciplineRefLogica],
  generationSource: "manual",
  questionCount: quizCondicionaisQuestions.length,
  status: "published",
  createdAt: iso(9),
};

// ── Quiz: Funções e Modularização (rascunho, gerado por IA) ───────────────────

export const quizFuncoesQuestions: QuizQuestionWithAnswer[] = [
  {
    id: "q-func-1",
    orderIndex: 0,
    question: "Which keyword is used to declare a function in Python?",
    options: ["def", "func", "function", "lambda"],
    correctOption: "A",
    explanation: "`def` starts the declaration of a named function in Python.",
  },
  {
    id: "q-func-2",
    orderIndex: 1,
    question: "What is the `return` statement used for inside a function?",
    options: [
      "End the program",
      "Return a value to whoever called the function",
      "Print a value to the screen",
      "Declare a global variable",
    ],
    correctOption: "B",
    explanation: "`return` sends a value back to the point where the function was called.",
  },
  {
    id: "q-func-3",
    orderIndex: 2,
    question: "What is a function parameter?",
    options: [
      "The function name",
      "An input value the function receives to work with",
      "The final result of the function",
      "A comment inside the function",
    ],
    correctOption: "B",
    explanation: "Parameters are the variables declared in parentheses that receive values when the function is called.",
  },
];

export const quizFuncoesDraftProfessor: ProfessorQuiz = {
  id: QUIZ_FUNCOES_DRAFT_ID,
  title: "Functions and Modularization",
  topic: "funcoes",
  description: "Automatically generated from the subject material to review functions.",
  disciplineId: DISC_ESTRUTURAS_ID,
  disciplineName: disciplineRefEstruturas.name,
  disciplines: [disciplineRefEstruturas],
  generationSource: "ai",
  questionCount: quizFuncoesQuestions.length,
  status: "draft",
  createdAt: iso(1),
};

// ── Quiz: Manipulação de Listas (publicado, já respondido pelo aluno) ─────────

export const quizListasQuestions: QuizQuestionWithAnswer[] = [
  {
    id: "q-list-1",
    orderIndex: 0,
    question: "Which symbol is used to create an empty list in Python?",
    options: ["[]", "{}", "()", "<>"],
    correctOption: "A",
    explanation: "Square brackets `[]` create an empty list; curly braces `{}` create a dictionary or set.",
  },
  {
    id: "q-list-2",
    orderIndex: 1,
    question: "What is the index of the first element of a list in Python?",
    options: ["0", "1", "-1", "Depends on the list"],
    correctOption: "A",
    explanation: "Python uses zero-based indexing: the first element is at index 0.",
  },
  {
    id: "q-list-3",
    orderIndex: 2,
    question: "Which method adds an element to the end of a list?",
    options: [".append()", ".add()", ".push()", ".insert(0)"],
    correctOption: "A",
    explanation: "`.append()` inserts an element at the end of the list.",
  },
  {
    id: "q-list-4",
    orderIndex: 3,
    question: "What does the expression `my_list[-1]` return?",
    options: [
      "The last element of the list",
      "An error",
      "The first element",
      "An empty list",
    ],
    correctOption: "A",
    explanation: "Negative indices count from the end; `-1` is always the last element.",
  },
];

export const quizListasProfessor: ProfessorQuiz = {
  id: QUIZ_LISTAS_ID,
  title: "List Manipulation",
  topic: "listas",
  description: "Creation, indexing and essential list methods in Python.",
  disciplineId: DISC_LOGICA_ID,
  disciplineName: disciplineRefLogica.name,
  disciplines: [disciplineRefLogica],
  generationSource: "manual",
  questionCount: quizListasQuestions.length,
  status: "published",
  createdAt: iso(14),
};

// ── Quiz: Operadores Lógicos no Dia a Dia (publicado, ainda não respondido) ───

export const quizOperadoresQuestions: QuizQuestionWithAnswer[] = [
  {
    id: "q-op-1",
    orderIndex: 0,
    question: "Which operator returns true if at least one of the conditions is true?",
    options: ["or", "and", "not", "xor"],
    correctOption: "A",
    explanation: "`or` returns `True` when at least one of the evaluated conditions is true.",
  },
  {
    id: "q-op-2",
    orderIndex: 1,
    question: "What does the `not` operator do?",
    options: [
      "Inverts the logical value of a condition",
      "Adds two values",
      "Compares two values",
      "Creates a loop",
    ],
    correctOption: "A",
    explanation: "`not True` becomes `False` and vice versa.",
  },
  {
    id: "q-op-3",
    orderIndex: 2,
    question: "What is the result of `True and False`?",
    options: ["False", "True", "Error", "None"],
    correctOption: "A",
    explanation: "`and` is only true when both operands are true.",
  },
  {
    id: "q-op-4",
    orderIndex: 3,
    question: "In which situation are `or` and `and` usually combined in the same expression?",
    options: [
      "To validate multiple complex conditions, such as minimum age and a valid document",
      "Only in for loops",
      "Only in recursive functions",
      "They can never be combined",
    ],
    correctOption: "A",
    explanation: "It is common to combine `and`/`or` to check multiple business rules in a single condition.",
  },
];

export const quizOperadoresProfessor: ProfessorQuiz = {
  id: QUIZ_OPERADORES_ID,
  title: "Logical Operators in Everyday Life",
  topic: "operadores_logicos",
  description: "Combine and, or and not to validate real-world conditions.",
  disciplineId: DISC_LOGICA_ID,
  disciplineName: disciplineRefLogica.name,
  disciplines: [disciplineRefLogica],
  generationSource: "manual",
  questionCount: quizOperadoresQuestions.length,
  status: "published",
  createdAt: iso(5),
};

// ── Coleções agregadas ─────────────────────────────────────────────────────────

export const professorQuizzes: ProfessorQuiz[] = [
  quizFuncoesDraftProfessor,
  quizOperadoresProfessor,
  quizListasProfessor,
  quizCondicionaisProfessor,
  quizVariaveisProfessor,
];

export const questionsByQuizId: Record<string, QuizQuestionWithAnswer[]> = {
  [QUIZ_VARIAVEIS_ID]: quizVariaveisQuestions,
  [QUIZ_CONDICIONAIS_ID]: quizCondicionaisQuestions,
  [QUIZ_FUNCOES_DRAFT_ID]: quizFuncoesQuestions,
  [QUIZ_LISTAS_ID]: quizListasQuestions,
  [QUIZ_OPERADORES_ID]: quizOperadoresQuestions,
};

export const professorQuizById: Record<string, ProfessorQuiz> = {
  [QUIZ_VARIAVEIS_ID]: quizVariaveisProfessor,
  [QUIZ_CONDICIONAIS_ID]: quizCondicionaisProfessor,
  [QUIZ_FUNCOES_DRAFT_ID]: quizFuncoesDraftProfessor,
  [QUIZ_LISTAS_ID]: quizListasProfessor,
  [QUIZ_OPERADORES_ID]: quizOperadoresProfessor,
};

export const linkedDisciplineIdsByQuizId: Record<string, string[]> = {
  [QUIZ_VARIAVEIS_ID]: [DISC_LOGICA_ID],
  [QUIZ_CONDICIONAIS_ID]: [DISC_LOGICA_ID],
  [QUIZ_FUNCOES_DRAFT_ID]: [DISC_ESTRUTURAS_ID],
  [QUIZ_LISTAS_ID]: [DISC_LOGICA_ID],
  [QUIZ_OPERADORES_ID]: [DISC_LOGICA_ID],
};

// Hub do aluno: só quizzes publicados aparecem; variaveis e listas já foram respondidos.
export const studentQuizHub: StudentQuizItem[] = [
  { ...quizVariaveisProfessor, attempted: true, bestScore: 4, bestTotalQuestions: 5 },
  { ...quizListasProfessor, attempted: true, bestScore: 3, bestTotalQuestions: 4 },
  { ...quizCondicionaisProfessor, attempted: false },
  { ...quizOperadoresProfessor, attempted: false },
];

export const quizHistory: QuizHistoryItem[] = [
  {
    quizId: QUIZ_LISTAS_ID,
    title: quizListasProfessor.title,
    topic: quizListasProfessor.topic,
    disciplineName: quizListasProfessor.disciplineName,
    score: 3,
    totalQuestions: 4,
    completedAt: iso(1),
  },
  {
    quizId: QUIZ_VARIAVEIS_ID,
    title: quizVariaveisProfessor.title,
    topic: quizVariaveisProfessor.topic,
    disciplineName: quizVariaveisProfessor.disciplineName,
    score: 4,
    totalQuestions: 5,
    completedAt: iso(3),
  },
];

// Resultados de turma (professor → modal "Resultados")
export const professorQuizResults: Record<string, ProfessorQuizResult> = {
  [QUIZ_VARIAVEIS_ID]: {
    quiz: { id: QUIZ_VARIAVEIS_ID, title: quizVariaveisProfessor.title, topic: quizVariaveisProfessor.topic },
    attempts: [
      { attemptId: "attempt-1", studentId: STUDENT_USER_ID, studentName: "Ana Beatriz Souza", score: 4, totalQuestions: 5, completedAt: iso(3) },
      { attemptId: "attempt-2", studentId: "student-2", studentName: "Bruno Carvalho Lima", score: 5, totalQuestions: 5, completedAt: iso(4) },
      { attemptId: "attempt-3", studentId: "student-3", studentName: "Camila Ferreira Dias", score: 3, totalQuestions: 5, completedAt: iso(4) },
      { attemptId: "attempt-4", studentId: "student-4", studentName: "Diego Martins Rocha", score: 2, totalQuestions: 5, completedAt: iso(5) },
      { attemptId: "attempt-5b", studentId: "student-5", studentName: "Elisa Nogueira Pinto", score: 5, totalQuestions: 5, completedAt: iso(5) },
      { attemptId: "attempt-6b", studentId: "student-6", studentName: "Felipe Andrade Costa", score: 1, totalQuestions: 5, completedAt: iso(6) },
      { attemptId: "attempt-7b", studentId: "student-7", studentName: "Gabriela Ramos Alves", score: 4, totalQuestions: 5, completedAt: iso(6) },
      { attemptId: "attempt-8b", studentId: "student-8", studentName: "Henrique Souza Melo", score: 3, totalQuestions: 5, completedAt: iso(7) },
      { attemptId: "attempt-9b", studentId: "student-9", studentName: "Isabela Cristina Farias", score: 5, totalQuestions: 5, completedAt: iso(8) },
      { attemptId: "attempt-10b", studentId: "student-10", studentName: "João Pedro Almeida", score: 4, totalQuestions: 5, completedAt: iso(8) },
    ],
  },
  [QUIZ_CONDICIONAIS_ID]: {
    quiz: { id: QUIZ_CONDICIONAIS_ID, title: quizCondicionaisProfessor.title, topic: quizCondicionaisProfessor.topic },
    attempts: [],
  },
  [QUIZ_FUNCOES_DRAFT_ID]: {
    quiz: { id: QUIZ_FUNCOES_DRAFT_ID, title: quizFuncoesDraftProfessor.title, topic: quizFuncoesDraftProfessor.topic },
    attempts: [],
  },
  [QUIZ_LISTAS_ID]: {
    quiz: { id: QUIZ_LISTAS_ID, title: quizListasProfessor.title, topic: quizListasProfessor.topic },
    attempts: [
      { attemptId: "attempt-5", studentId: STUDENT_USER_ID, studentName: "Ana Beatriz Souza", score: 3, totalQuestions: 4, completedAt: iso(1) },
      { attemptId: "attempt-6", studentId: "student-2", studentName: "Bruno Carvalho Lima", score: 4, totalQuestions: 4, completedAt: iso(2) },
      { attemptId: "attempt-7", studentId: "student-5", studentName: "Elisa Nogueira Pinto", score: 4, totalQuestions: 4, completedAt: iso(2) },
    ],
  },
  [QUIZ_OPERADORES_ID]: {
    quiz: { id: QUIZ_OPERADORES_ID, title: quizOperadoresProfessor.title, topic: quizOperadoresProfessor.topic },
    attempts: [],
  },
};

const LETTERS = ["A", "B", "C", "D", "E"] as const;

/** Corrige uma tentativa localmente, sem precisar de estado no servidor mock. */
export function gradeAttempt(
  quizId: string,
  answers: Record<string, string>,
): QuizAttemptResult {
  const questions = questionsByQuizId[quizId] ?? [];
  let score = 0;
  const detalhes = questions.map((q) => {
    const selected = answers[q.id] ?? "";
    const isCorrect = selected === q.correctOption;
    if (isCorrect) score += 1;
    const optionText = (letter: string) => {
      const idx = LETTERS.indexOf(letter as (typeof LETTERS)[number]);
      return idx >= 0 ? q.options[idx] ?? "" : "";
    };
    return {
      question: q.question,
      selected,
      correct: q.correctOption,
      isCorrect,
      explanation: q.explanation ?? "",
      selectedText: optionText(selected),
      correctText: optionText(q.correctOption),
    };
  });

  return {
    attemptId: `attempt-${quizId}-${Date.now()}`,
    score,
    totalQuestions: questions.length,
    detalhes,
  };
}
