import { useRef } from "react";

type CacheStore<T> = Record<string, T>;
type CacheTimestamps = Record<string, number>;

/**
 * Hook de cache com memória, localStorage e TTL (usado com useCachedFetch e useChartData)
 */
export function useDataCache<T>() {
  const memoryCache = useRef<CacheStore<T>>({});
  const memoryTimestamps = useRef<CacheTimestamps>({});

  function getFromMemory(key: string): T | null {
    return memoryCache.current[key] ?? null;
  }

  function setToMemory(key: string, value: T) {
    memoryCache.current[key] = value;
    memoryTimestamps.current[key] = Date.now();
  }

  function getFromLocalStorage(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function setToLocalStorage(key: string, value: T) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Silencioso
    }
  }

  function get(key: string, useLocal: boolean = false): T | null {
    if (useLocal) {
      return getFromLocalStorage(key) ?? getFromMemory(key);
    }
    return getFromMemory(key);
  }

  function set(key: string, value: T, persistLocal: boolean = false) {
    setToMemory(key, value);
    if (persistLocal) {
      setToLocalStorage(key, value);
    }
  }

  function getTimestamp(key: string): number | undefined {
    return memoryTimestamps.current[key];
  }

  return {
    get,
    set,
    getTimestamp,
  };
}
