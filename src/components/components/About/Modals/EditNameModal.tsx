import { useState } from "react";
import { X, Save, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { motion, AnimatePresence } from "framer-motion";

interface EditNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onSave: (newName: string) => void;
}

export function EditNameModal({ isOpen, onClose, currentName, onSave }: EditNameModalProps) {
  const [name, setName] = useState("");

  const handleSave = () => {
    if (name.trim()) {
      onSave(name);
      setName("");
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-[#1f1f1f] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <User size={18} className="text-blue-400" />
                <Typograph text="Alterar Nome" colorText="text-white" variant="text4" weight="semibold" fontFamily="poppins" />
              </div>
              <button onClick={onClose} className="text-zinc-400 hover:text-white"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-5">
              {/* Campo Não Editável (Nome Atual) */}
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Nome Atual</label>
                <div className="w-full bg-[#141414]/50 border border-zinc-800 rounded-lg p-3 text-zinc-400 cursor-not-allowed select-none">
                  {currentName}
                </div>
              </div>

              {/* Campo Editável (Novo Nome) */}
              <div className="space-y-2">
                <label className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Novo Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Digite o novo nome"
                  className="w-full bg-[#141414] border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 flex justify-end gap-2 bg-[#1a1a1a]">
              <Button variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-white">Cancelar</Button>
              <Button
                onClick={handleSave}
                disabled={!name.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} /> Salvar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}