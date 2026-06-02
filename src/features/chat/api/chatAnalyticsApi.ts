import { api } from "@/shared/api/httpClient";

export const userAnalysisApi = {
  addInteraction: (text: string) => {
    return api.post(
      "/analytics/interaction",
      { message: text },
      { withCredentials: true }
    );
  },
};
