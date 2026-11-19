import { useEffect, useState } from "react";

/** Rows shown at a time in truth tables: small tables stay whole, large ones get pages. */
export const TABLE_ROWS_PER_PAGE = 16;

/** Page of a row (0-based). */
export const pageOfRow = (row: number, perPage = TABLE_ROWS_PER_PAGE) => Math.floor(row / perPage) + 1;

/** Pages of a truth table; back to the first page whenever `resetKey` (formula, columns) changes. */
export function useRowPages(total: number, resetKey: string, perPage = TABLE_ROWS_PER_PAGE) {
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [resetKey]);
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * perPage;
  return { page: current, setPage, pageCount, perPage, start, end: Math.min(total, start + perPage), paged: total > perPage };
}
