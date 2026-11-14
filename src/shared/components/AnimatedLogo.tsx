import boneco from "@/assets/boneco.svg";
import parte from "@/assets/parte.svg";

export const AnimatedLogo = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 270 280" className={`brand-mark h-full w-full ${className}`} aria-hidden="true">
    <image href={boneco} x="0" y="95" width="270" height="176" />
    <image href={parte} x="60" y="10" width="56" height="80" className="legacy-robot-ear" />
    <image href={parte} x="60" y="10" width="56" height="80" transform="translate(270 0) scale(-1 1)" />
  </svg>
);
