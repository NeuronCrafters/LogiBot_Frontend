/**
 * Verifica se os dados em cache ainda são válidos com base em um TTL.
 *
 * @param data Dados armazenados em cache
 * @param maxAgeMs Tempo máximo de validade (em milissegundos)
 * @param timestamp Timestamp da última atualização dos dados
 * @returns true se os dados ainda são válidos, false se estão expirados ou ausentes
 */
export function isCacheValid<T>(data: T[] | undefined, maxAgeMs: number, timestamp?: number): boolean {
  if (!data || !timestamp) return false;
  return Date.now() - timestamp < maxAgeMs;
}
