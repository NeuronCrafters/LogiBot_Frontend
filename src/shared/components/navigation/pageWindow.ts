export const PAGE_SIZE_OPTIONS = [6, 12, 24, 48];

/** Page numbers to show: first, last and the neighbours of the current one, with gaps in between. */
export function pageWindow(page: number, totalPages: number): Array<number | "gap"> {
  const wanted = new Set([1, totalPages, page - 1, page, page + 1].filter((value) => value >= 1 && value <= totalPages));
  const sorted = Array.from(wanted).sort((a, b) => a - b);
  const result: Array<number | "gap"> = [];
  sorted.forEach((value, index) => {
    if (index > 0 && value - sorted[index - 1] > 1) result.push(value - sorted[index - 1] === 2 ? value - 1 : "gap");
    result.push(value);
  });
  return result;
}
