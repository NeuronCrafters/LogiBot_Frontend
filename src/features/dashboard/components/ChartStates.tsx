import { t, useLocale } from "@/i18n";
import * as React from "react";
import { AlertCircle, BarChart3, RefreshCw } from "lucide-react";

const H = "h-full min-h-[260px]";

export const ChartLoader = ({
  text = t("common.carregandoDados"),
}: {
  text?: string;
}) => { useLocale(); return ((
  <div className={`flex w-full items-center justify-center ${H}`}>
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-white/5 border-t-indigo-500" />
      </div>
      <p className="font-[Poppins] text-sm text-white/50">{text}</p>
    </div>
  </div>
)); };

export const ChartError = ({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) => { useLocale(); return ((
  <div className={`flex w-full items-center justify-center ${H}`}>
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
        <AlertCircle className="h-5 w-5" />
      </div>
      <div>
        <p className="font-[Poppins] text-sm font-medium text-white/80">
          {message ?? t("common.erroAoCarregarDados")}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-[Poppins] text-xs text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <RefreshCw className="h-3 w-3" />
          {t("common.tentarNovamente")}</button>
      )}
    </div>
  </div>
)); };

export const NoData = ({
  onRetry,
  children,
}: {
  onRetry?: () => void;
  children?: React.ReactNode;
}) => { useLocale(); return ((
  <div className={`flex w-full items-center justify-center ${H}`}>
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-600">
        <BarChart3 className="h-5 w-5" />
      </div>
      <div className="max-w-xs font-[Poppins] text-sm text-white/50">
        {children ?? t("dashboard.nenhumDadoDisponivelParaASelecaoAtual")}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-[Poppins] text-xs text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <RefreshCw className="h-3 w-3" />
          {t("common.tentarNovamente")}</button>
      )}
    </div>
  </div>
)); };
