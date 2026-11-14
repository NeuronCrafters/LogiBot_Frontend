import "./mascot.css";
import { useEffect, useId, useRef, useState } from "react";
import { Pause, Play, RotateCcw, ChevronDown } from "lucide-react";
import { t, useLocale } from "@/i18n";
import { setPreference, usePreferences, useReducedMotion } from "@/shared/preferences";
import { RobotAvatar } from "./RobotAvatar";
import type { RobotMood } from "./types";

/** Hints are local guidance, never answer keys or background requests to the tutor. */
export function LearningCompanion({ context, mood = "welcome", reaction = 0 }: {
  context: "chat" | "quiz"; mood?: RobotMood; reaction?: number;
}) {
  useLocale();
  const preferences = usePreferences();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [idle, setIdle] = useState(false);
  const [wave, setWave] = useState(0);
  const trigger = useRef<HTMLButtonElement>(null);
  const root = useRef<HTMLElement>(null);
  const hintId = useId();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let suggested = false;
    const schedule = () => {
      clearTimeout(timer);
      setIdle(false);
      if (suggested || mood === "thinking" || mood === "celebrate") return;
      timer = setTimeout(() => {
        if (document.visibilityState !== "visible" || document.querySelector('[aria-modal="true"]')) return;
        suggested = true;
        setIdle(true);
      }, 90000);
    };
    const interaction = (event: Event) => { if (event.isTrusted) schedule(); };
    const events = ["pointerdown", "keydown", "input", "scroll"];
    events.forEach(event => window.addEventListener(event, interaction, { passive: true, capture: true }));
    schedule();
    return () => { clearTimeout(timer); events.forEach(event => window.removeEventListener(event, interaction, true)); };
  }, [context, mood]);
  const displayMood = idle && mood === "welcome" ? "curious" : mood;
  const message = idle ? "mascot.idle" : mood === "thinking" ? "mascot.thinking" : mood === "celebrate" ? "mascot.celebrate" : mood === "encourage" ? "mascot.encourage" : "mascot.welcome";
  const close = () => { setOpen(false); trigger.current?.focus(); };
  return <section ref={root} aria-label={t("mascot.region")} data-learning-companion data-mood={displayMood}
    className="learning-companion shrink-0 rounded-2xl border border-white/10 bg-surface px-3 py-2 font-[Poppins] text-white"
    onKeyDown={event => { if (event.key === "Escape" && open) { event.stopPropagation(); close(); } }}>
    <div className="learning-companion-header">
      <button ref={trigger} type="button" aria-label={t("mascot.openHint")} aria-expanded={open} aria-controls={hintId}
        onClick={() => { setOpen(value => !value); setWave(value => value + 1); }}
        className="shrink-0 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400">
        <RobotAvatar mood={displayMood} reaction={reaction + wave} className="h-16 w-16 sm:h-20 sm:w-20" />
      </button>
      <div className="min-w-0 flex-1 py-1">
        <p className="text-base font-semibold">{t("common.logibot")}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-zinc-400 [overflow-wrap:anywhere]">{t(message)}</p>
      </div>
      <div className="learning-companion-actions">
      <button type="button" onClick={() => { setOpen(value => !value); setWave(value => value + 1); }}
        aria-label={t(open ? "mascot.closeHint" : "mascot.openHint")} aria-expanded={open} aria-controls={hintId}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-control text-zinc-400 hover:text-white">
        <ChevronDown className="learning-companion-chevron h-4 w-4" aria-hidden="true" />
      </button>
      <button type="button" onClick={() => setPreference("mascot", "legacy")} aria-label={t("mascot.useLegacy")}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-zinc-400 hover:text-white">
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
      </button>
      </div>
    </div>
    <div id={hintId} className="learning-companion-hint" data-open={open} aria-hidden={!open} {...(!open ? { inert: "" } : {})}>
      <div className="min-h-0 overflow-hidden">
      <div className="min-w-0 border-t border-white/10 pb-2 pt-3">
      <p className="text-sm leading-relaxed text-zinc-300">{t(context === "chat" ? "mascot.chatHint" : "mascot.quizHint")}</p>
      {reduceMotion && <p className="mt-2 text-sm leading-relaxed text-zinc-400">{t("mascot.reducedMotion")}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={reduceMotion}
          onClick={() => setPreference("mascot", preferences.mascot === "animated" ? "static" : "animated")}
          className="inline-flex min-h-11 min-w-0 max-w-full items-center gap-2 rounded-lg border border-control px-3 py-2 text-sm text-zinc-300 disabled:opacity-60 [overflow-wrap:anywhere]">
          {preferences.mascot === "animated" ? <Pause className="h-4 w-4 shrink-0" aria-hidden="true" /> : <Play className="h-4 w-4 shrink-0" aria-hidden="true" />}
          {t(preferences.mascot === "animated" ? "mascot.pause" : "mascot.resume")}
        </button>
        <button type="button" onClick={close} className="min-h-11 rounded-lg px-3 py-2 text-sm text-blue-400 underline underline-offset-2">{t("mascot.closeHint")}</button>
      </div>
      </div>
      </div>
    </div>
  </section>;
}
