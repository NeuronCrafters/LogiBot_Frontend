import { useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Accessibility, X } from "lucide-react";
import { t, useLocale, type MessageKey } from "@/i18n";
import { useDialogFocus } from "@/shared/hooks/useDialogFocus";
import { resetPreferences, setPreference, usePreferences, type Preferences } from ".";

type Option<K extends keyof Preferences> = { value: Preferences[K]; label: MessageKey };

const GROUPS: { [K in keyof Preferences]: { legend: MessageKey; options: Option<K>[] } } = {
  theme: {
    legend: "preferences.tema",
    options: [
      { value: "dark", label: "preferences.temaEscuro" },
      { value: "light", label: "preferences.temaClaro" },
      { value: "system", label: "preferences.seguirSistema" },
    ],
  },
  textSize: {
    legend: "preferences.texto",
    options: [
      { value: "default", label: "preferences.textoPadrao" },
      { value: "large", label: "preferences.textoMaior" },
      { value: "larger", label: "preferences.textoMuitoMaior" },
    ],
  },
  contrast: {
    legend: "preferences.contraste",
    options: [
      { value: "default", label: "preferences.contrastePadrao" },
      { value: "more", label: "preferences.contrasteReforcado" },
      { value: "system", label: "preferences.seguirSistema" },
    ],
  },
  motion: {
    legend: "preferences.movimento",
    options: [
      { value: "full", label: "preferences.movimentoCompleto" },
      { value: "reduce", label: "preferences.movimentoReduzido" },
      { value: "system", label: "preferences.seguirSistema" },
    ],
  },
  chatDisplay: {
    legend: "preferences.respostasChat",
    options: [
      { value: "progressive", label: "preferences.respostaProgressiva" },
      { value: "complete", label: "preferences.respostaCompleta" },
    ],
  },
};

function RadioGroup<K extends keyof Preferences>({ name, value }: { name: K; value: Preferences[K] }) {
  const id = useId();
  const group = GROUPS[name];
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-sm font-medium text-zinc-300">{t(group.legend)}</legend>
      <div className="flex flex-wrap gap-2">
        {group.options.map((option) => {
          const optionId = `${id}-${String(option.value)}`;
          const checked = value === option.value;
          return (
            <label
              key={String(option.value)}
              htmlFor={optionId}
              className={`relative flex min-h-[44px] cursor-pointer items-center rounded-lg border px-3 text-sm transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blue-400 ${
                checked
                  ? "border-blue-400 bg-blue-500/15 font-semibold text-white"
                  : "border-white/20 bg-neutral-950/60 text-zinc-300 hover:border-white/40 hover:text-white"
              }`}
            >
              <input
                id={optionId}
                type="radio"
                name={`${id}-${name}`}
                className="sr-only"
                checked={checked}
                onChange={() => setPreference(name, option.value)}
              />
              {checked && <span aria-hidden="true" className="mr-1.5 h-2 w-2 rounded-full bg-blue-400" />}
              {t(option.label)}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function PreferencesControls({ chat = true }: { chat?: boolean }) {
  useLocale();
  const preferences = usePreferences();
  return (
    <div className="space-y-5">
      <RadioGroup name="theme" value={preferences.theme} />
      <RadioGroup name="textSize" value={preferences.textSize} />
      <RadioGroup name="contrast" value={preferences.contrast} />
      <RadioGroup name="motion" value={preferences.motion} />
      {chat && <RadioGroup name="chatDisplay" value={preferences.chatDisplay} />}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
        <p className="text-xs text-zinc-400">{t("preferences.descricao")}</p>
        <button
          type="button"
          onClick={resetPreferences}
          className="min-h-[44px] rounded-lg px-2 text-sm text-blue-400 underline underline-offset-2 hover:text-blue-300"
        >
          {t("preferences.restaurar")}
        </button>
      </div>
    </div>
  );
}

export function PreferencesMenu({ className = "", trigger }: { className?: string; trigger?: ReactNode }) {
  useLocale();
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const dialog = useDialogFocus<HTMLDivElement>(open, () => setOpen(false));
  return (
    <div className={className}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={trigger ? undefined : t("preferences.abrir")}
        title={t("preferences.abrir")}
        onClick={() => setOpen(true)}
        className="inline-flex h-10 min-w-[40px] items-center justify-center gap-2 rounded-lg border border-white/15 bg-neutral-900 px-2.5 text-sm text-zinc-200 transition-colors hover:border-white/30 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"
      >
        <Accessibility className="h-4 w-4" aria-hidden="true" />
        {trigger}
      </button>
      {open && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center font-[Poppins] sm:items-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div
            ref={dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-white/10 bg-surface p-5 font-[Poppins] text-white shadow-2xl shadow-black/40 sm:rounded-2xl"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 id={titleId} className="text-lg font-semibold text-white">
                {t("preferences.titulo")}
              </h2>
              <button
                type="button"
                aria-label={t("common.fechar")}
                onClick={() => setOpen(false)}
                className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <PreferencesControls />
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
