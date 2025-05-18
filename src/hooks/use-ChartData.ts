import { useState, useEffect, useRef } from "react";
import { logApi } from "@/services/api/logApi";
import { LogEntityType, LogMetricType, LogModeType } from "@/services/api/api_routes";

export type LoadingState = "idle" | "loading" | "success" | "error";

const SHORT_TTL = 5 * 60 * 1000;
const LONG_TTL = 12 * 60 * 60 * 1000;

const cacheTimestamps: Record<string, number> = {};

export function useChartData<T>(
  entity: LogEntityType,
  metric: LogMetricType,
  mode: LogModeType,
  idOrIds: string | string[],
  skipAutoFetch = false
) {
  console.log(`[Hook] useChartData - Chamado para ${entity}/${metric}/${mode} com ID:`, idOrIds);

  const [data, setData] = useState<T | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);
  const fetchAttempts = useRef(0);
  const initialFetchDone = useRef(false);

  const cacheId = Array.isArray(idOrIds)
    ? idOrIds.filter(Boolean).sort().join("-")
    : (idOrIds || "");
  const cacheKey = `${entity}:${metric}:${mode}:${cacheId}`;

  const isValidId = typeof idOrIds === "string" && idOrIds.trim() !== "";
  const isValidIdArray = Array.isArray(idOrIds) && idOrIds.length > 0 && idOrIds.every(id => id.trim() !== "");
  const hasValidIds = isValidId || isValidIdArray;

  // Log do estado de validação dos IDs
  useEffect(() => {
    console.log(`[Hook] useChartData - Validação de ID para ${cacheKey}:`, {
      isValidId, isValidIdArray, hasValidIds, idOrIds
    });
  }, [cacheKey, isValidId, isValidIdArray, hasValidIds, idOrIds]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Reset de variáveis quando os parâmetros mudam
  useEffect(() => {
    fetchAttempts.current = 0;
    initialFetchDone.current = false;

    // Limpar estado quando ID muda
    if (!hasValidIds) {
      console.log(`[Hook] useChartData - Limpando estados por falta de IDs válidos`);
      setData(null);
      setLoadingState("idle");
      setError(null);
    }
  }, [entity, metric, mode, cacheId, hasValidIds]);

  const fetchData = async (forceRefresh = false) => {
    if (!hasValidIds) {
      console.log(`[Hook] useChartData - fetchData cancelado: IDs inválidos`);
      return;
    }

    console.log(`[Hook] useChartData - fetchData iniciado para ${cacheKey} (força: ${forceRefresh})`);

    // Prevenir tentativas excessivas
    if (fetchAttempts.current > 3 && !forceRefresh) {
      console.warn(`[Hook] useChartData - Tentativas excessivas de busca para ${cacheKey}. Abortando.`);
      return;
    }

    const now = Date.now();
    const lastFetched = cacheTimestamps[cacheKey] ?? 0;
    const timeSinceLast = now - lastFetched;

    const useShortTTL = timeSinceLast < SHORT_TTL;
    const useLongTTL = timeSinceLast < LONG_TTL;

    // Verificar se é para usar o cache
    const shouldUseCache = !forceRefresh && data !== null && useShortTTL;

    if (shouldUseCache && useLongTTL) {
      console.log(`[Hook] useChartData - Usando cache válido para ${cacheKey}`);
      return;
    }

    try {
      fetchAttempts.current++;
      setLoadingState("loading");
      setError(null);

      console.log(`[Hook] useChartData - Buscando dados da API para ${cacheKey} (tentativa ${fetchAttempts.current})`);

      // Chamada explícita para a API
      const result = await logApi.getCached<T>(entity, metric, mode, idOrIds, forceRefresh);

      console.log(`[Hook] useChartData - Dados recebidos da API para ${cacheKey}:`, result);

      if (isMounted.current) {
        initialFetchDone.current = true;
        setData(result);
        setLoadingState("success");
        cacheTimestamps[cacheKey] = Date.now();
        console.log(`[Hook] useChartData - Estados atualizados para ${cacheKey}: loadingState=success, data=`, result);
      }
    } catch (err: any) {
      if (isMounted.current) {
        initialFetchDone.current = true;
        console.error(`[Hook] useChartData - Erro ao carregar dados para ${cacheKey}:`, err);
        setError(err?.message || "Erro ao carregar dados");
        setLoadingState("error");
        console.log(`[Hook] useChartData - Estados atualizados para ${cacheKey}: loadingState=error, error=${err?.message}`);
      }
    }
  };

  // Efeito para buscar dados quando os parâmetros mudam
  useEffect(() => {
    if (skipAutoFetch || !hasValidIds) {
      console.log(`[Hook] useChartData - Pulando fetchData automático para ${cacheKey}`, { skipAutoFetch, hasValidIds });
      return;
    }

    // Evita problemas de race condition
    const timer = setTimeout(() => {
      if (hasValidIds && !initialFetchDone.current) {
        console.log(`[Hook] useChartData - Iniciando fetchData automático para ${cacheKey}`);
        fetchData();
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [entity, metric, mode, cacheId, skipAutoFetch, hasValidIds]);

  // Log dos estados atuais para debugging
  useEffect(() => {
    console.log(`[Hook] useChartData - Estados atuais para ${cacheKey}:`, {
      loadingState,
      isLoading: loadingState === "loading",
      isError: loadingState === "error",
      isSuccess: loadingState === "success" && initialFetchDone.current,
      dataPresente: data !== null,
      error
    });
  }, [cacheKey, loadingState, data, error]);

  return {
    data,
    loadingState,
    isLoading: loadingState === "loading",
    isError: loadingState === "error",
    isSuccess: loadingState === "success" && initialFetchDone.current,
    error,
    hasValidIds,
    refresh: () => fetchData(true),
  };
}