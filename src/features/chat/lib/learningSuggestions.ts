import { t, type Language, type MessageKey } from "@/i18n";
import type { QuizTopic, StudentQuizItem } from "@/features/quiz/types";

const topicPatterns: { topic: QuizTopic; pattern: RegExp }[] = [
  { topic: "operadores_logicos", pattern: /\b(?:operador(?:es)? logicos?|logical operators?|boolean(?:o|a|os|as)?|truth tables?|tabelas? (?:da |de )?verdade)\b|&&|\|\|/g },
  { topic: "funcoes", pattern: /\b(?:funcoes|funcao|functions?|funciones?|funcion|metodos?|methods?|parametros?|parameters?|argumentos?|arguments?|retorno|return)\b/g },
  { topic: "listas", pattern: /\b(?:listas?|lists?|arrays?|vetores?|vetor|matrizes?|matriz|vectors?)\b/g },
  { topic: "condicionais", pattern: /\b(?:condicionais|condicional(?:es)?|conditions?|conditionals?|if|else|switch|decisoes|decisions?|condiciones)\b/g },
  { topic: "variaveis", pattern: /\b(?:variaveis|variavel|variables?|tipos? de (?:dados|datos)|data types?|constantes?|declaracao|atribuicao|let|const|var)\b/g },
];
const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const quizSearchStopWords = new Set(["como", "usar", "uso", "uma", "para", "que", "qual", "quiz", "conceitos", "conceito", "estruturas", "exemplo", "exemplos", "linguagem", "programacao", "how", "use", "what", "the", "with", "ejemplo", "utilizar"]);
function quizSearchTerms(text: string) {
  const tokens = normalize(text).replace(/\b(?:lacos?|loops?|repeticao|repeticiones|repetition|while|for)\b/g, "repeticao").match(/[a-z0-9]+/g) || [];
  return new Set(tokens.filter(word => word.length > 2 && !quizSearchStopWords.has(word)));
}

/** Latest explicit subject wins; only a contextual follow-up inherits an earlier subject. */
export function getConversationTopic(questions: readonly string[]): QuizTopic | null {
  for (let index = questions.length - 1; index >= Math.max(0, questions.length - 4); index--) {
    const text = normalize(questions[index]);
    const matches = topicPatterns.map(({ topic, pattern }) => ({ topic, score: [...text.matchAll(pattern)].length }))
      .sort((a, b) => b.score - a.score);
    if (matches[0].score) return matches[0].topic;
    if (/\b(?:recursao|recursion|loops?|lacos?|repeticao|for|while|arquivos?|files?|sql|databases?|classes?|objetos?|objects?|heranca|inheritance|ponteiros?|pointers?|arvores?|trees?|grafos?|graphs?|redes?|networks?|http|api)\b/.test(text)) return null;
    if (!/\b(?:isso|isto|esse|essa|assunto|ainda|entendi|entender|entendo|compreendi|exemplo|exercicio|this|that|it|understand|another|example|practice|eso|esto|entiendo|comprendi|ejemplo)\b/.test(text)) return null;
  }
  return null;
}

const instantQuestions: Record<QuizTopic, readonly MessageKey[]> = {
  variaveis: ["chat.followUpVariablesTypes", "chat.followUpVariablesConstants", "chat.followUpVariablesPractice"],
  funcoes: ["chat.followUpFunctionsParameters", "chat.followUpFunctionsScope", "chat.followUpFunctionsPractice"],
  listas: ["chat.followUpListsItems", "chat.followUpListsIteration", "chat.followUpListsPractice"],
  condicionais: ["chat.followUpConditionsCombine", "chat.followUpConditionsBranches", "chat.followUpConditionsPractice"],
  operadores_logicos: ["chat.followUpOperatorsDifference", "chat.followUpOperatorsTruth", "chat.followUpOperatorsPractice"],
};

export function getImmediateFollowUps(questions: readonly string[], language: Language): string[] {
  const topic = getConversationTopic(questions);
  const keys = topic ? instantQuestions[topic] : [];
  const fallback: MessageKey[] = ["chat.followUpExample", "chat.followUpPractice", "chat.followUpRelated"];
  const asked = new Set(questions.map(question => normalize(question).trim()));
  return [...new Set([...keys, ...fallback].map(key => t(key, {}, language)))]
    .filter(question => !asked.has(normalize(question).trim())).slice(0, 3);
}

export function pickPracticeQuiz(quizzes: readonly StudentQuizItem[], questions: readonly string[]): StudentQuizItem | null {
  const topic = getConversationTopic(questions);
  const current = questions[questions.length - 1] || "";
  const queryTerms = quizSearchTerms(current);
  return quizzes.filter(quiz => (!quiz.status || quiz.status === "published") && quiz.questionCount > 0)
    .map(quiz => {
      const registeredTopic = getConversationTopic([quiz.topic]) || getConversationTopic([quiz.title]);
      const metadataTerms = quizSearchTerms(`${quiz.topic} ${quiz.title}`);
      const overlap = [...queryTerms].filter(word => metadataTerms.has(word)).length;
      const score = topic && (quiz.topic === topic || registeredTopic === topic) ? 100 : registeredTopic && topic ? 0 : overlap;
      return { quiz, score };
    }).filter(candidate => candidate.score > 0)
    .sort((a, b) => b.score - a.score || Number(a.quiz.attempted) - Number(b.quiz.attempted) ||
      (a.quiz.bestTotalQuestions ? a.quiz.bestScore! / a.quiz.bestTotalQuestions : 0) - (b.quiz.bestTotalQuestions ? b.quiz.bestScore! / b.quiz.bestTotalQuestions : 0))[0]?.quiz || null;
}
