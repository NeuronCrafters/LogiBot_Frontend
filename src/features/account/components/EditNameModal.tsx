import { useDialogFocus } from "@/shared/hooks/useDialogFocus";
import { t, useLocale } from "@/i18n";
﻿import { useState } from "react";
import { X, Save, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typograph } from "@/shared/components/Typography";

interface EditNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onSave: (newName: string) => void;
}

export function EditNameModal({
  isOpen,
  onClose,
  currentName,
  onSave,
}: EditNameModalProps) {
  useLocale();
  const dialogRef = useDialogFocus<HTMLDivElement>(isOpen, onClose);

  const [name, setName] = useState("");

  const handleSave = () => {
    if (name.trim()) {
      onSave(name);
      setName("");
      onClose();
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={t("account.alterarNome")} tabIndex={-1} className="w-full max-w-md bg-[#1f1f1f] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <User size={18} className="text-blue-400" />
                <Typograph
                  text={t("account.alterarNome")}
                  colorText="text-white"
                  variant="text4"
                  weight="semibold"
                  fontFamily="poppins"
                />
              </div>
              <button
                aria-label={t("common.fechar")}
                onClick={onClose}
                className="text-zinc-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                  {t("account.nomeAtual")}</label>
                <div className="w-full bg-[#141414]/50 border border-zinc-800 rounded-lg p-3 text-zinc-400 cursor-not-allowed select-none">
                  {currentName}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                  {t("account.novoNome")}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-label={t("account.novoNome")}
                  placeholder={t("account.digiteONovoNome")}
                  className="w-full bg-[#141414] border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600"
                />
              </div>
            </div>
            <div className="p-4 border-t border-zinc-800 flex justify-end gap-2 bg-[#1a1a1a]">
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-zinc-400 hover:bg-red-600 hover:text-white"
              >
                {t("common.cancelar")}</Button>
              <Button
                onClick={handleSave}
                disabled={!name.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} /> {t("common.salvar")}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
