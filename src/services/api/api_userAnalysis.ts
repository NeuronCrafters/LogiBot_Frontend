import { api } from "./api";
import { USER_ANALYSIS_ROUTES } from "@/services/api/api_routes";

export const userAnalysisApi = {
  addInteraction: (text: string) => {
    return api.post(
      USER_ANALYSIS_ROUTES.addInteraction,
      { message: text },
      { withCredentials: true }
    );
  },
}