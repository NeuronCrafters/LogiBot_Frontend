import { useRef } from "react";

type CacheStore<T> = Record<string, T>;

export function useDataCache<T>() {
  const memoryCache = useRef<CacheStore<T>>({});

  function getFromMemory(key: string): T | null {
    return memoryCache.current[key] ?? null;
  }

  function setToMemory(key: string, value: T) {
    memoryCache.current[key] = value;
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
    }
  }

  function get(key: string, useLocal = false): T | null {
    if (useLocal) {
      return getFromLocalStorage(key) ?? getFromMemory(key);
    }
    return getFromMemory(key);
  }

  function set(key: string, value: T, persistLocal = false) {
    setToMemory(key, value);
    if (persistLocal) {
      setToLocalStorage(key, value);
    }
  }

  return { get, set };
}
