import { useState, useEffect, useRef } from "react";
import { logApi } from "@/services/api/api_logs_extended";
import { LogEntityType, LogMetricType, LogModeType } from "@/services/api/api_routes";

export type LoadingState = "idle" | "loading" | "success" | "error";

const DEFAULT_TTL = 5 * 60 * 1000;
const cacheTimestamps: Record<string, number> = {};

/**
 * Hook para carregar dados com cache TTL para gráficos
 */
export function useChartData<T>(
  entity: LogEntityType,
  metric: LogMetricType,
  mode: LogModeType,
  idOrIds: string | string[],
  skipAutoFetch = false
) {
  const [data, setData] = useState<T | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);

  const isMounted = useRef(true);

  const cacheId = Array.isArray(idOrIds)
    ? idOrIds.filter(Boolean).sort().join("-")
    : (idOrIds || "");

  const cacheKey = `${entity}:${metric}:${mode}:${cacheId}`;
  const now = Date.now();

  const isValidId = typeof idOrIds === "string" && idOrIds.trim() !== "";
  const isValidIdArray = Array.isArray(idOrIds) && idOrIds.length > 0 && idOrIds.every(id => id.trim() !== "");
  const hasValidIds = isValidId || isValidIdArray;

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchData = async (forceRefresh = false) => {
    if (!hasValidIds) return;

    const shouldUseCache =
      !forceRefresh &&
      cacheTimestamps[cacheKey] &&
      now - cacheTimestamps[cacheKey] < DEFAULT_TTL;

    if (shouldUseCache) return;

    try {
      setLoadingState("loading");
      setError(null);

      const result = await logApi.getCached<T>(entity, metric, mode, idOrIds, forceRefresh);

      if (isMounted.current) {
        setData(result);
        setLoadingState("success");
        cacheTimestamps[cacheKey] = Date.now();
      }
    } catch (err: any) {
      if (isMounted.current) {
        console.error(`Erro ao carregar dados para ${entity}/${metric}:`, err);
        setError(err?.message || "Erro ao carregar dados");
        setLoadingState("error");
      }
    }
  };

  useEffect(() => {
    if (skipAutoFetch || !hasValidIds) {
      if (!hasValidIds) {
        setData(null);
        setLoadingState("idle");
        setError(null);
      }
      return;
    }

    fetchData();
  }, [entity, metric, mode, cacheId, skipAutoFetch, hasValidIds]);

  return {
    data,
    loadingState,
    isLoading: loadingState === "loading",
    isError: loadingState === "error",
    isSuccess: loadingState === "success",
    error,
    hasValidIds,
    refresh: () => fetchData(true),
  };
}
