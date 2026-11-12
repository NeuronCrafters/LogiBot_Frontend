import { useId } from "react";
import { SUPPORTED_LANGUAGES, languageName, t, useLocale, type Language } from ".";

export function ContentLanguageLabel({ language }: { language?: Language | null }) {
  useLocale();
  return <span className="text-xs text-zinc-400">{t("language.content")}: {languageName(language)}</span>;
}

export function ContentLanguageSelect({ value, onChange }: { value: Language; onChange: (value: Language) => void }) {
  useLocale();
  const id = useId();
  return <div className="space-y-1">
    <label htmlFor={id} className="block text-xs font-semibold text-zinc-400">{t("language.content")}</label>
    <select id={id} value={value} onChange={event => onChange(event.target.value as Language)} className="w-full rounded-xl border border-control bg-neutral-950 p-3 text-sm text-white">
      {SUPPORTED_LANGUAGES.map(language => <option key={language} value={language}>{languageName(language)}</option>)}
    </select>
  </div>;
}
