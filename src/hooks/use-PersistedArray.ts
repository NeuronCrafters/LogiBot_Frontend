import { useState, useEffect } from "react";

export function usePersistedArray<T>(key: string, defaultValue: T[]) {
  const [state, setState] = useState<T[]>(() => {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : defaultValue;
  });

  useEffect(() => {
    sessionStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  const push = (item: T) => setState(prev => [...prev, item]);
  const clear = () => setState([]);

  return { state, push, clear };
}