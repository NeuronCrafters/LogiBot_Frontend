function formatTitle(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/^\w|\s\w/g, (c) => c.toUpperCase());
}

export { formatTitle }