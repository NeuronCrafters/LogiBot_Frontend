export function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (minutes < 1) return "há menos de um minuto";
  if (minutes < 60) return `há ${minutes} minuto${minutes !== 1 ? "s" : ""}`;
  if (hours < 24) return `há ${hours} hora${hours !== 1 ? "s" : ""}`;
  if (days < 30) return `há ${days} dia${days !== 1 ? "s" : ""}`;
  if (months < 12) return `há ${months} mês${months !== 1 ? "es" : ""}`;
  return `há ${years} ano${years !== 1 ? "s" : ""}`;
}

export function formatDuration(end: Date, start: Date): string {
  const diff = end.getTime() - start.getTime();
  const seconds = Math.floor(diff / 1_000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} dia${days !== 1 ? "s" : ""}`;
  if (hours > 0) return `${hours} hora${hours !== 1 ? "s" : ""}`;
  if (minutes > 0) return `${minutes} minuto${minutes !== 1 ? "s" : ""}`;
  return `${seconds} segundo${seconds !== 1 ? "s" : ""}`;
}

export function formatDateTime(date: Date): string {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(2);
  return `${hh}:${mm}:${ss} de ${dd}/${mo}/${yy}`;
}
