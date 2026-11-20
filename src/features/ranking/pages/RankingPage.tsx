import { useEffect, useId, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Info, Medal, Trophy } from "lucide-react";
import { t, useLocale } from "@/i18n";
import { EmptyState, PageHeader, Panel } from "@/components/AppUI";
import { apiError } from "@/shared/lib/apiError";
import { cn } from "@/shared/lib/cn";
import { fieldClass } from "@/features/institutions/components/TextField";
import { SOURCES, rankingApi, type RankingData, type RankingScopes, type Scope } from "@/features/ranking/api/rankingApi";
import { RankingSettingsPanel } from "@/features/ranking/components/RankingSettingsPanel";

const MEDAL = ["text-amber-300", "text-zinc-300", "text-orange-300"];
const formatDate = (iso: string) => new Date(iso).toLocaleDateString(document.documentElement.lang || undefined);
const points = (value: number) => new Intl.NumberFormat(document.documentElement.lang || undefined, { maximumFractionDigits: 1 }).format(value);

function options(scopes: RankingScopes) {
  return [
    { group: t("ranking.scope.institutions"), items: scopes.institutions.map((item) => ({ value: `institution:${item.id}`, label: item.name })) },
    { group: t("ranking.scope.courses"), items: scopes.courses.map((item) => ({ value: `course:${item.id}`, label: item.name })) },
    { group: t("ranking.scope.classes"), items: scopes.classes.map((item) => ({ value: `class:${item.id}`, label: `${item.name} · ${item.courseName}` })) },
  ].filter((group) => group.items.length > 0);
}

/**
 * Ranking in cascade (class → course → institution), with the rules shown on the page. Each profile
 * only gets what it may see; the owner also changes the rules here.
 */
export function RankingPage() {
  useLocale();
  const id = useId();
  const scopes = useQuery({ queryKey: ["rankingScopes"], queryFn: rankingApi.scopes, staleTime: 5 * 60 * 1000 });
  const groups = useMemo(() => (scopes.data ? options(scopes.data) : []), [scopes.data]);
  const [selected, setSelected] = useState("");
  useEffect(() => { if (!selected && groups.length) setSelected(groups[0].items[0].value); }, [groups, selected]);
  const [scope, scopeId] = selected.split(":") as [Scope, string];
  const board = useQuery({ queryKey: ["ranking", selected], queryFn: () => rankingApi.ranking(scope, scopeId), enabled: !!selected });
  const data = board.data;

  return (
    <main className="relative flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-5xl space-y-5 font-[Poppins]">
        <PageHeader icon={<Trophy aria-hidden="true" className="h-5 w-5" />} title={t("ranking.pageTitle")} description={t("ranking.pageDescription")} />
        {scopes.isError && <p role="alert" className="text-sm text-red-300">{apiError(scopes.error)}</p>}
        {scopes.data && !scopes.data.allowed && <EmptyState icon={<Trophy aria-hidden="true" className="h-6 w-6" />} title={t("ranking.unavailableTitle")} description={t("ranking.unavailableDescription")} />}
        {scopes.data?.allowed && !groups.length && <EmptyState icon={<Trophy aria-hidden="true" className="h-6 w-6" />} title={t("ranking.noScopesTitle")} description={t("ranking.noScopesDescription")} />}

        {groups.length > 0 && (
          <Panel>
            <label htmlFor={`${id}-scope`} className="mb-1.5 block text-sm font-medium text-zinc-300">{t("ranking.selection")}</label>
            <select id={`${id}-scope`} value={selected} onChange={(event) => setSelected(event.target.value)} className={cn(fieldClass, "h-12")}>
              {groups.map((group) => (
                <optgroup key={group.group} label={group.group}>
                  {group.items.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </optgroup>
              ))}
            </select>
          </Panel>
        )}

        {board.isError && <p role="alert" className="text-sm text-red-300">{apiError(board.error)}</p>}
        {board.isLoading && selected && <div role="status" className="h-48 animate-pulse rounded-2xl border border-white/10 bg-surface motion-reduce:animate-none"><span className="sr-only">{t("common.carregandoDados")}</span></div>}
        {data && <Board data={data} />}
        {data?.viewer.canConfigure && scopes.data && <RankingSettingsPanel institutions={scopes.data.institutions} onSaved={() => void board.refetch()} />}
      </div>
    </main>
  );
}

function Board({ data }: { data: RankingData }) {
  useLocale();
  const id = useId();
  const student = data.viewer.level === "student";
  const showClass = data.scope !== "class";
  const active = data.rules.sources ?? SOURCES;
  const sources = SOURCES.filter((source) => active.indexOf(source) !== -1 && data.rules.weights[source] > 0);
  return (
    <div className="space-y-5">
      <section aria-labelledby={`${id}-rules`} className="rounded-2xl border border-blue-400/20 bg-blue-500/5 p-4">
        <h2 id={`${id}-rules`} className="flex items-center gap-2 text-sm font-semibold text-white"><Info aria-hidden="true" className="h-4 w-4 text-blue-300" />{t("ranking.rulesTitle")}</h2>
        <p className="mt-1 text-sm text-zinc-300">{t("ranking.rulesPeriod", { count: data.rules.periodDays, date: formatDate(data.since) })}</p>
        <ul className="mt-2 grid gap-1 text-sm text-zinc-300 sm:grid-cols-2">
          {SOURCES.filter((source) => active.indexOf(source) !== -1).map((source) => <li key={source}>{t(`ranking.rule.${source}`, { points: data.rules.weights[source] })}</li>)}
        </ul>
        <p className="mt-2 text-xs text-zinc-400">{t("ranking.rulesTies")} {data.groupLevel ? t("ranking.rulesGroups", { min: data.minGroupSize }) : ""}</p>
      </section>

      {data.groupLevel && (
        <section aria-labelledby={`${id}-groups`}>
          <h2 id={`${id}-groups`} className="text-base font-semibold text-white">{t(data.groupLevel === "class" ? "ranking.groupsClasses" : "ranking.groupsCourses", { name: data.name })}</h2>
          {data.groups.length === 0 ? <p className="mt-2 text-sm text-zinc-400">{t("ranking.groupsEmpty", { min: data.minGroupSize })}</p> : (
            <div className="mt-2 overflow-x-auto rounded-xl border border-white/10" role="region" aria-labelledby={`${id}-groups`} tabIndex={0}>
              <table className="w-full min-w-[28rem] border-collapse text-sm">
                <caption className="sr-only">{t(data.groupLevel === "class" ? "ranking.groupsClasses" : "ranking.groupsCourses", { name: data.name })}</caption>
                <thead><tr className="bg-surface-raised text-left text-zinc-300">
                  <th scope="col" className="w-20 px-3 py-2">{t("ranking.col.position")}</th>
                  <th scope="col" className="px-3 py-2">{t(data.groupLevel === "class" ? "ranking.col.class" : "ranking.col.course")}</th>
                  <th scope="col" className="px-3 py-2 text-right">{t("ranking.col.students")}</th>
                  <th scope="col" className="px-3 py-2 text-right">{t("ranking.col.average")}</th>
                </tr></thead>
                <tbody>{data.groups.map((group) => (
                  <tr key={group.id} className="border-t border-white/5 text-zinc-200">
                    <td className="px-3 py-2 tabular-nums">{t("ranking.positionValue", { position: group.position })}</td>
                    <th scope="row" className="px-3 py-2 text-left font-medium text-white">{group.name}</th>
                    <td className="px-3 py-2 text-right tabular-nums">{group.students}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{points(group.averagePoints)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {data.hiddenGroups > 0 && <p className="mt-1 text-xs text-zinc-400">{t("ranking.groupsHidden", { count: data.hiddenGroups, min: data.minGroupSize })}</p>}
        </section>
      )}

      <section aria-labelledby={`${id}-students`}>
        <h2 id={`${id}-students`} className="text-base font-semibold text-white">{t("ranking.studentsTitle", { name: data.name })}</h2>
        {data.students.length === 0 ? <p className="mt-2 text-sm text-zinc-400">{t("ranking.studentsEmpty")}</p> : (
          <div className="mt-2 overflow-x-auto rounded-xl border border-white/10" role="region" aria-labelledby={`${id}-students`} tabIndex={0}>
            <table className="w-full min-w-[32rem] border-collapse text-sm">
              <caption className="sr-only">{t("ranking.studentsTitle", { name: data.name })}</caption>
              <thead><tr className="bg-surface-raised text-left text-zinc-300">
                <th scope="col" className="w-20 px-3 py-2">{t("ranking.col.position")}</th>
                <th scope="col" className="px-3 py-2">{t("ranking.col.student")}</th>
                {showClass && <th scope="col" className="px-3 py-2">{t("ranking.col.class")}</th>}
                {sources.map((source) => <th key={source} scope="col" className="px-3 py-2 text-right">{t(`ranking.source.${source}`)}</th>)}
                <th scope="col" className="px-3 py-2 text-right">{t("ranking.col.points")}</th>
              </tr></thead>
              <tbody>{data.students.map((row, index) => (
                <tr key={index} className={cn("border-t border-white/5 text-zinc-200", row.me && "bg-blue-500/10")}>
                  <td className="px-3 py-2 tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      {row.position <= 3 && row.points > 0 && <Medal aria-hidden="true" className={cn("h-4 w-4", MEDAL[row.position - 1])} />}
                      {t("ranking.positionValue", { position: row.position })}
                    </span>
                  </td>
                  <th scope="row" className="px-3 py-2 text-left font-medium text-white">
                    {row.name ?? t("ranking.classmate")}
                    {row.me && <span className="ml-2 rounded-full border border-blue-400/50 px-2 py-0.5 text-xs font-semibold text-blue-200">{t("ranking.you")}</span>}
                  </th>
                  {showClass && <td className="px-3 py-2">{row.className ?? "—"}</td>}
                  {sources.map((source) => <td key={source} className="px-3 py-2 text-right tabular-nums">{row.breakdown ? points(row.breakdown[source]) : "—"}</td>)}
                  <td className="px-3 py-2 text-right font-semibold tabular-nums text-white">{points(row.points)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        {student && !data.rules.studentNames && <p className="mt-1 text-xs text-zinc-400">{t("ranking.namesHidden")}</p>}
      </section>
    </div>
  );
}
