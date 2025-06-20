import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Copy, ChevronDown } from "lucide-react";
import { Typograph } from "@/components/components/Typograph/Typograph";

interface Discipline {
  id: string;
  name: string;
  code: string;
}

interface DisciplineCodeProps {
  disciplines: Discipline[];
}

export function DisciplineCode({ disciplines }: DisciplineCodeProps) {
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
          className="text-white-400 hover:text-white-300 text-xl ml-2 px-0"
        >
          <ChevronDown size={16} strokeWidth={2.2} />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1f1f1f] border border-white/10 text-white max-w-md font-poppins">
        <DialogHeader>
          <DialogTitle className="text-white text-lg">
            Disciplinas Vinculadas
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          {disciplines.map((disc) => (
            <div
              key={disc.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-[#2a2a2a] px-4 py-3 rounded-xl shadow-sm"
            >
              <div>
                <Typograph
                  text={disc.name}
                  variant="text6"
                  colorText="text-white"
                  weight="medium"
                  fontFamily="poppins"
                />
                <Typograph
                  text={disc.code}
                  variant="text9"
                  colorText="text-white"
                  weight="thin"
                  fontFamily="poppins"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 sm:mt-0 text-xs text-indigo-400 hover:text-indigo-300 px-2 py-1"
                onClick={() => handleCopy(disc.code)}
              >
                {copiedCode === disc.code ? (
                  <Check size={16} className="mr-1 text-green-400" />
                ) : (
                  <Copy size={16} className="mr-1" />
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
