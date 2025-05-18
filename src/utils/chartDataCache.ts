interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Tempo padrão de expiração do cache (5 minutos)
const CACHE_EXPIRATION = 5 * 60 * 1000;

// Armazenamento interno do cache
const dataCache: Record<string, CacheEntry<any>> = {};

/**
 * Gera a chave do cache com base nos parâmetros
 */
function generateCacheKey(type: string, metric: string, mode: string, id: string): string {
  return `${type}:${metric}:${mode}:${id}`;
}

/**
 * Verifica se um dado é vazio (usado para não cachear respostas vazias)
 */
function isEmptyData(data: any): boolean {
  if (data == null) return true;
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === "object") return Object.keys(data).length === 0;
  return false;
}

/**
 * Armazena os dados no cache
 */
export function cacheData<T>(
  type: string,
  metric: string,
  mode: string,
  id: string,
  data: T,
  customExpiration?: number
): void {
  const key = generateCacheKey(type, metric, mode, id);
  const now = Date.now();
  const expiration = customExpiration ?? CACHE_EXPIRATION;

  // Não cacheia se os dados estiverem vazios
  if (isEmptyData(data)) {
    if (import.meta.env.DEV) {
      console.log(`[Cache] Dados vazios detectados para ${key}. Ignorando cache.`);
    }
    return;
  }

  dataCache[key] = {
    data,
    timestamp: now,
    expiresAt: now + expiration,
  };

  if (import.meta.env.DEV) {
    console.log(`[Cache] Dados armazenados para ${key}`);
  }
}

/**
 * Retorna os dados do cache se ainda forem válidos
 */
export function getCachedData<T>(
  type: string,
  metric: string,
  mode: string,
  id: string
): T | null {
  const key = generateCacheKey(type, metric, mode, id);
  const entry = dataCache[key];

  if (!entry) return null;

  const now = Date.now();
  if (now > entry.expiresAt || isEmptyData(entry.data)) {
    if (import.meta.env.DEV) {
      console.log(`[Cache] Expirado ou inválido: ${key}`);
    }
    delete dataCache[key];
    return null;
  }

  if (import.meta.env.DEV) {
    console.log(`[Cache] Hit! Usando dados em cache para ${key}`);
  }

  return entry.data;
}

/**
 * Invalida entradas de cache por tipo ou todas
 */
export function invalidateCache(type?: string): void {
  const keys = Object.keys(dataCache);
  const now = Date.now();

  keys.forEach(key => {
    const shouldDelete = !type || key.startsWith(`${type}:`);
    if (shouldDelete) {
      delete dataCache[key];
    }
  });

  if (import.meta.env.DEV) {
    console.log(
      `[Cache] Cache ${type ? `do tipo ${type}` : "completo"} invalidado.`
    );
  }
}

/**
 * Verifica se há dados válidos no cache
 */
export function hasCachedData(
  type: string,
  metric: string,
  mode: string,
  id: string
): boolean {
  const key = generateCacheKey(type, metric, mode, id);
  const entry = dataCache[key];
  return !!entry && Date.now() <= entry.expiresAt && !isEmptyData(entry.data);
}

/**
 * Estatísticas do cache (útil para debug)
 */
export function getCacheStats(): {
  totalEntries: number;
  sizeInBytes: number;
  oldestEntry: Date | null;
} {
  const keys = Object.keys(dataCache);
  let oldest = Date.now();
  let oldestEntry: Date | null = null;

  const sizeInBytes = JSON.stringify(dataCache).length;

  keys.forEach(key => {
    const entry = dataCache[key];
    if (entry.timestamp < oldest) {
      oldest = entry.timestamp;
      oldestEntry = new Date(oldest);
    }
  });

  return {
    totalEntries: keys.length,
    sizeInBytes,
    oldestEntry,
  };
}
