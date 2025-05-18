/**
 * Verifica se o cache ainda é válido com base no TTL e no timestamp.
 *
 * @param value Valor armazenado no cache
 * @param ttl Tempo de validade em milissegundos
 * @param timestamp Timestamp associado ao dado
 */
export function isCacheValid<T>(
  value: T | null,
  ttl: number,
  timestamp?: number
): boolean {
  if (!value || !timestamp) return false;
  return Date.now() - timestamp < ttl;
}
