import { t, useLocale } from "@/i18n";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface Discipline {
  id: string;
  name: string;
}

interface DisciplineCodeProps {
  text: string;
  disciplines: Discipline[];
}

export function DisciplineCode({ text, disciplines }: DisciplineCodeProps) {
  useLocale();

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
      <DialogContent className="max-w-md border border-white/10 bg-surface text-white font-[Poppins]">
        <DialogHeader>
          <DialogTitle className="text-base text-white">
            {t("common.disciplinasVinculadas")}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-3">
          {disciplines.map((disc) => (
            <div
              key={disc.id}
              className="rounded-xl border border-white/10 bg-neutral-950/60 px-4 py-3"
            >
              <p className="break-words text-sm font-medium text-white">
                {disc.name}
              </p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
