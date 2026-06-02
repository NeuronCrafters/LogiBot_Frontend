import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, Copy } from "lucide-react";

interface Discipline {
  id: string;
  name: string;
  code: string;
}

interface DisciplineCodeProps {
  text: string;
  disciplines: Discipline[];
}

export function DisciplineCode({ text, disciplines }: DisciplineCodeProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto max-w-full justify-start gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left font-[Poppins] text-sm font-medium text-zinc-200 hover:bg-white/10 hover:text-white"
        >
          <span className="truncate">{text}</span>
          <ChevronDown
            className="h-4 w-4 shrink-0 text-zinc-500"
            strokeWidth={2.2}
          />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md border border-white/10 bg-[#1f1f1f] text-white font-[Poppins]">
        <DialogHeader>
          <DialogTitle className="text-base text-white">
            Disciplinas vinculadas
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-3">
          {disciplines.map((disc) => (
            <div
              key={disc.id}
              className="flex flex-col gap-3 rounded-xl border border-white/10 bg-neutral-950/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="break-words text-sm font-medium text-white">
                  {disc.name}
                </p>
                <p className="mt-1 font-mono text-xs text-zinc-500">
                  {disc.code}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-indigo-300 hover:bg-white/10 hover:text-indigo-200 sm:w-auto"
                onClick={() => handleCopy(disc.code)}
              >
                {copiedCode === disc.code ? (
                  <Check size={16} className="text-green-400" />
                ) : (
                  <Copy size={16} />
                )}
                {copiedCode === disc.code ? "Copiado" : "Copiar código"}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
