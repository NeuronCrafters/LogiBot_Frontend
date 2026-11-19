import { useEffect, useId, useState } from "react";
import { Lightbulb } from "lucide-react";
import { t, useLocale } from "@/i18n";
import { AppButton } from "@/components/AppUI";
import { apiError } from "@/shared/lib/apiError";
import { exercisesApi } from "@/features/exercises/api/exercisesApi";
import { useFeatures } from "@/features/release/hooks/useFeatures";
import type { HintItem } from "@/features/exercises/types";

const MAX_HINTS = 3;
export interface HintTarget { exerciseId: string | null; attemptId: string | null; correct?: boolean; offline?: boolean }

/**
 * Hints of the workbench, shown after a checked attempt.
 * `attemptId` is the last wrong attempt recorded on the server (null when offline or correct);
 * `exerciseId` identifies the exercise, so earlier hints come back when the student returns to it.
 */
export function HintPanel({ exerciseId, attemptId, correct = false, offline = false }: HintTarget) {
  useLocale();
  const titleId = useId();
  const { isEnabled } = useFeatures();
  const [hints, setHints] = useState<HintItem[]>([]);
  const [materials, setMaterials] = useState<Record<number, string[]>>({});
  const [remaining, setRemaining] = useState(MAX_HINTS);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const enabled = isEnabled("practice_hints");

  useEffect(() => {
    setHints([]);
    setMaterials({});
    setRemaining(MAX_HINTS);
    setError("");
    if (!exerciseId || !enabled) return;
    let current = true;
    exercisesApi.hintStatus(exerciseId)
      .then((status) => {
        // An unexpected body (proxy, old server) must never break the exercise.
        if (!current || !status || !Array.isArray(status.hints)) return;
        setHints(status.hints);
        if (typeof status.remaining === "number") setRemaining(status.remaining);
      })
      .catch(() => { /* Earlier hints are a convenience: the panel still works without them. */ });
    return () => { current = false; };
  }, [exerciseId, enabled]);

  if (!enabled || (!exerciseId && !offline) || (correct && hints.length === 0)) return null;

  async function ask() {
    if (!attemptId) return;
    setPending(true);
    setError("");
    try {
      const hint = await exercisesApi.requestHint(attemptId);
      setHints((previous) => [...previous.filter((item) => item.level !== hint.level), { level: hint.level, text: hint.text }]);
      if (hint.materials.length) setMaterials((previous) => ({ ...previous, [hint.level]: hint.materials }));
      setRemaining(hint.remaining);
    } catch (requestError) {
      setError(apiError(requestError));
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby={titleId} className="rounded-2xl border border-amber-400/30 bg-amber-500/5 p-4 font-[Poppins]">
      <h3 id={titleId} className="flex items-center gap-2 text-sm font-semibold text-amber-100">
        <Lightbulb aria-hidden="true" className="h-4 w-4" />
        {t("exercises.hints.title")}
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-zinc-300">
        {correct ? t("exercises.hints.afterCorrect") : t("exercises.hints.explain")}
      </p>

      <ol aria-live="polite" className="mt-3 space-y-2">
        {hints.map((hint) => (
          <li key={hint.level} className="rounded-xl border border-white/10 bg-surface-sunken p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">{t("exercises.hints.item", { level: hint.level })}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-white">{hint.text}</p>
            {materials[hint.level] && (
              <p className="mt-2 text-xs text-zinc-400">{t("exercises.hints.material", { titles: materials[hint.level].join(", ") })}</p>
            )}
          </li>
        ))}
      </ol>

      {!correct && (
        <div className="mt-3">
          {offline ? (
            <p className="text-xs text-amber-300">{t("exercises.hints.offline")}</p>
          ) : remaining > 0 ? (
            <AppButton type="button" variant="secondary" onClick={ask} disabled={pending || !attemptId} aria-busy={pending || undefined} className="w-full sm:w-auto">
              <Lightbulb aria-hidden="true" className="h-4 w-4" />
              {pending ? t("exercises.hints.asking") : t("exercises.hints.ask", { remaining })}
            </AppButton>
          ) : (
            <p className="text-xs text-zinc-400">{t("exercises.hints.none")}</p>
          )}
          {error && <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}
        </div>
      )}
    </section>
  );
}
