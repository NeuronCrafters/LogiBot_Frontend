import { useId } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { chooseLanguage, normalizeLanguage, retryLanguageSave, t, useLanguagePreference } from ".";



export function LanguageSwitcher({ details = false }: { details?: boolean }) {
  const id = useId();
  const { user } = useAuth();
  const { selection, saveState, explicitVersion } = useLanguagePreference();
  return (
    <div className="flex min-w-0 flex-col gap-1 text-sm text-zinc-300">
      <label htmlFor={id} className="sr-only">{t("language.label")}</label>
      <select id={id} aria-label={t("language.label")} value={selection || "system"}
        onChange={event => chooseLanguage(event.target.value === "system" ? null : normalizeLanguage(event.target.value)!)}
        className="h-10 w-full min-w-0 max-w-[15rem] rounded-lg border border-control bg-neutral-900 px-2 py-0 text-xs text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400">
        <option value="system">{t("language.system")}</option>
        <option value="pt-BR">{t("language.ptBR")}</option>
        <option value="en-US">{t("language.enUS")}</option>
        <option value="es-ES">{t("language.esES")}</option>
      </select>
      {(details || saveState === "error") && (
        <div aria-live="polite" className="max-w-sm text-xs leading-relaxed text-zinc-400">
          {saveState === "pending" && user ? t("language.saving") : saveState === "error" && user ? t("language.saveError") : saveState === "saved" && user ? t("language.saved") : explicitVersion ? t("language.local") : t("language.description")}
          {saveState === "error" && user && <button type="button" onClick={retryLanguageSave} className="ml-1 underline">{t("language.retry")}</button>}
        </div>
      )}
    </div>
  );
}
