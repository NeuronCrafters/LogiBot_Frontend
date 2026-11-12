import { useLayoutEffect, useState, type RefObject } from "react";

/** Positions portals against the viewport, even inside clipped or scrolling chart panels. */
export function useFloatingPosition(open: boolean, anchor: RefObject<HTMLElement>, panel: RefObject<HTMLElement>) {
  const [position, setPosition] = useState({ left: 16, top: 16, visibility: "hidden" as "hidden" | "visible" });
  useLayoutEffect(() => {
    if (!open || !anchor.current || !panel.current) return;
    const update = () => {
      const source = anchor.current?.getBoundingClientRect();
      const content = panel.current?.getBoundingClientRect();
      if (!source || !content) return;
      const viewport = window.visualViewport;
      const x = viewport?.offsetLeft ?? 0, y = viewport?.offsetTop ?? 0;
      const width = viewport?.width ?? innerWidth, height = viewport?.height ?? innerHeight;
      const left = Math.max(x + 16, Math.min(source.left, x + width - content.width - 16));
      const below = source.bottom + 8;
      const top = Math.max(y + 16, Math.min(below + content.height <= y + height - 16 ? below : source.top - content.height - 8, y + height - content.height - 16));
      const visibility = source.bottom < y || source.top > y + height || source.right < x || source.left > x + width ? "hidden" : "visible";
      setPosition(current => current.left === left && current.top === top && current.visibility === visibility ? current : { left, top, visibility });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(panel.current);
    observer.observe(anchor.current);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
    };
  });
  return position;
}
