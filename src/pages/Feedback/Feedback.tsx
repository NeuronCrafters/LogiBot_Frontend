import { useMemo, useState, type ReactNode } from "react";
import { toast } from "@/utils/toast";
import {
  AlertCircle,
  Bug,
  CheckCircle2,
  Heart,
  Lightbulb,
  Loader2,
  MessageCircle,
  MessageSquare,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/services/api/api";

type FeedbackType = "GERAL" | "SUGESTAO" | "BUG" | "ELOGIO";

const FEEDBACK_OPTIONS: Array<{
  value: FeedbackType;
  label: string;
  description: string;
  icon: ReactNode;
  tone: string;
}> = [
  {
    value: "GERAL",
    label: "Geral",
    description: "Comentários sobre a experiência.",
    icon: <MessageCircle className="h-4 w-4" />,
    tone: "text-blue-400 bg-blue-500/10",
  },
  {
    value: "SUGESTAO",
    label: "Sugestão",
    description: "Ideias para melhorar o LogiBot.",
    icon: <Lightbulb className="h-4 w-4" />,
    tone: "text-amber-400 bg-amber-500/10",
  },
  {
    value: "BUG",
    label: "Erro",
    description: "Algo que não funcionou bem.",
    icon: <Bug className="h-4 w-4" />,
    tone: "text-red-400 bg-red-500/10",
  },
  {
    value: "ELOGIO",
    label: "Elogio",
    description: "Algo que ajudou você.",
    icon: <Heart className="h-4 w-4" />,
    tone: "text-emerald-400 bg-emerald-500/10",
  },
];

const MAX_MESSAGE_LENGTH = 1200;

export function Feedback() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<FeedbackType | "">("");

  const selectedOption = useMemo(
    () => FEEDBACK_OPTIONS.find((option) => option.value === type),
    [type],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!type) return toast.error("Por favor, selecione uma categoria.");
    if (!message.trim()) return toast.error("A mensagem não pode estar vazia.");

    try {
      setLoading(true);
      await api.post("/feedback", { message: message.trim(), type });
      toast.success("Feedback enviado com sucesso!");
      setMessage("");
      setType("");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Erro ao enviar feedback.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <main className="flex min-h-full flex-1 items-center overflow-y-auto px-4 py-6 font-[Poppins] md:px-8 md:py-8">
        <div className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <section className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 sm:p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <MessageSquare className="h-6 w-6" />
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Feedback
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                Envie sua opinião
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Relate problemas, sugira melhorias ou compartilhe o que está
                funcionando bem na sua experiência com o LogiBot.
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-neutral-950/60 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                <p className="text-xs leading-relaxed text-zinc-400">
                  A mensagem será enviada para a equipe de administração. Quanto
                  mais contexto você incluir, mais fácil fica entender o caso.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <SummaryTile label="Categoria" value={selectedOption?.label ?? "Não selecionada"} />
              <SummaryTile label="Mensagem" value={`${message.trim().length}/${MAX_MESSAGE_LENGTH} caracteres`} />
            </div>
          </section>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 sm:p-6"
          >
            <div className="space-y-6">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Tipo de mensagem
                </Label>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {FEEDBACK_OPTIONS.map((option) => {
                    const isSelected = type === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={loading}
                        onClick={() => setType(option.value)}
                        className={`rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                          isSelected
                            ? "border-blue-400/50 bg-blue-500/10"
                            : "border-white/10 bg-neutral-950/60 hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${option.tone}`}
                          >
                            {option.icon}
                          </span>
                          <span className="min-w-0">
                            <span className="flex items-center gap-2 text-sm font-semibold text-white">
                              {option.label}
                              {isSelected && (
                                <CheckCircle2 className="h-4 w-4 text-blue-400" />
                              )}
                            </span>
                            <span className="mt-1 block text-xs leading-relaxed text-zinc-500">
                              {option.description}
                            </span>
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label
                    htmlFor="message"
                    className="text-xs font-semibold uppercase tracking-wider text-zinc-500"
                  >
                    Mensagem
                  </Label>
                  <span className="text-xs text-zinc-600">
                    {message.length}/{MAX_MESSAGE_LENGTH}
                  </span>
                </div>
                <Textarea
                  id="message"
                  maxLength={MAX_MESSAGE_LENGTH}
                  placeholder="Descreva sua sugestão, elogio ou o problema encontrado..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[210px] resize-none rounded-xl border-white/10 bg-neutral-950/60 p-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-blue-500"
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full gap-2 rounded-lg border border-blue-400/40 bg-blue-600 text-sm font-semibold text-white shadow-md shadow-blue-900/30 transition-colors hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando
                  </>
                ) : (
                  <>
                    Enviar feedback
                    <Send className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-neutral-950/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-zinc-200">
        {value}
      </p>
    </div>
  );
}
