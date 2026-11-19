import { api } from "@/shared/api/httpClient";
import type {
  HintResponse,
  HintStatus,
  PracticeBankItem,
  PracticeBankType,
  ParsonsAttemptRequest,
  ParsonsAttemptResponse,
  TranslationAttemptRequest,
  TranslationAttemptResponse,
  TruthTableAttemptRequest,
  TruthTableAttemptResponse,
} from "@/features/exercises/types";

// The server grades again; each response is the official result of the attempt.
export const exercisesApi = {
  async listPracticeQuestions(type: PracticeBankType): Promise<PracticeBankItem[]> {
    const res = await api.get("/exercises/bank", { params: { type }, withCredentials: true });
    return res.data;
  },
  async submitTruthTableAttempt(payload: TruthTableAttemptRequest): Promise<TruthTableAttemptResponse> {
    const res = await api.post("/exercises/attempts", payload, { withCredentials: true });
    return res.data;
  },
  async submitTranslationAttempt(payload: TranslationAttemptRequest): Promise<TranslationAttemptResponse> {
    const res = await api.post("/exercises/attempts", payload, { withCredentials: true });
    return res.data;
  },
  async hintStatus(exerciseId: string): Promise<HintStatus> {
    const res = await api.get("/exercises/hints", { params: { exerciseId }, withCredentials: true });
    return res.data;
  },
  async requestHint(attemptId: string): Promise<HintResponse> {
    const res = await api.post("/exercises/hints", { attemptId }, { withCredentials: true });
    return res.data;
  },
  async submitParsonsAttempt(payload: ParsonsAttemptRequest): Promise<ParsonsAttemptResponse> {
    const res = await api.post("/exercises/attempts", payload, { withCredentials: true });
    return res.data;
  },
};
