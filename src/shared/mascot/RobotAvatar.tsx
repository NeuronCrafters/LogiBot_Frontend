import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { usePreferences, useResolvedPreferences } from "@/shared/preferences";
import { StaticRobot } from "./StaticRobot";
import { AnimatedLogo } from "@/shared/components/AnimatedLogo";
import "./mascot.css";
import type { RobotMood, RobotVariant } from "./types";

const RobotScene = lazy(() => import("./RobotScene"));
let webGL: boolean | undefined;
function supportsWebGL() {
  if (webGL !== undefined) return webGL;
  if (typeof WebGL2RenderingContext === "undefined") return false;
  try {
    const context = document.createElement("canvas").getContext("webgl2", { powerPreference: "low-power" });
    webGL = !!context;
    context?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch { webGL = false; }
  return webGL;
}

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

/** Decorative only: no timers or scene events are sent to the activity/auth APIs. */
export function RobotAvatar({ variant = "full", mood = "welcome", reaction = 0, className = "" }: {
  variant?: RobotVariant; mood?: RobotMood; reaction?: number; className?: string;
}) {
  const preferences = usePreferences();
  const { reduceMotion, palette } = useResolvedPreferences();
  const root = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [localReaction, setLocalReaction] = useState(0);
  const onReady = useCallback(() => setReady(true), []);
  const onUnavailable = useCallback(() => setFailed(true), []);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let intersecting = false;
    const update = () => setVisible(intersecting && document.visibilityState === "visible");
    const observer = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(([entry]) => {
      intersecting = entry.isIntersecting;
      update();
    }, { threshold: 0.05 }) : null;
    if (observer) observer.observe(element);
    else { intersecting = true; update(); }
    document.addEventListener("visibilitychange", update);
    return () => { observer?.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, []);
  const animate = visible && !reduceMotion && preferences.mascot === "animated" && !failed && supportsWebGL();
  useEffect(() => { if (!animate) setReady(false); }, [animate]);
  const legacy = preferences.mascot === "legacy";
  const fallback = legacy ? <AnimatedLogo /> : <StaticRobot variant={variant} />;
  return <div ref={root} aria-hidden="true" data-robot-avatar data-variant={legacy ? "head" : variant} data-renderer={legacy ? "legacy" : animate && ready ? "3d" : "static"}
    className={`relative isolate shrink-0 ${className}`}
    onPointerEnter={() => setLocalReaction(value => value + 1)}>
    {variant === "full" && animate && ready && <div className="pointer-events-none absolute bottom-[7%] left-[30%] right-[30%] h-[5%] rounded-[50%] bg-blue-500/15 blur-sm" />}
    <div className={`pointer-events-none absolute inset-0 ${animate && ready ? "invisible" : ""}`}>{fallback}</div>
    {animate && <div className="pointer-events-none absolute inset-0" key="scene">
      <SceneBoundary fallback={fallback}>
        <Suspense fallback={null}>
          <RobotScene variant={variant} mood={mood} reaction={reaction + localReaction} monochrome={palette === "monochrome"} onReady={onReady} onUnavailable={onUnavailable} />
        </Suspense>
      </SceneBoundary>
    </div>}
  </div>;
}
