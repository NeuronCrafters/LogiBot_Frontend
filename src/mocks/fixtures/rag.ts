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
    name: "Turma A - Lógica de Programação 2026.1",
    courseId: COURSE_ID,
    courseName: "Engenharia de Software",
    registrationCode: CLASS_A_REGISTRATION_CODE,
  },
  {
    id: CLASS_B_ID,
    name: "Turma B - Lógica de Programação 2026.1",
    courseId: COURSE_ID,
    courseName: "Engenharia de Software",
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
      "Você é o tutor de Lógica de Programação do LogiBot. Responda de forma didática, com exemplos em Python, e cite o material da disciplina sempre que possível.",
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
      title: "Apostila de Lógica - Capítulo 1",
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
      title: "Slides - Estruturas de Repetição",
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
      title: "Exercícios Resolvidos - Lista 3",
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
      title: "Guia de Listas e Estruturas de Dados",
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
      title: "Apostila de Lógica - Capítulo 1",
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
    "Estruturas de repetição servem para executar um bloco de código várias vezes sem duplicar o código manualmente. Em Python, você tem duas principais: `for`, usado quando o número de repetições é conhecido (como percorrer uma lista), e `while`, usado quando a repetição depende de uma condição avaliada a cada volta. Segundo a apostila do capítulo 1, o `for` é preferível sempre que você já tem uma coleção ou um intervalo definido para percorrer.",
  provider: "openai/gpt-4o-mini",
  retrievedChunks: [
    {
      chromaId: "chunk-doc1-12",
      documentId: "doc-1",
      documentTitle: "Apostila de Lógica - Capítulo 1",
      chunkIndex: 12,
      score: 0.89,
      content:
        "O laço `for` é indicado quando conhecemos previamente a quantidade de repetições ou quando percorremos uma coleção (lista, tupla, string). Já o laço `while` é indicado quando a repetição depende de uma condição que só pode ser avaliada durante a execução do programa.",
    },
    {
      chromaId: "chunk-doc2-04",
      documentId: "doc-2",
      documentTitle: "Slides - Estruturas de Repetição",
      chunkIndex: 4,
      score: 0.81,
      content:
        "Exemplo prático: um menu que repete até o usuário escolher 'sair' deve usar `while`, pois não sabemos quantas interações o usuário fará antes de encerrar.",
    },
  ],
};

const listasResponse: RagTestChatResponse = {
  answer:
    "Listas em Python são coleções ordenadas e mutáveis: você cria uma com colchetes, por exemplo `numeros = [10, 20, 30]`, acessa um item pelo índice (`numeros[0]`) e percorre todos com `for item in numeros`. Segundo o guia de listas, o cuidado principal é lembrar que os índices começam em 0 — e que `numeros[-1]` sempre devolve o último elemento. Métodos como `.append()` e `.remove()` alteram a lista original, então tome cuidado ao reutilizar a mesma variável em vários lugares.",
  provider: "openai/gpt-4o-mini",
  retrievedChunks: [
    {
      chromaId: "chunk-doc4-03",
      documentId: "doc-4",
      documentTitle: "Guia de Listas e Estruturas de Dados",
      chunkIndex: 3,
      score: 0.86,
      content:
        "Uma lista é criada com colchetes `[]` e pode conter valores de tipos diferentes. O primeiro elemento está sempre no índice 0, e índices negativos (como -1) contam a partir do final da lista.",
    },
    {
      chromaId: "chunk-doc4-07",
      documentId: "doc-4",
      documentTitle: "Guia de Listas e Estruturas de Dados",
      chunkIndex: 7,
      score: 0.78,
      content:
        "Métodos como `.append(valor)`, `.remove(valor)` e `.pop(indice)` modificam a lista original diretamente (in-place), sem criar uma cópia.",
    },
  ],
};

const defaultResponse: RagTestChatResponse = {
  answer:
    "Boa pergunta! Com base no material desta turma, recomendo revisar a apostila do capítulo 1 e os slides de estruturas de repetição — eles cobrem os fundamentos de lógica de programação com bastante exemplo prático. Se quiser, pergunte algo mais específico (por exemplo, sobre `for`, `while` ou listas) que eu detalho com trechos do material.",
  provider: "openai/gpt-4o-mini",
  retrievedChunks: [
    {
      chromaId: "chunk-doc1-01",
      documentId: "doc-1",
      documentTitle: "Apostila de Lógica - Capítulo 1",
      chunkIndex: 1,
      score: 0.62,
      content:
        "Este capítulo introduz os conceitos fundamentais de lógica de programação: variáveis, tipos de dados, estruturas condicionais e de repetição.",
    },
  ],
};

/** Escolhe uma resposta canned com base em palavras-chave da pergunta (mock simples, sem LLM real). */
export function pickRagTestChatResponse(message: string): RagTestChatResponse {
  const normalized = message.toLowerCase();
  if (normalized.includes("lista")) return listasResponse;
  if (normalized.includes("for") || normalized.includes("while") || normalized.includes("repeti"))
    return loopsResponse;
  return defaultResponse;
}
