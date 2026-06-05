export type RagMode = "none" | "context" | "self";

export interface RagClass {
  id: string;
  name: string;
  courseId: string;
  courseName: string;
  registrationCode: string;
}

export interface RagSettings {
  classId: string;
  ragMode: RagMode;
  topK: number;
  minScore: number;
  systemPrompt: string | null;
  llmModel: string | null;
  embeddingModel: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type RagDocumentStatus =
  | "uploaded"
  | "processing"
  | "ready"
  | "error"
  | "deleted";

export interface RagDocument {
  id: string;
  classId: string;
  uploadedBy: string;
  title: string;
  originalFileName: string;
  storedFileName: string;
  filePath: string;
  extractedTextPath: string | null;
  sourceType: "pdf" | "txt" | "docx" | string;
  mimeType: string;
  fileSize: number;
  status: RagDocumentStatus;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface RagRetrievedChunk {
  chromaId: string;
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  score: number;
  content: string;
}

export interface RagTestChatResponse {
  answer: string;
  provider: string;
  retrievedChunks: RagRetrievedChunk[];
}
