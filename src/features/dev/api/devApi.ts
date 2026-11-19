import { api } from "@/shared/api/httpClient";

export interface DevStatus {
  configured: boolean;
  passwordConfigured: boolean;
  structure: Array<{ institution: string; courses: string[] }>;
  accounts: Array<{ email: string; role: string }>;
  periods: number[];
  suppressedMails: Array<{ to: string; subject: string; at: string }>;
}

export const devApi = {
  async status(): Promise<DevStatus> {
    const res = await api.get("/dev/status");
    return res.data;
  },
  async reset(days: number): Promise<{ accounts: number; institutions: number; sessions: number; answers: number; quizAttempts: number }> {
    const res = await api.post("/dev/sandbox/reset", { days });
    return res.data;
  },
  async enter(email: string): Promise<void> {
    await api.post("/dev/sandbox/enter", { email });
  },
  async leave(): Promise<void> {
    await api.post("/dev/sandbox/leave");
  },
};
