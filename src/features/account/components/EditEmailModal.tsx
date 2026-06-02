import { useState } from "react";
import { X, Save, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typograph } from "@/shared/components/Typography";

interface EditEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
  onSave: (newEmail: string) => void;
}

export function EditEmailModal({ isOpen, onClose, currentEmail, onSave }: EditEmailModalProps) {
  const [email, setEmail] = useState("");

  const handleSave = () => {
    if (email.trim()) { onSave(email); setEmail(""); onClose(); }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#1f1f1f] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-2"><Mail size={18} className="text-purple-400" /><Typograph text="Alterar E-mail" colorText="text-white" variant="text4" weight="semibold" fontFamily="poppins" /></div>
              <button onClick={onClose} className="text-zinc-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">E-mail Atual</label>
                <div className="w-full bg-[#141414]/50 border border-zinc-800 rounded-lg p-3 text-zinc-400 cursor-not-allowed select-none">{currentEmail}</div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Novo E-mail</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Digite o novo e-mail" className="w-full bg-[#141414] border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 transition-colors placeholder:text-zinc-600" />
              </div>
            </div>
            <div className="p-4 border-t border-zinc-800 flex justify-end gap-2 bg-[#1a1a1a]">
              <Button variant="ghost" onClick={onClose} className="text-zinc-400 hover:bg-red-600 hover:text-white">Cancelar</Button>
              <Button onClick={handleSave} disabled={!email.trim()} className="bg-purple-600 hover:bg-purple-700 text-white gap-2 disabled:opacity-50 disabled:cursor-not-allowed"><Save size={16} /> Salvar</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
