import { useDialogFocus } from "@/shared/hooks/useDialogFocus";
import { t, useLocale } from "@/i18n";
import { type ReactNode } from "react";
import {
  CheckCircle2,
  Info,
  KeyRound,
  Save,
  ShieldCheck,
  Trash,
  X,
} from "lucide-react";

interface AppModalProps {
  isOpen: boolean;
  type: "consent" | "info" | "delete" | "create" | "update" | "password";
  title?: string;
  description?: string;
  acceptLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  children?: ReactNode;
  disabled?: boolean;
}

const defaultConfig = {
  consent: {
    get acceptLabel() { return t("common.aceitoOsTermos"); },
    get cancelLabel() { return t("common.naoAceito"); },
    icon: <ShieldCheck className="h-5 w-5" />,
    tone: "text-blue-400 bg-blue-500/10",
    confirm:
      "bg-blue-600 hover:bg-blue-700 border-blue-400/40 shadow-blue-900/30",
  },
  info: {
    get acceptLabel() { return t("common.fechar"); },
    cancelLabel: "",
    icon: <Info className="h-5 w-5" />,
    tone: "text-blue-400 bg-blue-500/10",
    confirm:
      "bg-blue-600 hover:bg-blue-700 border-blue-400/40 shadow-blue-900/30",
  },
  delete: {
    get acceptLabel() { return t("common.excluir"); },
    get cancelLabel() { return t("common.cancelar"); },
    icon: <Trash className="h-5 w-5" />,
    tone: "text-red-400 bg-red-500/10",
    confirm: "bg-red-600 hover:bg-red-700 border-red-400/40 shadow-red-900/30",
  },
  create: {
    get acceptLabel() { return t("common.salvar"); },
    get cancelLabel() { return t("common.cancelar"); },
    icon: <CheckCircle2 className="h-5 w-5" />,
    tone: "text-emerald-400 bg-emerald-500/10",
    confirm:
      "bg-blue-600 hover:bg-blue-700 border-blue-400/40 shadow-blue-900/30",
  },
  update: {
    get acceptLabel() { return t("common.atualizar"); },
    get cancelLabel() { return t("common.cancelar"); },
    icon: <Save className="h-5 w-5" />,
    tone: "text-indigo-400 bg-indigo-500/10",
    confirm:
      "bg-blue-600 hover:bg-blue-700 border-blue-400/40 shadow-blue-900/30",
  },
  password: {
    get acceptLabel() { return t("common.salvar"); },
    get cancelLabel() { return t("common.cancelar"); },
    icon: <KeyRound className="h-5 w-5" />,
    tone: "text-amber-400 bg-amber-500/10",
    confirm:
      "bg-blue-600 hover:bg-blue-700 border-blue-400/40 shadow-blue-900/30",
  },
};

export function AppModal({
  isOpen,
  type,
  title,
  description,
  acceptLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  onClose,
  children,
  disabled = false,
}: AppModalProps) {
  useLocale();

  const dialogRef = useDialogFocus<HTMLDivElement>(isOpen, onClose || onCancel);
  if (!isOpen) return null;

  const config = defaultConfig[type];

  const handleConfirm = () => {
    if (disabled) return;
    if (onConfirm) onConfirm();
    else if (onClose) onClose();
  };
  const handleCancel = () => {
    if (disabled) return;
    if (onCancel) onCancel();
    else if (onClose) onClose();
  };

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={title || t("common.details")} tabIndex={-1} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1f1f1f] text-white shadow-2xl shadow-black/30">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.tone}`}
              >
                {config.icon}
              </div>
              <div>
                {title && (
                  <h2 className="font-[Poppins] text-base font-semibold text-white">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-2 font-[Poppins] text-sm leading-relaxed text-zinc-500">
                    {description}
                  </p>
                )}
              </div>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={disabled}
                aria-label={t("common.fecharModal")}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {children && <div className="p-5">{children}</div>}
          <div className="flex flex-col-reverse gap-3 border-t border-white/10 bg-neutral-950/40 p-5 sm:flex-row sm:justify-end">
            {type !== "info" && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={disabled}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 font-[Poppins] text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelLabel ?? config.cancelLabel}
              </button>
            )}
            <button
              type="button"
              onClick={handleConfirm}
              disabled={disabled}
              className={`inline-flex h-10 items-center justify-center rounded-lg border px-4 font-[Poppins] text-sm font-semibold text-white shadow-md transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${config.confirm}`}
            >
              {acceptLabel ?? config.acceptLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
