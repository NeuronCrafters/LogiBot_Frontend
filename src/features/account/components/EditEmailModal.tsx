import { useDialogFocus } from "@/shared/hooks/useDialogFocus";
import { t, useLocale } from "@/i18n";
﻿import { useState } from "react";
import { X, Save, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typograph } from "@/shared/components/Typography";

interface EditEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
  onSave: (newEmail: string) => void | Promise<void>;
}

export function EditEmailModal({
  isOpen,
  onClose,
  currentEmail,
  onSave,
}: EditEmailModalProps) {
  useLocale();
  const [isSaving, setIsSaving] = useState(false);
  const dialogRef = useDialogFocus<HTMLDivElement>(isOpen, isSaving ? undefined : onClose);

  const [email, setEmail] = useState("");

  const handleSave = async () => {
    if (!email.trim() || isSaving) return;
    setIsSaving(true);
    try {
      await onSave(email.trim());
      setEmail("");
      onClose();
    } catch {
      setEmail(email);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4">
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-busy={isSaving} aria-label={t("account.alterarEMail")} tabIndex={-1} className="my-auto w-full max-w-md shrink-0 bg-surface border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Mail size={18} className="text-purple-400" />
                <Typograph
                  text={t("account.alterarEMail")}
                  colorText="text-white"
                  variant="text4"
                  weight="semibold"
                  fontFamily="poppins"
                />
              </div>
              <button
                aria-label={t("common.fechar")}
                disabled={isSaving}
                onClick={onClose}
                className="text-zinc-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                  {t("account.eMailAtual")}</label>
                <div className="w-full bg-surface-sunken/50 border border-zinc-800 rounded-lg p-3 text-zinc-400 cursor-not-allowed select-none">
                  {currentEmail}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                  {t("account.novoEMail")}</label>
                <input
                  disabled={isSaving}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label={t("account.novoEMail")}
                  placeholder={t("account.digiteONovoEMail")}
                  className="w-full bg-surface-sunken border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 transition-colors placeholder:text-zinc-600"
                />
              </div>
            </div>
            <div className="p-4 border-t border-zinc-800 flex justify-end gap-2 bg-surface-sunken">
              <Button
                variant="ghost"
                disabled={isSaving}
                onClick={onClose}
                className="text-zinc-400 hover:bg-red-600 hover:text-on-accent"
              >
                {t("common.cancelar")}</Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !email.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-on-accent gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} /> {t("common.salvar")}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
