import { api } from "@/shared/api/httpClient";

export type ProficiencyScope = "me" | "class" | "course" | "institution" | "all";
export interface ScopeOptions {
  me: boolean;
  all: boolean;
  institutions: Array<{ id: string; name: string }>;
  courses: Array<{ id: string; name: string; institutionId: string }>;
  classes: Array<{ id: string; name: string; courseId: string; courseName: string; institutionId: string; teaches: boolean }>;
}
export interface Rate { total: number; score: number | null }
export interface ConceptProficiency extends Rate {
  concept: string;
  students: number;
  practice: Rate;
  exam: Rate;
  trend: Array<{ week: string } & Rate>;
}
export interface ProficiencyData {
  scope: ProficiencyScope;
  id: string;
  days: number;
  minGroupSize: number;
  aggregated: boolean;
  concepts: ConceptProficiency[];
  hidden: number;
  students?: Array<{ id: string; name: string; concepts: Record<string, Rate> }>;
}

export const conceptsApi = {
  async scopes(): Promise<ScopeOptions> {
    const res = await api.get("/concepts/scopes");
    return res.data;
  },
  async proficiency(params: { scope: ProficiencyScope; id?: string; days: number }): Promise<ProficiencyData> {
    const res = await api.get("/concepts/proficiency", { params: { scope: params.scope, days: params.days, ...(params.id ? { id: params.id } : {}) } });
    return res.data;
  },
};
