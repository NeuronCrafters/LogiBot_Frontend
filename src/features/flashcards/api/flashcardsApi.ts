import { api } from "@/shared/api/httpClient";

export type Rating = "again" | "hard" | "good";
export interface CardDraft { id?: string; front: string; back: string; concept: string | null; sourceQuestionId?: string | null }
export interface DeckSummary {
  id: string; disciplineId: string; title: string; description: string | null; language: string; published: boolean;
  updatedAt: string; disciplineName: string; cards: number;
}
export interface DeckDetail extends Omit<DeckSummary, "disciplineName" | "cards"> { cards: Array<CardDraft & { id: string }> }
export interface DeckForm { disciplineId: string; title: string; description: string; language: string; published: boolean; cards: CardDraft[] }
export interface StudyDeck { id: string; title: string; description: string | null; language: string; disciplineName: string; cards: number; due: number; known: number; seen: number }
export interface StudySession {
  deck: { id: string; title: string; language: string };
  /** Nothing due: the student is practising ahead. */
  ahead: boolean; total: number; due: number;
  cards: Array<{ id: string; front: string; back: string; concept: string | null; box: number }>;
}
export interface Candidate { id: string; front: string; back: string; concept: string | null }
export interface FieldIssue { field: string; code: string; params?: Record<string, number> }

export const flashcardsApi = {
  async decks(disciplineId = ""): Promise<DeckSummary[]> {
    return (await api.get("/flashcards/decks", { params: disciplineId ? { disciplineId } : {} })).data;
  },
  async deck(id: string): Promise<DeckDetail> {
    return (await api.get(`/flashcards/decks/${encodeURIComponent(id)}`)).data;
  },
  async save(id: string | null, form: DeckForm): Promise<DeckDetail> {
    return id ? (await api.put(`/flashcards/decks/${encodeURIComponent(id)}`, form)).data : (await api.post("/flashcards/decks", form)).data;
  },
  async remove(id: string) {
    await api.delete(`/flashcards/decks/${encodeURIComponent(id)}`);
  },
  async candidates(disciplineId: string): Promise<Candidate[]> {
    return (await api.get("/flashcards/candidates", { params: { disciplineId } })).data;
  },
  async study(): Promise<StudyDeck[]> {
    return (await api.get("/flashcards/study")).data;
  },
  async session(deckId: string): Promise<StudySession> {
    return (await api.get(`/flashcards/study/${encodeURIComponent(deckId)}`)).data;
  },
  async review(cardId: string, rating: Rating): Promise<{ box: number; dueAt: string }> {
    return (await api.post(`/flashcards/cards/${encodeURIComponent(cardId)}/review`, { rating })).data;
  },
};
