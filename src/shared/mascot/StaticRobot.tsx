import { useId } from "react";
import type { RobotVariant } from "./types";

export function StaticRobot({ variant }: { variant: RobotVariant }) {
  const id = useId().replace(/:/g, "");
  if (variant === "head") return <svg viewBox="0 0 220 180" fill="none" className="h-full w-full" aria-hidden="true">
    <defs><linearGradient id={`${id}-head`} x1="50" y1="55" x2="160" y2="150" gradientUnits="userSpaceOnUse"><stop stopColor="#fff" /><stop offset="1" stopColor="#bdd6e3" /></linearGradient></defs>
    <path d="M70 64 59 36M150 64l11-28" stroke="#dcecf3" strokeWidth="7" strokeLinecap="round" />
    <ellipse cx="110" cy="106" rx="78" ry="46" fill={`url(#${id}-head)`} />
    <rect x="82" y="94" width="9" height="26" rx="4.5" fill="#142536" />
    <rect x="129" y="94" width="9" height="26" rx="4.5" fill="#142536" />
  </svg>;
  return <svg viewBox="0 0 220 260" fill="none" className="h-full w-full" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-shell`} x1="60" y1="40" x2="160" y2="215" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fff" /><stop offset="1" stopColor="#bdd6e3" />
      </linearGradient>
      <radialGradient id={`${id}-shadow`}><stop stopColor="#3b82f6" stopOpacity=".24" /><stop offset="1" stopColor="#3b82f6" stopOpacity="0" /></radialGradient>
    </defs>
    <ellipse cx="110" cy="236" rx="63" ry="15" fill={`url(#${id}-shadow)`} />
    <path d="M74 61 63 38M146 61l11-23" stroke="#dcecf3" strokeWidth="9" strokeLinecap="round" />
    <rect x="48" y="70" width="124" height="76" rx="35" fill={`url(#${id}-shell)`} />
    <rect x="85" y="91" width="10" height="30" rx="5" fill="#142536" />
    <rect x="125" y="91" width="10" height="30" rx="5" fill="#142536" />
    <rect x="96" y="144" width="28" height="12" rx="6" fill="#334155" />
    <ellipse cx="110" cy="186" rx="37" ry="39" fill={`url(#${id}-shell)`} />
    <rect x="55" y="157" width="15" height="45" rx="7.5" transform="rotate(18 55 157)" fill={`url(#${id}-shell)`} />
    <rect x="151" y="157" width="15" height="45" rx="7.5" transform="rotate(-18 151 157)" fill={`url(#${id}-shell)`} />
    <rect x="102" y="175" width="16" height="6" rx="3" fill="currentColor" className="text-blue-500" />
  </svg>;
}
