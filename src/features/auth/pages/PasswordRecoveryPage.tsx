import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { publicApi } from "@/shared/api/httpClient";
import { apiError } from "@/shared/lib/apiError";
import { t, useLocale, type MessageKey } from "@/i18n";
import { LanguageSwitcher } from "@/i18n/LanguageSwitcher";
import { PreferencesMenu } from "@/shared/preferences/PreferencesControls";

export function PasswordRecoveryPage({ reset = false }: { reset?: boolean }) {
  useLocale();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);
  const [serverError, setServerError] = useState<unknown>(null);
  const token = params.get("token");
  const invalidLink = reset && !token;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null); setServerError(null);
    if (!reset && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("validation.email"); return; }
    if (reset && password.length < 12) { setError("auth.aSenhaDeveTerPeloMenos12"); return; }
    if (reset && password !== confirmation) { setError("auth.recoveryMismatch"); return; }
    setPending(true);
    try {
      if (reset) await publicApi.post("/auth/password-reset", { token, newPassword: password });
      else await publicApi.post("/auth/password-reset-requests", { email: email.trim() });
      setDone(true); setPassword(""); setConfirmation("");
    } catch (caught) { setServerError(caught); }
    finally { setPending(false); }
  }

  return <div className="min-h-screen bg-neutral-950 px-4 py-4 text-white">
    <div className="flex items-start justify-end gap-2"><PreferencesMenu /><LanguageSwitcher /></div>
    <main className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center">
      <Link to="/" className="mb-6 text-xl font-bold">LogiBot.AI</Link>
      <section className="rounded-2xl border border-white/10 bg-surface p-6">
        <h1 className="text-xl font-semibold">{t(reset ? "auth.recoveryNewPassword" : "auth.recoveryTitle")}</h1>
        <p className="mt-3 text-sm text-zinc-400">{t(reset ? "auth.recoveryResetDescription" : "auth.recoveryDescription")}</p>
        {invalidLink && <p role="alert" className="mt-4 text-sm text-red-300">{t("auth.recoveryInvalidLink")}</p>}
        {done ? <p role="status" className="mt-5 text-sm text-emerald-300">{t(reset ? "auth.recoveryPasswordSaved" : "auth.recoverySent")}</p> : !invalidLink && <form onSubmit={submit} noValidate className="mt-5 space-y-4">
          {reset ? <>
            <label className="block text-sm">{t("account.novaSenha")}<input aria-label={t("account.novaSenha")} type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-control bg-neutral-950 p-3" /></label>
            <label className="block text-sm">{t("auth.recoveryConfirm")}<input aria-label={t("auth.recoveryConfirm")} type="password" autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} className="mt-1 w-full rounded-lg border border-control bg-neutral-950 p-3" /></label>
          </> : <label className="block text-sm">{t("common.email")}<input aria-label={t("common.email")} type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} className="mt-1 w-full rounded-lg border border-control bg-neutral-950 p-3" /></label>}
          {(error || serverError) && <p role="alert" className="text-sm text-red-300">{error ? t(error) : apiError(serverError)}</p>}
          <button disabled={pending} type="submit" className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold disabled:opacity-60">{t(pending ? "feedback.enviando" : reset ? "auth.recoveryNewPassword" : "auth.recoverySend")}</button>
        </form>}
        <Link to="/signin" className="mt-5 inline-block text-sm text-blue-300 underline">{t("auth.recoveryBack")}</Link>
      </section>
    </main>
  </div>;
}
