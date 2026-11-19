import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { t, useLocale } from "@/i18n";

/** Shown instead of a page whose feature is not released for the person (also when opened by URL). */
export function FeatureUnavailable() {
  useLocale();
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="max-w-md rounded-2xl border border-white/10 bg-surface p-6 text-center shadow-lg shadow-black/10">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-zinc-300">
          <Lock aria-hidden="true" className="h-5 w-5" />
        </div>
        <h1 className="font-[Poppins] text-lg font-semibold text-white">{t("features.unavailableTitle")}</h1>
        <p className="mt-2 font-[Poppins] text-sm leading-relaxed text-zinc-400">{t("features.unavailableDescription")}</p>
        <Link to="/" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 font-[Poppins] text-sm font-semibold text-on-accent hover:bg-blue-700">
          {t("features.backHome")}
        </Link>
      </div>
    </main>
  );
}
