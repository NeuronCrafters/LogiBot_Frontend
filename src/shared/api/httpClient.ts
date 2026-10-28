import axios from "axios";
import { logger } from "@/shared/lib/logger";

export const apiKey =
  import.meta.env.VITE_API_KEY || "YCQHmf3Zvti8FIi4PC38T4ert4v8zIOp";
const configuredBaseURL = import.meta.env.VITE_API_BASE_URL?.trim();
export const baseURL =
  configuredBaseURL &&
  !/^https?:\/\/(www\.)?saellogibot\.com\/?$/i.test(configuredBaseURL)
    ? configuredBaseURL
    : "https://api.saellogibot.com";

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "x-api-key": apiKey },
});

export const publicApi = axios.create({
  baseURL,
  withCredentials: false,
  headers: { "x-api-key": apiKey },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logger.warn("API", "User not authenticated.");
    } else if (error.response?.status >= 500) {
      logger.error("API", "Internal server error.", error.response.data);
    }
    return Promise.reject(error);
  },
);

publicApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logger.warn("API", "Public authentication error.");
    } else if (error.response?.status >= 500) {
      logger.error("API", "Public internal error.", error.response.data);
    }
    return Promise.reject(error);
  },
);

export default api;
