import { useEffect, useState } from "react";
import { useDataCache } from "@/hooks/use-DataCache";
import { isCacheValid } from "@/utils/isCacheValid";

/**
 * TTL padrão de 5 minutos
 */
const DEFAULT_TTL = 5 * 60 * 1000;

/**
 * Hook para buscar dados com cache em memória e TTL
 */
export function useCachedFetch<T>(
  key: string,
  fetchFn: () => Promise<T[]>,
  ttl = DEFAULT_TTL
) {
  const { get, set, getTimestamp } = useDataCache<T[]>();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      const cached = get(key);
      const timestamp = getTimestamp(key);

      if (cached && isCacheValid(cached, ttl, timestamp)) {
        if (isMounted) setData(cached);
        return;
      }

      try {
        setLoading(true);
        const result = await fetchFn();
        if (isMounted) {
          setData(result);
          set(key, result, false);
        }
      } catch (error) {
        console.error(`Erro ao buscar dados para ${key}:`, error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [key, ttl]);

  return { data, loading };
}
