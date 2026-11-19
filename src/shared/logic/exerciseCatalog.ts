/*
 * LogiBots built-in workbench exercises (translation and Parsons).
 *
 * Shared by the API (which grades) and the web app (which displays) and must stay
 * BYTE-IDENTICAL in:
 *   LogiBot_Backend/src/services/logic/exerciseCatalog.ts
 *   LogiBot_Frontend/src/shared/logic/exerciseCatalog.ts
 * Both suites check its SHA-256 against exercises.fixtures.json (`catalogSha256`).
 *
 * Content is written in the three interface languages; ids, formulas, solutions and
 * indentation are language-independent, so grading never depends on the language.
 * Bump `version` when the meaning of an exercise changes (attempts of different
 * versions are not mixed in analytics). This catalog is temporary: the professors'
 * question bank (phase 4) will provide exercises in the same shape.
 */
import type { ParsonsSolution } from "./parsonsCore";

export type ContentLanguage = "pt-BR" | "en-US" | "es-ES";
export type LocalizedText = Record<ContentLanguage, string>;

export interface TranslationExerciseDefinition {
  type: "translation";
  id: string;
  version: number;
  subject: string;
  sentence: LocalizedText;
  legend: Array<{ letter: string; text: LocalizedText }>;
  /** Expected formula; any logically equivalent answer is accepted. */
  target: string;
}

export interface ParsonsExerciseDefinition {
  type: "parsons";
  id: string;
  version: number;
  subject: string;
  /** Q-matrix concepts (sub-tags of the subject). */
  concepts: string[];
  statement: LocalizedText;
  lines: Array<{ id: string; text: LocalizedText; distractor?: boolean }>;
  solutions: ParsonsSolution[];
}

export const TRANSLATION_SUBJECT = "propositional_logic";
export const ALGORITHM_SUBJECT = "algorithm_construction";

export const TRANSLATION_EXERCISES: TranslationExerciseDefinition[] = [
  {
    type: "translation",
    id: "tr-rain-street",
    version: 1,
    subject: TRANSLATION_SUBJECT,
    sentence: {
      "pt-BR": "Se chove, então a rua fica molhada.",
      "en-US": "If it rains, then the street gets wet.",
      "es-ES": "Si llueve, entonces la calle se moja.",
    },
    legend: [
      { letter: "p", text: { "pt-BR": "chove", "en-US": "it rains", "es-ES": "llueve" } },
      { letter: "q", text: { "pt-BR": "a rua fica molhada", "en-US": "the street gets wet", "es-ES": "la calle se moja" } },
    ],
    target: "p -> q",
  },
  {
    type: "translation",
    id: "tr-not-both",
    version: 1,
    subject: TRANSLATION_SUBJECT,
    sentence: {
      "pt-BR": "Não é verdade que Ana estuda e trabalha.",
      "en-US": "It is not true that Ana studies and works.",
      "es-ES": "No es verdad que Ana estudia y trabaja.",
    },
    legend: [
      { letter: "p", text: { "pt-BR": "Ana estuda", "en-US": "Ana studies", "es-ES": "Ana estudia" } },
      { letter: "q", text: { "pt-BR": "Ana trabalha", "en-US": "Ana works", "es-ES": "Ana trabaja" } },
    ],
    target: "~(p & q)",
  },
  {
    type: "translation",
    id: "tr-only-if",
    version: 1,
    subject: TRANSLATION_SUBJECT,
    sentence: {
      "pt-BR": "Vou à praia somente se faz sol.",
      "en-US": "I go to the beach only if it is sunny.",
      "es-ES": "Voy a la playa solo si hace sol.",
    },
    legend: [
      { letter: "p", text: { "pt-BR": "vou à praia", "en-US": "I go to the beach", "es-ES": "voy a la playa" } },
      { letter: "q", text: { "pt-BR": "faz sol", "en-US": "it is sunny", "es-ES": "hace sol" } },
    ],
    target: "p -> q",
  },
  {
    type: "translation",
    id: "tr-unless",
    version: 1,
    subject: TRANSLATION_SUBJECT,
    sentence: {
      "pt-BR": "Saio de casa, a menos que chova.",
      "en-US": "I go out, unless it rains.",
      "es-ES": "Salgo de casa, a menos que llueva.",
    },
    legend: [
      { letter: "p", text: { "pt-BR": "saio de casa", "en-US": "I go out", "es-ES": "salgo de casa" } },
      { letter: "q", text: { "pt-BR": "chove", "en-US": "it rains", "es-ES": "llueve" } },
    ],
    target: "~q -> p",
  },
  {
    type: "translation",
    id: "tr-lamp-iff",
    version: 1,
    subject: TRANSLATION_SUBJECT,
    sentence: {
      "pt-BR": "A lâmpada acende se e somente se o interruptor está ligado e há energia.",
      "en-US": "The lamp lights up if and only if the switch is on and there is power.",
      "es-ES": "La lámpara se enciende si y solo si el interruptor está encendido y hay energía.",
    },
    legend: [
      { letter: "p", text: { "pt-BR": "a lâmpada acende", "en-US": "the lamp lights up", "es-ES": "la lámpara se enciende" } },
      { letter: "q", text: { "pt-BR": "o interruptor está ligado", "en-US": "the switch is on", "es-ES": "el interruptor está encendido" } },
      { letter: "r", text: { "pt-BR": "há energia", "en-US": "there is power", "es-ES": "hay energía" } },
    ],
    target: "p <-> q & r",
  },
];

export const PARSONS_EXERCISES: ParsonsExerciseDefinition[] = [
  {
    type: "parsons",
    id: "pa-even-odd",
    version: 1,
    subject: ALGORITHM_SUBJECT,
    concepts: ["input_output", "selection"],
    statement: {
      "pt-BR": "Leia um número inteiro e escreva se ele é par ou ímpar.",
      "en-US": "Read an integer and write whether it is even or odd.",
      "es-ES": "Lea un número entero y escriba si es par o impar.",
    },
    lines: [
      { id: "read", text: { "pt-BR": "leia(n)", "en-US": "read(n)", "es-ES": "leer(n)" } },
      { id: "if", text: { "pt-BR": "se n % 2 = 0 então", "en-US": "if n % 2 = 0 then", "es-ES": "si n % 2 = 0 entonces" } },
      { id: "even", text: { "pt-BR": "escreva(\"par\")", "en-US": "write(\"even\")", "es-ES": "escribir(\"par\")" } },
      { id: "else", text: { "pt-BR": "senão", "en-US": "else", "es-ES": "sino" } },
      { id: "odd", text: { "pt-BR": "escreva(\"ímpar\")", "en-US": "write(\"odd\")", "es-ES": "escribir(\"impar\")" } },
      { id: "endif", text: { "pt-BR": "fimse", "en-US": "endif", "es-ES": "finsi" } },
      { id: "while", text: { "pt-BR": "enquanto n % 2 = 0 faça", "en-US": "while n % 2 = 0 do", "es-ES": "mientras n % 2 = 0 hacer" }, distractor: true },
    ],
    solutions: [
      [["read", 0], ["if", 0], ["even", 1], ["else", 0], ["odd", 1], ["endif", 0]],
    ],
  },
  {
    type: "parsons",
    id: "pa-sum-1-to-10",
    version: 1,
    subject: ALGORITHM_SUBJECT,
    concepts: ["repetition", "accumulator"],
    statement: {
      "pt-BR": "Calcule e escreva a soma dos números inteiros de 1 a 10.",
      "en-US": "Compute and write the sum of the integers from 1 to 10.",
      "es-ES": "Calcule y escriba la suma de los números enteros del 1 al 10.",
    },
    lines: [
      { id: "init", text: { "pt-BR": "soma ← 0", "en-US": "sum ← 0", "es-ES": "suma ← 0" } },
      { id: "for", text: { "pt-BR": "para i de 1 até 10 faça", "en-US": "for i from 1 to 10 do", "es-ES": "para i desde 1 hasta 10 hacer" } },
      { id: "add", text: { "pt-BR": "soma ← soma + i", "en-US": "sum ← sum + i", "es-ES": "suma ← suma + i" } },
      { id: "endfor", text: { "pt-BR": "fimpara", "en-US": "endfor", "es-ES": "finpara" } },
      { id: "write", text: { "pt-BR": "escreva(soma)", "en-US": "write(sum)", "es-ES": "escribir(suma)" } },
      { id: "add-one", text: { "pt-BR": "soma ← soma + 1", "en-US": "sum ← sum + 1", "es-ES": "suma ← suma + 1" }, distractor: true },
    ],
    solutions: [
      [["init", 0], ["for", 0], ["add", 1], ["endfor", 0], ["write", 0]],
    ],
  },
  {
    type: "parsons",
    id: "pa-max-of-two",
    version: 1,
    subject: ALGORITHM_SUBJECT,
    concepts: ["input_output", "selection"],
    statement: {
      "pt-BR": "Leia dois números e escreva o maior deles.",
      "en-US": "Read two numbers and write the larger one.",
      "es-ES": "Lea dos números y escriba el mayor de ellos.",
    },
    lines: [
      { id: "read-a", text: { "pt-BR": "leia(a)", "en-US": "read(a)", "es-ES": "leer(a)" } },
      { id: "read-b", text: { "pt-BR": "leia(b)", "en-US": "read(b)", "es-ES": "leer(b)" } },
      { id: "if", text: { "pt-BR": "se a > b então", "en-US": "if a > b then", "es-ES": "si a > b entonces" } },
      { id: "write-a", text: { "pt-BR": "escreva(a)", "en-US": "write(a)", "es-ES": "escribir(a)" } },
      { id: "else", text: { "pt-BR": "senão", "en-US": "else", "es-ES": "sino" } },
      { id: "write-b", text: { "pt-BR": "escreva(b)", "en-US": "write(b)", "es-ES": "escribir(b)" } },
      { id: "endif", text: { "pt-BR": "fimse", "en-US": "endif", "es-ES": "finsi" } },
      { id: "if-less", text: { "pt-BR": "se a < b então", "en-US": "if a < b then", "es-ES": "si a < b entonces" }, distractor: true },
    ],
    solutions: [
      [["read-a", 0], ["read-b", 0], ["if", 0], ["write-a", 1], ["else", 0], ["write-b", 1], ["endif", 0]],
      [["read-b", 0], ["read-a", 0], ["if", 0], ["write-a", 1], ["else", 0], ["write-b", 1], ["endif", 0]],
    ],
  },
];

export function findTranslationExercise(id: string): TranslationExerciseDefinition | undefined {
  return TRANSLATION_EXERCISES.filter((exercise) => exercise.id === id)[0];
}

export function findParsonsExercise(id: string): ParsonsExerciseDefinition | undefined {
  return PARSONS_EXERCISES.filter((exercise) => exercise.id === id)[0];
}
