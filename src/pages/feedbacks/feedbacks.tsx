import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-Auth";
import { Avatar } from "@/components/components/Avatar/Avatar";
import { Header } from "@/components/components/Header/Header";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api/api";
import toast, { Toaster } from "react-hot-toast";
import { Send, MessageSquare, AlertCircle } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Feedbacks() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [type, setType] = useState("GERAL");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      return toast.error("A mensagem não pode estar vazia.");
    }

    try {
      setLoading(true);
      await api.post("/feedbacks/send", { message, type });

      toast.success("Feedback enviado com sucesso!");
      setMessage("");
      setType("GERAL");
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || "Erro ao enviar feedback.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#141414] flex-col items-center w-full">
      <Toaster />
      <div className="absolute bg-[#141414] w-full flex items-center justify-between border-b border-neutral-800 px-8 py-4 z-10">
        <Typograph
          text="Feedback"
          variant="text2"
          weight="bold"
          colorText="text-white"
          fontFamily="poppins"
        />
        {user && (
          <Button
            onClick={() => setMenuOpen(true)}
            className="flex items-center justify-center p-0 bg-transparent hover:bg-transparent"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full rainbow-avatar sm:w-12 sm:h-12 md:w-14 md:h-14">
              <Avatar seed={user._id} backgroundColor="#141414" className="w-full h-full rounded-full" />
            </div>
          </Button>
        )}
      </div>

      <Header isOpen={menuOpen} closeMenu={() => setMenuOpen(false)} />

      <div className="flex-1 w-full px-4 pt-24 pb-10 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-2xl bg-[#1f1f1f] border border-white/10 rounded-xl p-8 shadow-2xl"
        >
          <div className="flex flex-col items-center gap-3 mb-8 text-center border-b border-white/5 pb-6">
            <div className="p-4 bg-zinc-800/50 rounded-full text-blue-500 border border-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <MessageSquare size={28} />
            </div>
            <div>
              <Typograph
                text="Enviar Feedback"
                variant="text3"
                weight="semibold"
                colorText="text-white"
                fontFamily="montserrat"
              />
              <Typograph
                text="Encontrou um erro ou tem uma sugestão? Conte para nós."
                variant="text5"
                colorText="text-white/60"
                className="mt-1"
                weight="regular"
                fontFamily="montserrat"
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="space-y-2">
              <Label htmlFor="type" className="text-zinc-300 ml-1">Tipo de Mensagem</Label>
              <Select value={type} onValueChange={setType} disabled={loading}>
                <SelectTrigger id="type" className="bg-zinc-900 border-zinc-700 text-zinc-200 h-12 focus:ring-offset-0 focus:ring-blue-600">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-200">
                  <SelectItem value="GERAL">Geral</SelectItem>
                  <SelectItem value="SUGESTAO">Sugestão de Melhoria</SelectItem>
                  <SelectItem value="BUG">Relatar um Erro (Bug)</SelectItem>
                  <SelectItem value="ELOGIO">Elogio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-zinc-300 ml-1">Sua Mensagem</Label>
              <Textarea
                id="message"
                placeholder="Descreva detalhadamente sua sugestão ou o problema encontrado..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[160px] bg-zinc-900 border-zinc-700 text-zinc-200 focus-visible:ring-blue-600 resize-none p-4 text-base"
                disabled={loading}
              />
            </div>

            <div className="flex gap-3 items-start p-3 rounded-lg bg-blue-900/10 border border-blue-500/10">
              <AlertCircle size={16} className="mt-0.5 text-blue-400 shrink-0" />
              <Typograph
                text="Seu feedback é fundamental para nossa evolução. A mensagem será enviada diretamente para a equipe de administração."
                variant="text6"
                colorText="text-blue-200/80"
                weight="regular"
                fontFamily="poppins"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-blue-600/20"
            >
              {loading ? "Enviando..." : (
                <span className="flex items-center gap-2">
                  Enviar Feedback <Send size={18} />
                </span>
              )}
            </Button>

          </form>
        </motion.div>
      </div>
    </div>
  );
}