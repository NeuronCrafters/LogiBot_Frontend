interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Configurações de cache
const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutos em milissegundos

// Armazenamento de cache
const dataCache: Record<string, CacheEntry<any>> = {};

/**
 * Gera uma chave de cache com base nos parâmetros passados
 */
function generateCacheKey(type: string, metric: string, mode: string, id: string): string {
  return `${type}:${metric}:${mode}:${id}`;
}

/**
 * Armazena dados no cache
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
  const expiration = customExpiration || CACHE_EXPIRATION;

  dataCache[key] = {
    data,
    timestamp: now,
    expiresAt: now + expiration
  };

  // Log de desenvolvimento
  if (import.meta.env.DEV) {
    console.log(`[Cache] Dados armazenados para ${key}`);
  }
}

/**
 * Obtém dados do cache se disponíveis e válidos
 */
export function getCachedData<T>(type: string, metric: string, mode: string, id: string): T | null {
  const key = generateCacheKey(type, metric, mode, id);
  const entry = dataCache[key];

  // Se não existe entrada ou expirou, retorna null
  if (!entry || Date.now() > entry.expiresAt) {
    if (entry) {
      // Log de cache expirado
      if (import.meta.env.DEV) {
        console.log(`[Cache] Dados expirados para ${key}`);
      }
      // Remove entrada expirada
      delete dataCache[key];
    }
    return null;
  }

  // Log de hit no cache
  if (import.meta.env.DEV) {
    console.log(`[Cache] Hit! Usando dados em cache para ${key}`);
  }

  return entry.data;
}

/**
 * Invalida todas as entradas de cache ou apenas para um tipo específico
 */
export function invalidateCache(type?: string): void {
  if (type) {
    // Remove apenas entradas do tipo especificado
    Object.keys(dataCache).forEach(key => {
      if (key.startsWith(`${type}:`)) {
        delete dataCache[key];
      }
    });

    if (import.meta.env.DEV) {
      console.log(`[Cache] Cache invalidado para o tipo ${type}`);
    }
  } else {
    // Limpa todo o cache
    Object.keys(dataCache).forEach(key => {
      delete dataCache[key];
    });

    if (import.meta.env.DEV) {
      console.log(`[Cache] Cache completamente invalidado`);
    }
  }
}

/**
 * Verifica se há dados em cache para uma determinada consulta
 */
export function hasCachedData(type: string, metric: string, mode: string, id: string): boolean {
  const key = generateCacheKey(type, metric, mode, id);
  const entry = dataCache[key];
  return !!entry && Date.now() <= entry.expiresAt;
}

/**
 * Retorna estatísticas do cache atual
 */
export function getCacheStats(): { totalEntries: number, sizeInBytes: number, oldestEntry: Date | null } {
  const keys = Object.keys(dataCache);
  let oldestTimestamp = Date.now();
  let oldestEntry = null;

  // Calcula o tamanho aproximado em bytes (estimativa)
  const cacheSize = JSON.stringify(dataCache).length;

  // Encontra a entrada mais antiga
  keys.forEach(key => {
    const entry = dataCache[key];
    if (entry.timestamp < oldestTimestamp) {
      oldestTimestamp = entry.timestamp;
      oldestEntry = new Date(oldestTimestamp);
    }
  });

  return {
    totalEntries: keys.length,
    sizeInBytes: cacheSize,
    oldestEntry
  };
}