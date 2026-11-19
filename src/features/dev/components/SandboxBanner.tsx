import { useState } from "react";
import { FlaskConical } from "lucide-react";
import { t, useLocale } from "@/i18n";
import { toast } from "@/shared/lib/toast";
import { apiError } from "@/shared/lib/apiError";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { devApi } from "@/features/dev/api/devApi";
import { useAccountSwitch } from "@/features/dev/hooks/accountSwitch";

/** Always visible while using a test account, so test data is never mistaken for real data. */
export function SandboxBanner() {
  useLocale();
  const { user } = useAuth();
  const [leaving, setLeaving] = useState(false);
  const switchAccount = useAccountSwitch();
  if (user?.environment !== "sandbox") return null;

  async function leave() {
    setLeaving(true);
    try {
      // Every cached query belongs to the test environment: the switch drops them.
      await switchAccount(t("dev.leaving"), () => devApi.leave(), "/dev");
    } catch (error) {
      toast.error(apiError(error));
      setLeaving(false);
    }
  }

  return (
    <div role="region" aria-label={t("dev.banner.label")} data-sandbox-banner
      className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-amber-400/40 bg-amber-400 px-4 py-1.5 text-center font-[Poppins] text-xs font-semibold text-neutral-950">
      <span className="inline-flex items-center gap-1.5">
        <FlaskConical aria-hidden="true" className="h-4 w-4" />
        {t("dev.banner.text", { email: user.email })}
      </span>
      {user.canReturnToOwner && (
        <button type="button" onClick={() => void leave()} disabled={leaving}
          className="inline-flex min-h-8 items-center rounded-md border border-neutral-950/30 bg-neutral-950/10 px-2.5 underline-offset-2 hover:underline disabled:opacity-60">
          {t("dev.banner.leave")}
        </button>
      )}
    </div>
  );
}
