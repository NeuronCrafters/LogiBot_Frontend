import type {
  RagClass,
  RagDocument,
  RagSettings,
  RagTestChatResponse,
} from "@/features/rag/types";
import { CLASS_A_ID, CLASS_B_ID, COURSE_ID, PROFESSOR_ID } from "./ids";
import { CLASS_A_REGISTRATION_CODE, CLASS_B_REGISTRATION_CODE } from "./academic";

function iso(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 86_400_000).toISOString();
}

export const ragClasses: RagClass[] = [
  {
    id: CLASS_A_ID,
    name: "Class A - Programming Logic 2026.1",
    courseId: COURSE_ID,
    courseName: "Software Engineering",
    registrationCode: CLASS_A_REGISTRATION_CODE,
  },
  {
    id: CLASS_B_ID,
    name: "Class B - Programming Logic 2026.1",
    courseId: COURSE_ID,
    courseName: "Software Engineering",
    registrationCode: CLASS_B_REGISTRATION_CODE,
  },
];

export const ragSettingsByClassId: Record<string, RagSettings> = {
  [CLASS_A_ID]: {
    classId: CLASS_A_ID,
    ragMode: "hybrid",
    topK: 4,
    minScore: 0.72,
    systemPrompt:
      "You are LogiBot's Programming Logic tutor. Answer in a didactic way, with Python examples, and cite the subject material whenever possible.",
    llmModel: "gpt-4o-mini",
    embeddingModel: "text-embedding-3-small",
    createdAt: iso(60),
    updatedAt: iso(2),
  },
  [CLASS_B_ID]: {
    classId: CLASS_B_ID,
    ragMode: "context",
    topK: 3,
    minScore: 0.65,
    systemPrompt: null,
    llmModel: "gpt-4o-mini",
    embeddingModel: "text-embedding-3-small",
    createdAt: iso(60),
    updatedAt: iso(60),
  },
};

export const ragDocumentsByClassId: Record<string, RagDocument[]> = {
  [CLASS_A_ID]: [
    {
      id: "doc-1",
      classId: CLASS_A_ID,
      uploadedBy: PROFESSOR_ID,
      title: "Logic Handbook - Chapter 1",
      originalFileName: "apostila_logica_cap1.pdf",
      storedFileName: "apostila_logica_cap1_stored.pdf",
      filePath: "/uploads/apostila_logica_cap1_stored.pdf",
      extractedTextPath: "/extracted/apostila_logica_cap1.txt",
      sourceType: "pdf",
      mimeType: "application/pdf",
      fileSize: 2_400_000,
      status: "ready",
      errorMessage: null,
      createdAt: iso(30),
      updatedAt: iso(30),
      deletedAt: null,
      enabled: true,
      isOwner: true,
    },
    {
      id: "doc-2",
      classId: CLASS_A_ID,
      uploadedBy: PROFESSOR_ID,
      title: "Slides - Loop Structures",
      originalFileName: "slides_estruturas_repeticao.pdf",
      storedFileName: "slides_estruturas_repeticao_stored.pdf",
      filePath: "/uploads/slides_estruturas_repeticao_stored.pdf",
      extractedTextPath: "/extracted/slides_estruturas_repeticao.txt",
      sourceType: "pdf",
      mimeType: "application/pdf",
      fileSize: 1_150_000,
      status: "ready",
      errorMessage: null,
      createdAt: iso(21),
      updatedAt: iso(21),
      deletedAt: null,
      enabled: true,
      isOwner: true,
    },
    {
      id: "doc-3",
      classId: CLASS_A_ID,
      uploadedBy: PROFESSOR_ID,
      title: "Solved Exercises - List 3",
      originalFileName: "exercicios_resolvidos_lista3.docx",
      storedFileName: "exercicios_resolvidos_lista3_stored.docx",
      filePath: "/uploads/exercicios_resolvidos_lista3_stored.docx",
      extractedTextPath: null,
      sourceType: "docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileSize: 340_000,
      status: "processing",
      errorMessage: null,
      createdAt: iso(0),
      updatedAt: iso(0),
      deletedAt: null,
      enabled: true,
      isOwner: true,
    },
    {
      id: "doc-4",
      classId: CLASS_A_ID,
      uploadedBy: PROFESSOR_ID,
      title: "Guide to Lists and Data Structures",
      originalFileName: "guia_listas_estruturas_dados.pdf",
      storedFileName: "guia_listas_estruturas_dados_stored.pdf",
      filePath: "/uploads/guia_listas_estruturas_dados_stored.pdf",
      extractedTextPath: "/extracted/guia_listas_estruturas_dados.txt",
      sourceType: "pdf",
      mimeType: "application/pdf",
      fileSize: 1_780_000,
      status: "ready",
      errorMessage: null,
      createdAt: iso(5),
      updatedAt: iso(5),
      deletedAt: null,
      enabled: true,
      isOwner: true,
    },
  ],
  [CLASS_B_ID]: [
    {
      id: "doc-1",
      classId: CLASS_B_ID,
      uploadedBy: PROFESSOR_ID,
      title: "Logic Handbook - Chapter 1",
      originalFileName: "apostila_logica_cap1.pdf",
      storedFileName: "apostila_logica_cap1_stored.pdf",
      filePath: "/uploads/apostila_logica_cap1_stored.pdf",
      extractedTextPath: "/extracted/apostila_logica_cap1.txt",
      sourceType: "pdf",
      mimeType: "application/pdf",
      fileSize: 2_400_000,
      status: "ready",
      errorMessage: null,
      createdAt: iso(30),
      updatedAt: iso(30),
      deletedAt: null,
      enabled: true,
      isOwner: false,
    },
  ],
};

const loopsResponse: RagTestChatResponse = {
  answer:
    "Loop structures are used to run a block of code several times without manually duplicating the code. In Python, there are two main ones: `for`, used when the number of repetitions is known (such as iterating over a list), and `while`, used when the repetition depends on a condition evaluated on every iteration. According to the Chapter 1 handbook, `for` is preferable whenever you already have a collection or a defined range to iterate over.",
  provider: "openai/gpt-4o-mini",
  retrievedChunks: [
    {
      chromaId: "chunk-doc1-12",
      documentId: "doc-1",
      documentTitle: "Logic Handbook - Chapter 1",
      chunkIndex: 12,
      score: 0.89,
      content:
        "The `for` loop is recommended when we know the number of repetitions beforehand or when we iterate over a collection (list, tuple, string). The `while` loop, on the other hand, is recommended when the repetition depends on a condition that can only be evaluated while the program runs.",
    },
    {
      chromaId: "chunk-doc2-04",
      documentId: "doc-2",
      documentTitle: "Slides - Loop Structures",
      chunkIndex: 4,
      score: 0.81,
      content:
        "Practical example: a menu that repeats until the user chooses 'quit' should use `while`, since we don't know how many interactions the user will make before exiting.",
    },
  ],
};

const listasResponse: RagTestChatResponse = {
  answer:
    "Lists in Python are ordered, mutable collections: you create one with square brackets, for example `numbers = [10, 20, 30]`, access an item by its index (`numbers[0]`) and iterate over all of them with `for item in numbers`. According to the lists guide, the main thing to remember is that indices start at 0 — and that `numbers[-1]` always returns the last element. Methods such as `.append()` and `.remove()` change the original list, so be careful when reusing the same variable in several places.",
  provider: "openai/gpt-4o-mini",
  retrievedChunks: [
    {
      chromaId: "chunk-doc4-03",
      documentId: "doc-4",
      documentTitle: "Guide to Lists and Data Structures",
      chunkIndex: 3,
      score: 0.86,
      content:
        "A list is created with square brackets `[]` and can hold values of different types. The first element is always at index 0, and negative indices (such as -1) count from the end of the list.",
    },
    {
      chromaId: "chunk-doc4-07",
      documentId: "doc-4",
      documentTitle: "Guide to Lists and Data Structures",
      chunkIndex: 7,
      score: 0.78,
      content:
        "Methods such as `.append(value)`, `.remove(value)` and `.pop(index)` modify the original list directly (in-place), without creating a copy.",
    },
  ],
};

const defaultResponse: RagTestChatResponse = {
  answer:
    "Great question! Based on this class's material, I recommend reviewing the Chapter 1 handbook and the loop structures slides — they cover the fundamentals of programming logic with plenty of practical examples. If you want, ask something more specific (for example, about `for`, `while` or lists) and I'll detail it with excerpts from the material.",
  provider: "openai/gpt-4o-mini",
  retrievedChunks: [
    {
      chromaId: "chunk-doc1-01",
      documentId: "doc-1",
      documentTitle: "Logic Handbook - Chapter 1",
      chunkIndex: 1,
      score: 0.62,
      content:
        "This chapter introduces the fundamental concepts of programming logic: variables, data types, conditional structures and loops.",
    },
  ],
};

/** Escolhe uma resposta canned com base em palavras-chave da pergunta (mock simples, sem LLM real). */
export function pickRagTestChatResponse(message: string): RagTestChatResponse {
  const normalized = message.toLowerCase();
  if (normalized.includes("list")) return listasResponse;
  if (normalized.includes("for") || normalized.includes("while") || normalized.includes("loop"))
    return loopsResponse;
  return defaultResponse;
}
