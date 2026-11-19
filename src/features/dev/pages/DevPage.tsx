import { useId, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FlaskConical, LogIn, RotateCcw } from "lucide-react";
import { t, useLocale, type MessageKey } from "@/i18n";
import { PageHeader, Panel } from "@/components/AppUI";
import { AppModal } from "@/shared/components/feedback/AppModal";
import { toast } from "@/shared/lib/toast";
import { apiError } from "@/shared/lib/apiError";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { devApi } from "@/features/dev/api/devApi";
import { useAccountSwitch } from "@/features/dev/hooks/accountSwitch";

const selectClass = "h-11 w-full rounded-xl border border-control bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white";
const buttonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 font-[Poppins] text-sm font-semibold transition-colors disabled:opacity-60";

export function DevPage() {
  useLocale();
  const { user } = useAuth();
  const id = useId();
  const [account, setAccount] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [days, setDays] = useState(30);
  const status = useQuery({ queryKey: ["devStatus"], queryFn: devApi.status, enabled: !!user?.isOwner });

  const switchAccount = useAccountSwitch();
  const enter = useMutation({
    // Nothing cached from the real account is kept: the switch clears it before showing the test session.
    mutationFn: (email: string) => switchAccount(t("dev.entering"), () => devApi.enter(email), "/"),
    onError: (error) => toast.error(apiError(error)),
  });
  const reset = useMutation({
    mutationFn: () => devApi.reset(days),
    onSuccess: (result) => { setConfirmReset(false); toast.success({ key: "dev.resetDone", params: { ...result } }); void status.refetch(); },
    onError: (error) => { setConfirmReset(false); toast.error(apiError(error)); },
  });

  if (!user?.isOwner) {
    return (
      <main className="flex flex-1 items-center justify-center px-4">
        <p className="font-[Poppins] text-sm text-zinc-400">{t("feedback.acessoRestrito")}</p>
      </main>
    );
  }

  const data = status.data;
  const accounts = data?.accounts ?? [];
  const selected = account || accounts[0]?.email || "";
  const ready = !!data?.configured && !!data?.passwordConfigured;

  return (
    <main className="relative flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <PageHeader icon={<FlaskConical aria-hidden="true" className="h-5 w-5" />} title={t("dev.title")} description={t("dev.description")} />

        {status.isLoading ? (
          // Placeholders in the shape of the panels, so the page does not jump when the status arrives.
          <div role="status" aria-live="polite" className="space-y-5">
            <span className="sr-only">{t("common.carregandoDados")}</span>
            {[132, 148, 120].map((height, index) => (
              <div key={index} aria-hidden="true" style={{ height }} className="animate-pulse rounded-2xl border border-white/10 bg-surface motion-reduce:animate-none" />
            ))}
          </div>
        ) : (
        <div className="page-reveal space-y-5">
        {status.isError && <p role="alert" className="font-[Poppins] text-sm text-red-300">{apiError(status.error)}</p>}
        {data && !ready && (
          <p role="alert" className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 font-[Poppins] text-sm text-amber-100">
            {!data.configured ? t("dev.notConfigured") : t("dev.passwordMissing")}
          </p>
        )}

        <Panel>
          <h2 className="font-[Poppins] text-base font-semibold text-white">{t("dev.dataTitle")}</h2>
          <p className="mt-1 font-[Poppins] text-xs text-zinc-400">{t("dev.dataHint")}</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 sm:max-w-xs">
              <label htmlFor={`${id}-days`} className="mb-1 block font-[Poppins] text-xs font-medium text-zinc-300">{t("dev.dataPeriod")}</label>
              <select id={`${id}-days`} value={days} disabled={!ready} onChange={(event) => setDays(Number(event.target.value))} className={selectClass}>
                {(data?.periods ?? [0, 7, 15, 30, 90, 180, 365]).map((value) => (
                  <option key={value} value={value}>{t(`dev.period.${value}` as MessageKey)}</option>
                ))}
              </select>
            </div>
            <button type="button" disabled={!ready || reset.isPending} onClick={() => setConfirmReset(true)} aria-busy={reset.isPending || undefined}
              className={`${buttonClass} border border-red-400/40 bg-red-500/10 text-red-200 hover:bg-red-500/20`}>
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              {reset.isPending ? t("dev.generating") : t("dev.reset")}
            </button>
          </div>
        </Panel>

        <Panel>
          <h2 className="font-[Poppins] text-base font-semibold text-white">{t("dev.enterTitle")}</h2>
          <p className="mt-1 font-[Poppins] text-xs text-zinc-400">{t("dev.enterHint")}</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label htmlFor={`${id}-account`} className="mb-1 block font-[Poppins] text-xs font-medium text-zinc-300">{t("dev.account")}</label>
              <select id={`${id}-account`} value={selected} disabled={!ready} className={selectClass} onChange={(event) => setAccount(event.target.value)}>
                {accounts.map((item) => (
                  <option key={item.email} value={item.email}>{`${item.email} · ${t(`dev.role.${item.role}` as MessageKey)}`}</option>
                ))}
              </select>
            </div>
            <button type="button" disabled={!ready || !selected || enter.isPending} onClick={() => enter.mutate(selected)}
              className={`${buttonClass} bg-blue-600 text-on-accent hover:bg-blue-700`}>
              <LogIn aria-hidden="true" className="h-4 w-4" />
              {t("dev.enter")}
            </button>
          </div>
          <p className="mt-2 font-[Poppins] text-xs text-zinc-400">{t("dev.passwordHint")}</p>
        </Panel>

        <Panel>
          <h2 className="font-[Poppins] text-base font-semibold text-white">{t("dev.structureTitle")}</h2>
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {(data?.structure ?? []).map((item) => (
              <li key={item.institution} className="rounded-xl border border-white/10 bg-surface-sunken p-3 font-[Poppins] text-sm">
                <p className="font-semibold text-white">{item.institution}</p>
                <ul className="mt-1 list-disc pl-5 text-zinc-300">
                  {item.courses.map((course) => <li key={course}>{course} · {t("dev.twoClasses")}</li>)}
                </ul>
              </li>
            ))}
          </ul>
        </Panel>


        <Panel>
          <h2 className="font-[Poppins] text-base font-semibold text-white">{t("dev.mailsTitle")}</h2>
          <p className="mt-1 font-[Poppins] text-xs text-zinc-400">{t("dev.mailsHint")}</p>
          {(data?.suppressedMails ?? []).length === 0 ? (
            <p className="mt-2 font-[Poppins] text-sm text-zinc-400">{t("dev.noMails")}</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data!.suppressedMails.map((mail, index) => (
                <li key={index} className="rounded-lg border border-white/10 px-3 py-2 font-[Poppins] text-sm text-zinc-200">
                  <span className="font-semibold text-white">{mail.subject}</span>
                  <span className="block text-xs text-zinc-400">{mail.to} · {new Date(mail.at).toLocaleString(document.documentElement.lang || undefined)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        </div>
        )}
      </div>
      <AppModal isOpen={confirmReset} type="delete" title={t("dev.resetConfirmTitle")} description={t("dev.resetConfirmText")}
        acceptLabel={t("dev.reset")} disabled={reset.isPending} onConfirm={() => reset.mutate()} onCancel={() => setConfirmReset(false)} onClose={() => setConfirmReset(false)} />
    </main>
  );
}
