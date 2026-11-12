import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { t, useLocale } from "@/i18n";
import { useAuth } from "@/features/auth/hooks/useAuth";
import logoMascote from "@/assets/logo.svg";

export function NotFoundPage() {
  useLocale();
  const { isAuthenticated } = useAuth();
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-neutral-950 px-4 text-center font-[Poppins] text-white">
      <img src={logoMascote} alt="" className="brand-mark mb-6 h-auto w-20" />
      <h1 className="text-2xl font-semibold text-white">{t("common.paginaNaoEncontrada")}</h1>
      <p className="mt-3 max-w-sm text-base text-zinc-400">{t("common.paginaNaoEncontradaDescricao")}</p>
      <Link
        to={isAuthenticated ? "/home" : "/"}
        className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl border border-blue-400/40 bg-blue-600 px-5 text-sm font-semibold text-on-accent transition-colors hover:bg-blue-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t("common.voltarAoInicio")}
      </Link>
    </main>
  );
}
