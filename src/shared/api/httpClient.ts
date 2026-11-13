import { requestLanguageHeaders } from "@/i18n";
﻿import axios from "axios";
import { logger } from "@/shared/lib/logger";

export const apiKey =
  import.meta.env.VITE_API_KEY || "";
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

for (const client of [api, publicApi]) {
  client.interceptors.request.use(config => {
    for (const [header, value] of Object.entries(requestLanguageHeaders())) { if (!config.headers.has(header)) config.headers.set(header, value); }
    return config;
  });
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logger.warn("API", "Usuário não autenticado.");
      const path = String(error.config?.url || "");
      if (error.response?.data?.code !== "auth.apiKeyInvalid" && !/^\/auth\/(session|register|password-reset|password-reset-requests)$/.test(path)) {
        window.dispatchEvent(new Event("logibot:unauthorized"));
      }
    } else if (error.response?.status >= 500) {
      logger.error("API", "Erro interno do servidor.", error.response.data);
    }
    return Promise.reject(error);
  },
);

publicApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logger.warn("API", "Erro público de autenticação.");
    } else if (error.response?.status >= 500) {
      logger.error("API", "Erro interno público.", error.response.data);
    }
    return Promise.reject(error);
  },
);

export default api;
