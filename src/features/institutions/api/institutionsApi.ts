import { api } from "@/shared/api/httpClient";

/** Kinds the academic structure covers today (keep in sync with the backend). */
export type InstitutionKind = "universidade" | "faculdade" | "instituto" | "escola_tecnica";
export const INSTITUTION_KINDS: InstitutionKind[] = ["universidade", "faculdade", "instituto", "escola_tecnica"];
export type ViewerLevel = "student" | "professor" | "coordinator" | "admin";

export interface InstitutionSummary {
  id: string; name: string; kind: InstitutionKind | null; city: string | null; state: string | null; logo: string | null;
  active: boolean; courses: number; classes: number;
}
export interface InstitutionData {
  id: string; name: string; kind: InstitutionKind | null; city: string | null; state: string | null; country: string | null;
  address: string | null; addressNumber: string | null; district: string | null; postalCode: string | null; latitude: number | null; longitude: number | null;
  website: string | null; links: InstitutionLink[]; about: string | null; logo: string | null; cover: string | null; active: boolean; deactivatedAt: string | null;
}
export type Week = { week: string; active: number };
/** Student: their own class, its subjects with the professor in charge, classmates' names. */
export interface MyClass {
  id: string; name: string; course: string;
  disciplines: Array<{ id: string; name: string; professors: string[] }>;
  classmates: string[];
}
/** Professor: the classes they teach and, per subject, its students and weekly activity. */
export interface Teaching {
  classes: Array<{ id: string; name: string; course: string; students: number }>;
  disciplines: Array<{ id: string; name: string; course: string; classes: string[]; students: Array<{ name: string; className: string }>; weeks: Week[] }>;
}
/**
 * Each profile gets its own part: `myClass` (student), `teaching` (professor) or the aggregated
 * numbers (coordination: its courses; admin: the whole institution). In the aggregated part `null`
 * numbers mean "fewer than 5" (hidden for small groups).
 */
export interface InstitutionPageData {
  viewer: { level: ViewerLevel; canEdit: boolean; canChangeStatus: boolean; canChangeComponents: boolean };
  /** Page components the owner can turn off for the institution (off: not shown, not returned, not edited). */
  components: InstitutionComponents;
  institution: InstitutionData;
  minGroupSize: number;
  myClass?: MyClass | null;
  teaching?: Teaching;
  counts?: { courses: number; classes: number; disciplines: number };
  overview?: {
    students: number | null; activeShare: number | null; activeChange: number | null; quizAccuracy: number | null;
    chatSatisfaction: number | null; weeks: Week[]; concepts: Array<{ concept: string; score: number; total: number }>;
  };
  courses?: Array<{ id: string; name: string; classes: number; disciplines: number; students: number | null; activeShare?: number | null }>;
  classes?: Array<{ id: string; name: string; course: string; students: number | null; activeShare: number | null; quizAccuracy?: number | null }>;
  disciplines?: Array<{ id: string; name: string; course: string; classes: number; questions: number; releasedExams?: number }>;
  /** Team only as counts by role (nobody is named); `students` is null for fewer than 5. */
  team?: { coordinators: number; professors: number; students: number | null };
}
export interface InstitutionComponents { location: boolean; photo: boolean }
export type LinkKind = "instagram" | "facebook" | "youtube" | "linkedin" | "blog" | "site";
export const LINK_KINDS: LinkKind[] = ["instagram", "facebook", "youtube", "linkedin", "blog", "site"];
export const MAX_LINKS = 8;
export interface InstitutionLink { kind: LinkKind; url: string }
export type InstitutionComponent = keyof InstitutionComponents;
export const COMPONENT_FEATURE = { location: "institution_location", photo: "institution_photo" } as const;
export interface InstitutionForm {
  name: string; kind: InstitutionKind | ""; city: string; state: string; country: string; address: string; addressNumber: string; district: string; postalCode: string;
  latitude: string; longitude: string; website: string; about: string; links: InstitutionLink[];
}
export interface Place { label: string; latitude: number; longitude: number }
export interface FieldIssue { field: string; code: string; params?: Record<string, number> }

export const institutionsApi = {
  async list(): Promise<InstitutionSummary[]> {
    return (await api.get("/institutions")).data;
  },
  async page(id: string): Promise<InstitutionPageData> {
    return (await api.get(`/institutions/${encodeURIComponent(id)}`)).data;
  },
  /** Without the location component the location fields are left out (the server keeps what it had). */
  async update(id: string, form: InstitutionForm, withLocation = true) {
    const { city, state, country, address, addressNumber, district, postalCode, latitude, longitude, ...rest } = form;
    const location = withLocation ? { city, state, country, address, addressNumber, district, postalCode, latitude: latitude.trim() || null, longitude: longitude.trim() || null } : {};
    return (await api.put(`/institutions/${encodeURIComponent(id)}`, { ...rest, ...location, kind: form.kind || null })).data;
  },
  /** Brazilian CEP: street and district, city, state and country (looked up by the server). */
  async postalCode(id: string, cep: string): Promise<{ postalCode: string; address: string | null; district: string | null; city: string | null; state: string | null; country: string }> {
    return (await api.get(`/institutions/${encodeURIComponent(id)}/postal-code`, { params: { cep } })).data;
  },
  async geocode(id: string, query: string): Promise<Place[]> {
    return (await api.get(`/institutions/${encodeURIComponent(id)}/geocode`, { params: { q: query } })).data;
  },
  async setImage(id: string, kind: "logo" | "cover", image: string | null) {
    return (await api.put(`/institutions/${encodeURIComponent(id)}/${kind}`, { image })).data;
  },
  async setStatus(id: string, active: boolean): Promise<{ active: boolean; deactivatedAt: string | null }> {
    return (await api.post(`/institutions/${encodeURIComponent(id)}/status`, { active })).data;
  },
};
