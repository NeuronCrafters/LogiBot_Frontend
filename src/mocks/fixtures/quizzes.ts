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

const disciplineRefLogica = { id: DISC_LOGICA_ID, name: "Lógica de Programação" };
const disciplineRefEstruturas = { id: DISC_ESTRUTURAS_ID, name: "Estrutura de Dados" };

// ── Quiz: Variáveis e Tipos (publicado, já respondido pelo aluno) ──────────────

export const quizVariaveisQuestions: QuizQuestionWithAnswer[] = [
  {
    id: "q-var-1",
    orderIndex: 0,
    question: "Qual tipo de dado é usado em Python para representar números inteiros?",
    options: ["int", "float", "str", "bool"],
    correctOption: "A",
    explanation: "`int` representa números inteiros; `float` é para números decimais.",
  },
  {
    id: "q-var-2",
    orderIndex: 1,
    question: "O que a linha `x = 10` faz em Python?",
    options: [
      "Compara x com 10",
      "Cria a variável x e atribui o valor 10 a ela",
      "Declara uma constante chamada 10",
      "Gera um erro de sintaxe",
    ],
    correctOption: "B",
    explanation: "O operador `=` é de atribuição: cria (ou atualiza) a variável x com o valor 10.",
  },
  {
    id: "q-var-3",
    orderIndex: 2,
    question: "Qual símbolo inicia um comentário de uma linha em Python?",
    options: ["#", "//", "/* */", "--"],
    correctOption: "A",
    explanation: "Em Python, comentários de linha começam com `#`.",
  },
  {
    id: "q-var-4",
    orderIndex: 3,
    question: "Quais valores uma variável booleana pode assumir?",
    options: ["True ou False", "0 a 9", "Qualquer texto", "Apenas números negativos"],
    correctOption: "A",
    explanation: "O tipo `bool` só possui dois valores possíveis: `True` e `False`.",
  },
  {
    id: "q-var-5",
    orderIndex: 4,
    question: "O que acontece ao tentar somar uma string com um número sem conversão em Python?",
    options: [
      "Erro de tipo (TypeError)",
      "Concatenação automática",
      "O resultado é sempre zero",
      "Python converte automaticamente para float",
    ],
    correctOption: "A",
    explanation: "Python não converte tipos automaticamente; é preciso usar `int()`, `str()` ou `float()` explicitamente.",
  },
];

export const quizVariaveisProfessor: ProfessorQuiz = {
  id: QUIZ_VARIAVEIS_ID,
  title: "Quiz de Variáveis e Tipos",
  topic: "variaveis",
  description: "Revisão dos conceitos básicos de variáveis, tipos primitivos e conversão de tipos.",
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
    question: "Qual estrutura permite executar um bloco de código apenas se uma condição for verdadeira?",
    options: ["if", "for", "def", "import"],
    correctOption: "A",
    explanation: "`if` executa um bloco somente quando a condição avaliada é `True`.",
  },
  {
    id: "q-cond-2",
    orderIndex: 1,
    question: "O que o `elif` permite fazer?",
    options: [
      "Encerrar o programa",
      "Testar uma condição adicional caso a anterior seja falsa",
      "Repetir um bloco de código",
      "Importar uma biblioteca",
    ],
    correctOption: "B",
    explanation: "`elif` (else if) testa outra condição quando o `if` anterior não foi satisfeito.",
  },
  {
    id: "q-cond-3",
    orderIndex: 2,
    question: "Qual operador lógico exige que ambas as condições sejam verdadeiras?",
    options: ["and", "or", "not", "xor"],
    correctOption: "A",
    explanation: "`and` só retorna verdadeiro se as duas condições envolvidas forem verdadeiras.",
  },
  {
    id: "q-cond-4",
    orderIndex: 3,
    question: "O que o bloco `else` representa em uma estrutura condicional?",
    options: [
      "Uma condição obrigatória",
      "O caminho executado quando nenhuma condição anterior é verdadeira",
      "Um tipo de loop",
      "Uma função nativa do Python",
    ],
    correctOption: "B",
    explanation: "`else` cobre todos os casos não tratados pelas condições `if`/`elif` anteriores.",
  },
];

export const quizCondicionaisProfessor: ProfessorQuiz = {
  id: QUIZ_CONDICIONAIS_ID,
  title: "Estruturas Condicionais na Prática",
  topic: "condicionais",
  description: "Pratique if/elif/else e operadores lógicos com casos do dia a dia.",
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
    question: "Qual palavra-chave é usada para declarar uma função em Python?",
    options: ["def", "func", "function", "lambda"],
    correctOption: "A",
    explanation: "`def` inicia a declaração de uma função nomeada em Python.",
  },
  {
    id: "q-func-2",
    orderIndex: 1,
    question: "Para que serve o comando `return` dentro de uma função?",
    options: [
      "Encerrar o programa",
      "Devolver um valor para quem chamou a função",
      "Imprimir um valor na tela",
      "Declarar uma variável global",
    ],
    correctOption: "B",
    explanation: "`return` envia um valor de volta ao ponto onde a função foi chamada.",
  },
  {
    id: "q-func-3",
    orderIndex: 2,
    question: "O que é um parâmetro de função?",
    options: [
      "O nome da função",
      "Um valor de entrada que a função recebe para trabalhar",
      "O resultado final da função",
      "Um comentário dentro da função",
    ],
    correctOption: "B",
    explanation: "Parâmetros são as variáveis declaradas entre parênteses que recebem valores na chamada da função.",
  },
];

export const quizFuncoesDraftProfessor: ProfessorQuiz = {
  id: QUIZ_FUNCOES_DRAFT_ID,
  title: "Funções e Modularização",
  topic: "funcoes",
  description: "Gerado automaticamente a partir do material da disciplina para revisar funções.",
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
    question: "Qual símbolo é usado para criar uma lista vazia em Python?",
    options: ["[]", "{}", "()", "<>"],
    correctOption: "A",
    explanation: "Colchetes `[]` criam uma lista vazia; chaves `{}` criam um dicionário ou conjunto.",
  },
  {
    id: "q-list-2",
    orderIndex: 1,
    question: "Qual é o índice do primeiro elemento de uma lista em Python?",
    options: ["0", "1", "-1", "Depende da lista"],
    correctOption: "A",
    explanation: "Python usa indexação baseada em zero: o primeiro elemento está no índice 0.",
  },
  {
    id: "q-list-3",
    orderIndex: 2,
    question: "Qual método adiciona um elemento ao final de uma lista?",
    options: [".append()", ".add()", ".push()", ".insert(0)"],
    correctOption: "A",
    explanation: "`.append()` insere um elemento no final da lista.",
  },
  {
    id: "q-list-4",
    orderIndex: 3,
    question: "O que a expressão `lista[-1]` retorna?",
    options: [
      "O último elemento da lista",
      "Um erro",
      "O primeiro elemento",
      "Uma lista vazia",
    ],
    correctOption: "A",
    explanation: "Índices negativos contam a partir do final; `-1` é sempre o último elemento.",
  },
];

export const quizListasProfessor: ProfessorQuiz = {
  id: QUIZ_LISTAS_ID,
  title: "Manipulação de Listas",
  topic: "listas",
  description: "Criação, indexação e métodos essenciais de listas em Python.",
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
    question: "Qual operador retorna verdadeiro se pelo menos uma das condições for verdadeira?",
    options: ["or", "and", "not", "xor"],
    correctOption: "A",
    explanation: "`or` retorna `True` quando pelo menos uma das condições avaliadas é verdadeira.",
  },
  {
    id: "q-op-2",
    orderIndex: 1,
    question: "O que o operador `not` faz?",
    options: [
      "Inverte o valor lógico de uma condição",
      "Soma dois valores",
      "Compara dois valores",
      "Cria um loop",
    ],
    correctOption: "A",
    explanation: "`not True` vira `False` e vice-versa.",
  },
  {
    id: "q-op-3",
    orderIndex: 2,
    question: "Qual o resultado de `True and False`?",
    options: ["False", "True", "Erro", "None"],
    correctOption: "A",
    explanation: "`and` só é verdadeiro quando ambos os operandos são verdadeiros.",
  },
  {
    id: "q-op-4",
    orderIndex: 3,
    question: "Em qual situação `or` e `and` costumam ser combinados na mesma expressão?",
    options: [
      "Para validar múltiplas condições complexas, como idade mínima e documento válido",
      "Apenas em loops for",
      "Apenas em funções recursivas",
      "Nunca podem ser combinados",
    ],
    correctOption: "A",
    explanation: "É comum combinar `and`/`or` para checar múltiplas regras de negócio numa única condição.",
  },
];

export const quizOperadoresProfessor: ProfessorQuiz = {
  id: QUIZ_OPERADORES_ID,
  title: "Operadores Lógicos no Dia a Dia",
  topic: "operadores_logicos",
  description: "Combine and, or e not para validar condições do mundo real.",
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
