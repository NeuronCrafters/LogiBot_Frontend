import { getLanguage, normalizeLanguage, t, type MessageKey } from "@/i18n";

export function apiError(error: unknown, fallback: MessageKey = "common.unexpectedError"): string {
  const value = error as { code?: string; message?: string; response?: { data?: { message?: string; code?: string }; headers?: Record<string, string> } };
  if (value?.response?.data?.message) {
    const language = normalizeLanguage(value.response.headers?.["content-language"]);
    return language && language !== getLanguage() ? t(fallback) : value.response.data.message;
  }
  if (value?.code === "ERR_NETWORK" || value?.code === "ECONNABORTED" || value?.code === "ETIMEDOUT") return t("common.networkError");
  return t(fallback);
}
