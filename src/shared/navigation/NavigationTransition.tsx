import { useLayoutEffect, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation, type Location } from "react-router-dom";
import { useReducedMotion } from "@/shared/preferences";

type Phase = "idle" | "exit" | "enter";
const EXIT_MS = 160;

/** Retain the outgoing route during its fade; query/hash changes keep their live state. */
export function NavigationTransition({ children }: { children: (location: Location) => ReactNode }) {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const [displayed, setDisplayed] = useState({ location, phase: "idle" as Phase });

  useLayoutEffect(() => {
    if (reduceMotion || displayed.location.pathname === location.pathname) {
      setDisplayed(previous => previous.location === location && (!reduceMotion || previous.phase === "idle") ? previous : {
        location, phase: reduceMotion ? "idle" : previous.phase === "exit" ? "enter" : previous.phase,
      });
      return;
    }
    setDisplayed(previous => ({ ...previous, phase: "exit" }));
    const timer = window.setTimeout(() => setDisplayed({ location, phase: "enter" }), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [location, reduceMotion, displayed.location.pathname]);

  useLayoutEffect(() => {
    if (displayed.phase !== "exit") return;
    const targets = root.current?.querySelectorAll<HTMLElement>('[data-route-scope="content"] main, [data-route-scope="page"] > .navigation-view');
    targets?.forEach(element => element.setAttribute("inert", ""));
    return () => targets?.forEach(element => element.removeAttribute("inert"));
  }, [displayed.phase]);

  useEffect(() => {
    if (displayed.phase !== "enter") return;
    const timer = window.setTimeout(() => setDisplayed(previous => previous.phase === "enter" ? { ...previous, phase: "idle" } : previous), 340);
    return () => window.clearTimeout(timer);
  }, [displayed.phase]);

  const contentOnly = /^\/(?:home|chat|quiz|dashboard|entities|profile|feedback|admin|rag)(?:\/|$)/.test(displayed.location.pathname);
  return <div ref={root} className="navigation-transition" data-route-phase={displayed.phase}
    data-route-scope={contentOnly ? "content" : "page"} aria-busy={displayed.phase === "exit" || undefined}>
    <div className="navigation-view">{children(displayed.location)}</div>
  </div>;
}
