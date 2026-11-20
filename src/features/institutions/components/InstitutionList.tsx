import { useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, ChevronRight, Search } from "lucide-react";
import { t, useLocale } from "@/i18n";
import { cn } from "@/shared/lib/cn";
import type { InstitutionSummary } from "@/features/institutions/api/institutionsApi";
import { imageUrl, institutionInitials, kindLabel } from "@/features/institutions/lib/institutionLabels";

const normalize = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Every institution the admin or owner may open; choosing one opens its page. */
export function InstitutionList({ items }: { items: InstitutionSummary[] }) {
  useLocale();
  const id = useId();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const visible = useMemo(() => items.filter((item) =>
    (status === "all" || (status === "active") === item.active) &&
    (!query.trim() || normalize(`${item.name} ${item.city ?? ""} ${item.state ?? ""}`).includes(normalize(query.trim())))), [items, query, status]);
  const inactive = items.filter((item) => !item.active).length;

  return (
    <div className="space-y-5 font-[Poppins]">
      <header className="rounded-2xl border border-white/10 bg-surface p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400"><Building2 className="h-5 w-5" /></span>
          <div>
            <h1 className="text-2xl font-semibold text-white">{t("institutions.list.title")}</h1>
            <p className="mt-1 text-sm text-zinc-400">{t("institutions.list.description", { count: items.length, inactive })}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="relative">
            <label htmlFor={`${id}-search`} className="sr-only">{t("institutions.list.search")}</label>
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input id={`${id}-search`} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("institutions.list.search")}
              className="h-11 w-full rounded-xl border border-control bg-neutral-950/60 pl-9 pr-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-500/60" />
          </div>
          <div>
            <label htmlFor={`${id}-status`} className="sr-only">{t("institutions.list.status")}</label>
            <select id={`${id}-status`} value={status} onChange={(event) => setStatus(event.target.value as typeof status)}
              className="h-11 w-full rounded-xl border border-control bg-neutral-950/60 px-3 text-sm text-white sm:w-48">
              <option value="all">{t("institutions.list.all")}</option>
              <option value="active">{t("institutions.list.active")}</option>
              <option value="inactive">{t("institutions.list.inactive")}</option>
            </select>
          </div>
        </div>
      </header>

      <p aria-live="polite" className="text-sm text-zinc-400">{t("institutions.list.showing", { count: visible.length, total: items.length })}</p>
      {visible.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-surface p-8 text-center text-sm text-zinc-400">{t("institutions.list.empty")}</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {visible.map((item) => {
            const place = [item.city, item.state].filter(Boolean).join(", ");
            return (
              <li key={item.id}>
                <Link to={`/institution/${item.id}`}
                  className={cn("group flex h-full items-center gap-4 rounded-2xl border bg-surface p-4 transition-colors hover:border-blue-400/50 hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
                    item.active ? "border-white/10" : "border-red-400/40")}>
                  <span className={cn("flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-900 text-lg font-bold text-slate-100", !item.active && "opacity-60 grayscale")} aria-hidden="true">
                    {item.logo ? <img src={imageUrl(item.logo)!} alt="" className="h-full w-full object-cover" /> : institutionInitials(item.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-semibold text-white">{item.name}</span>
                    {(item.kind || place) && <span className="block truncate text-xs text-zinc-400">{[item.kind ? kindLabel(item.kind) : "", place].filter(Boolean).join(" · ")}</span>}
                    <span className="mt-1.5 flex flex-wrap gap-1.5 text-xs text-zinc-300">
                      <span className="rounded-full border border-white/15 px-2 py-0.5">{t("institutions.courses.count", { count: item.courses })}</span>
                      <span className="rounded-full border border-white/15 px-2 py-0.5">{t("institutions.classes.count", { count: item.classes })}</span>
                      {!item.active && <span className="rounded-full border border-red-400/60 px-2 py-0.5 font-semibold text-red-300">{t("institutions.status.badge")}</span>}
                    </span>
                  </span>
                  <ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0 text-zinc-500 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
