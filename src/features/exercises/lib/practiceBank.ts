/** Select values of professor questions, apart from the built-in example indexes. */
export const BANK_PREFIX = "bank:";

/** Short option text: the statement, followed by the formula when there is one. */
export function bankOptionLabel(statement: string, formula?: string): string {
  const text = statement.length > 70 ? statement.slice(0, 69).trimEnd() + "…" : statement;
  return formula ? `${text} — ${formula}` : text;
}
