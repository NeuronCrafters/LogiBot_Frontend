/**
 * Built-in truth-table formulas for the workbench, from simple to composed.
 * Temporary source until professors publish exercises from the question bank.
 */
export const TRUTH_TABLE_CATALOG: readonly string[] = [
  "p -> q",
  "(p -> q) & ~q",
  "~(p & q) <-> ~p | ~q",
  "(p | q) -> r",
  "(p -> q) & (q -> r) -> (p -> r)",
];
