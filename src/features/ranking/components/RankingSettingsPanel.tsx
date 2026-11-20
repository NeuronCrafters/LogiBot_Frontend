import { useEffect, useId, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings2 } from "lucide-react";
import { t, useLocale } from "@/i18n";
import { apiError } from "@/shared/lib/apiError";
import { cn } from "@/shared/lib/cn";
import { toast } from "@/shared/lib/toast";
import { fieldClass } from "@/features/institutions/components/TextField";
import { LEVELS, SOURCES, rankingApi, type FieldIssue, type Rules } from "@/features/ranking/api/rankingApi";

/**
 * Owner: rules of the ranking for the whole platform or one institution (what is left as it is keeps
 * coming from the platform). Turning it on or off per institution, course or class stays in the
 * release page, like every feature.
 */
export function RankingSettingsPanel({ institutions, onSaved }: { institutions: Array<{ id: string; name: string }>; onSaved: () => void }) {
  useLocale();
  const id = useId();
  const queryClient = useQueryClient();
  const [target, setTarget] = useState("");
  const settings = useQuery({ queryKey: ["rankingSettings", target], queryFn: () => rankingApi.settings(target) });
  const [rules, setRules] = useState<Rules | null>(null);
  const [issues, setIssues] = useState<FieldIssue[]>([]);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (settings.data) { setRules(settings.data.effective); setIssues([]); } }, [settings.data]);
  const issueOf = (field: string) => issues.some((issue) => issue.field === field);

  async function save() {
    if (!rules) return;
    setSaving(true); setIssues([]);
    try {
      await rankingApi.saveSettings(target ? "institution" : "global", target, rules);
      toast.success(t("ranking.settings.saved"));
      void queryClient.invalidateQueries({ queryKey: ["rankingSettings"] });
      void queryClient.invalidateQueries({ queryKey: ["rankingScopes"] });
      onSaved();
    } catch (caught) {
      const fields = (caught as { response?: { data?: { issues?: FieldIssue[] } } }).response?.data?.issues;
      if (fields?.length) { setIssues(fields); toast.error(t("ranking.settings.checkFields")); } else toast.error(apiError(caught));
    } finally {
      setSaving(false);
    }
  }

  async function inherit() {
    setSaving(true);
    try {
      await rankingApi.clearSettings(target);
      toast.success(t("ranking.settings.inherited"));
      void queryClient.invalidateQueries({ queryKey: ["rankingSettings"] });
      onSaved();
    } catch (caught) {
      toast.error(apiError(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <details className="group rounded-2xl border border-white/10 bg-surface font-[Poppins]">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 text-sm font-semibold text-white [&::-webkit-details-marker]:hidden">
        <Settings2 aria-hidden="true" className="h-4 w-4 text-blue-300" />{t("ranking.settings.title")}
        <span className="ml-auto text-xs font-normal text-zinc-400">{t("ranking.settings.ownerOnly")}</span>
      </summary>
      <div className="grid gap-4 border-t border-white/10 p-4">
        <div className="grid gap-1.5 sm:max-w-sm">
          <label htmlFor={`${id}-target`} className="text-sm font-medium text-zinc-200">{t("ranking.settings.appliesTo")}</label>
          <select id={`${id}-target`} value={target} onChange={(event) => setTarget(event.target.value)} className={cn(fieldClass, "h-11")}>
            <option value="">{t("ranking.settings.platform")}</option>
            {institutions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <p className="text-xs text-zinc-400">{target ? (settings.data?.institution ? t("ranking.settings.ownRules") : t("ranking.settings.inheriting")) : t("ranking.settings.platformHint")}</p>
        </div>
        {settings.isError && <p role="alert" className="text-sm text-red-300">{apiError(settings.error)}</p>}
        {rules && (
          <>
            <div className="grid gap-1.5 sm:max-w-sm">
              <label htmlFor={`${id}-period`} className="text-sm font-medium text-zinc-200">{t("ranking.settings.period")}</label>
              <select id={`${id}-period`} value={rules.periodDays} onChange={(event) => setRules({ ...rules, periodDays: Number(event.target.value) })}
                aria-invalid={issueOf("periodDays") || undefined} className={cn(fieldClass, "h-11")}>
                {(settings.data?.periods ?? [7, 30, 90, 180, 365]).map((days) => <option key={days} value={days}>{t("ranking.periodDays", { count: days })}</option>)}
              </select>
            </div>
            <fieldset className="min-w-0 rounded-xl border border-white/10 p-3">
              <legend className="px-1 text-sm font-semibold text-zinc-200">{t("ranking.settings.weights")}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {SOURCES.map((source) => (
                  <div key={source} className="grid gap-1.5">
                    <label htmlFor={`${id}-w-${source}`} className="text-sm text-zinc-200">{t(`ranking.source.${source}`)}</label>
                    <input id={`${id}-w-${source}`} type="number" min={0} max={100} step={1} inputMode="numeric" value={rules.weights[source]}
                      aria-invalid={issueOf(`weights.${source}`) || undefined} aria-describedby={`${id}-w-${source}-hint`}
                      onChange={(event) => setRules({ ...rules, weights: { ...rules.weights, [source]: Number(event.target.value) } })} className={cn(fieldClass, "h-11")} />
                    <p id={`${id}-w-${source}-hint`} className="text-xs text-zinc-400">{t(`ranking.unit.${source}`)}</p>
                  </div>
                ))}
              </div>
              {issues.some((issue) => issue.field.startsWith("weights.")) && <p role="alert" className="mt-2 text-xs font-medium text-red-300">{t("ranking.settings.weightsRange")}</p>}
            </fieldset>
            <fieldset className="min-w-0 rounded-xl border border-white/10 p-3">
              <legend className="px-1 text-sm font-semibold text-zinc-200">{t("ranking.settings.visibleTo")}</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {LEVELS.map((level) => (
                  <label key={level} className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm text-zinc-200 hover:bg-white/5">
                    <input type="checkbox" className="h-5 w-5 accent-blue-500" checked={rules.visibleTo[level]} onChange={(event) => setRules({ ...rules, visibleTo: { ...rules.visibleTo, [level]: event.target.checked } })} />
                    {t(`ranking.level.${level}`)}
                  </label>
                ))}
              </div>
              <label className="mt-2 flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm text-zinc-200 hover:bg-white/5">
                <input type="checkbox" className="h-5 w-5 accent-blue-500" checked={rules.studentNames} disabled={!rules.visibleTo.student}
                  onChange={(event) => setRules({ ...rules, studentNames: event.target.checked })} />
                <span>{t("ranking.settings.studentNames")}<span className="block text-xs text-zinc-400">{t("ranking.settings.studentNamesHint")}</span></span>
              </label>
            </fieldset>
            <div className="flex flex-wrap justify-end gap-2">
              {target && settings.data?.institution && (
                <button type="button" onClick={() => void inherit()} disabled={saving} className="inline-flex min-h-11 items-center rounded-xl border border-white/15 px-4 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-60">
                  {t("ranking.settings.inherit")}
                </button>
              )}
              <button type="button" onClick={() => void save()} disabled={saving} className="inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-on-accent hover:bg-blue-700 disabled:opacity-60">
                {saving ? t("institutions.saving") : t("institutions.save")}
              </button>
            </div>
          </>
        )}
      </div>
    </details>
  );
}
