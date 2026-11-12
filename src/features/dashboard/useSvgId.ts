import { useId } from "react";

/** A DOM id that is valid inside url(#…) references. */
export function useSvgId(prefix: string) {
  return `${prefix}-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
}
