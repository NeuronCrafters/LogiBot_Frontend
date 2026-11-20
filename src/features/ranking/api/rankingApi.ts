import { api } from "@/shared/api/httpClient";

export type Source = "practice" | "quiz" | "exam" | "flashcards";
export const SOURCES: Source[] = ["practice", "quiz", "exam", "flashcards"];
export type Level = "student" | "professor" | "coordinator" | "admin";
export const LEVELS: Level[] = ["student", "professor", "coordinator", "admin"];
export type Scope = "class" | "course" | "institution";
export interface Rules { periodDays: number; weights: Record<Source, number>; visibleTo: Record<Level, boolean>; studentNames: boolean }
export interface RankingScopes {
  allowed: boolean; level: Level;
  institutions: Array<{ id: string; name: string }>;
  courses: Array<{ id: string; name: string; institutionId: string }>;
  classes: Array<{ id: string; name: string; courseId: string; courseName: string; institutionId: string }>;
}
export interface RankingData {
  scope: Scope; id: string; name: string;
  /** `sources`: activities that count here (those of features turned off are left out). */
  rules: { periodDays: number; weights: Record<Source, number>; studentNames: boolean; sources?: Source[] };
  since: string;
  viewer: { level: Level; canConfigure: boolean };
  minGroupSize: number;
  groupLevel: "class" | "course" | null;
  groups: Array<{ id: string; name: string; students: number; averagePoints: number; position: number }>;
  hiddenGroups: number;
  /** `name` is null for classmates when students may see the ranking without names; `breakdown` only where allowed. */
  students: Array<{ position: number; name: string | null; className: string | null; points: number; me: boolean; breakdown?: Record<Source, number> }>;
}
export interface RankingSettings { defaults: Rules; global: Partial<Rules> | null; institution: Partial<Rules> | null; effective: Rules; periods: number[] }
export interface FieldIssue { field: string; code: string; params?: Record<string, number> }

export const rankingApi = {
  async scopes(): Promise<RankingScopes> {
    return (await api.get("/ranking/scopes")).data;
  },
  async ranking(scope: Scope, id: string): Promise<RankingData> {
    return (await api.get("/ranking", { params: { scope, id } })).data;
  },
  async settings(institutionId = ""): Promise<RankingSettings> {
    return (await api.get("/ranking-settings", { params: institutionId ? { institutionId } : {} })).data;
  },
  async saveSettings(scope: "global" | "institution", scopeId: string, config: Partial<Rules>): Promise<RankingSettings> {
    return (await api.put("/ranking-settings", { scope, scopeId, config })).data;
  },
  async clearSettings(scopeId: string) {
    await api.post("/ranking-settings/clear", { scope: "institution", scopeId });
  },
};
