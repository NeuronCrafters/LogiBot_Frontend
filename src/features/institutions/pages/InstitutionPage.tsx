import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Facebook, Globe, ImageIcon, Instagram, Linkedin, PauseCircle, Pencil, Power, Rss, Youtube } from "lucide-react";
import { t, useLocale, type MessageKey } from "@/i18n";
import { AppModal } from "@/shared/components/feedback/AppModal";
import { apiError } from "@/shared/lib/apiError";
import { cn } from "@/shared/lib/cn";
import { toast } from "@/shared/lib/toast";
import { institutionsApi, type InstitutionPageData } from "@/features/institutions/api/institutionsApi";
import { hasLocation, imageUrl, institutionInitials, kindLabel } from "@/features/institutions/lib/institutionLabels";
import { ClassesPanel, CoursesPanel, DisciplinesPanel, OverviewPanel, PeoplePanel } from "@/features/institutions/components/InstitutionPanels";
import { EditInstitutionModal, InstitutionImagesModal } from "@/features/institutions/components/InstitutionModals";
import { ClassmatesPanel, MyClassPanel, StudentsPanel, TeachingPanel } from "@/features/institutions/components/InstitutionRolePanels";
import { InstitutionList } from "@/features/institutions/components/InstitutionList";
import { ComponentSwitches, LocationCard } from "@/features/institutions/components/InstitutionExtras";

const LINK_ICON = { instagram: Instagram, facebook: Facebook, youtube: Youtube, linkedin: Linkedin, blog: Rss, site: Globe } as const;

type Tab = "overview" | "courses" | "classes" | "disciplines" | "people" | "myClass" | "classmates" | "teaching" | "students";
const PANELS: Record<Tab, (props: { data: InstitutionPageData }) => JSX.Element> = {
  overview: OverviewPanel, courses: CoursesPanel, classes: ClassesPanel, disciplines: DisciplinesPanel, people: PeoplePanel,
  myClass: MyClassPanel, classmates: ClassmatesPanel, teaching: TeachingPanel, students: StudentsPanel,
};
/**
 * Each profile sees its own part: the student their class and classmates, the professor the classes
 * they teach and their students, coordination (its courses) and admins (everything) the aggregated numbers.
 */
const tabsFor = (data: InstitutionPageData): Tab[] =>
  data.myClass !== undefined ? ["myClass", "classmates"]
    : data.teaching ? ["teaching", "students"]
      : ["overview", "courses", "classes", "disciplines", "people"];
const tabCount = (data: InstitutionPageData, key: Tab): number | null => {
  if (key === "courses" || key === "classes" || key === "disciplines") return data.counts?.[key] ?? null;
  if (key === "classmates") return data.myClass ? data.myClass.classmates.length : null;
  if (key === "students") return data.teaching ? new Set(data.teaching.disciplines.flatMap((item) => item.students.map((student) => `${student.name}|${student.className}`))).size : null;
  return null;
};


export function InstitutionPage() {
  useLocale();
  const { institutionId } = useParams();
  const queryClient = useQueryClient();
  const baseId = useId();
  const [tab, setTab] = useState<Tab | null>(null);
  const [editing, setEditing] = useState<"data" | "images" | null>(null);
  const [confirmStatus, setConfirmStatus] = useState(false);
  const [changing, setChanging] = useState(false);
  const tabRefs = useRef(new Map<Tab, HTMLButtonElement>());

  const list = useQuery({ queryKey: ["institutions"], queryFn: institutionsApi.list, staleTime: 60 * 1000 });
  // Several institutions (admin, owner): a list first. Only one: straight to its page.
  const showList = !institutionId && (list.data?.length ?? 0) > 1;
  const selected = institutionId ?? (showList ? undefined : list.data?.[0]?.id);
  const page = useQuery({ queryKey: ["institution", selected], queryFn: () => institutionsApi.page(selected!), enabled: !!selected });
  const data = page.data;
  const tabs = useMemo(() => (data ? tabsFor(data) : (["overview"] as Tab[])), [data]);
  const current: Tab = tab && tabs.indexOf(tab) !== -1 ? tab : tabs[0];
  useEffect(() => { if (tab && tabs.indexOf(tab) === -1) setTab(null); }, [tabs, tab]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["institution", selected] });
    void queryClient.invalidateQueries({ queryKey: ["institutions"] });
  };

  function onTabKey(event: KeyboardEvent<HTMLButtonElement>) {
    const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
    if (keys.indexOf(event.key) === -1) return;
    event.preventDefault();
    const index = tabs.indexOf(current);
    const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    setTab(tabs[next]);
    tabRefs.current.get(tabs[next])?.focus();
  }

  async function changeStatus() {
    if (!data) return;
    setChanging(true);
    try {
      await institutionsApi.setStatus(data.institution.id, !data.institution.active);
      toast.success(t(data.institution.active ? "institutions.status.deactivated" : "institutions.status.reactivated", { name: data.institution.name }));
      setConfirmStatus(false);
      refresh();
    } catch (caught) {
      toast.error(apiError(caught));
    } finally {
      setChanging(false);
    }
  }

  const loading = list.isLoading || (!!selected && page.isLoading);
  const problem = list.error || page.error;
  const Panel = PANELS[current];
  const institution = data?.institution;
  const location = institution ? [institution.city, institution.state, institution.country].filter(Boolean).join(", ") : "";

  return (
    <main className="relative flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-5xl space-y-5 font-[Poppins]">
        {showList && !list.isLoading && <div className="page-reveal"><InstitutionList items={list.data!} /></div>}
        {institutionId && (list.data?.length ?? 0) > 1 && (
          <Link to="/institution" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-blue-300 hover:bg-white/5 md:min-h-9">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />{t("institutions.list.back")}
          </Link>
        )}

        {loading && (
          <div role="status" aria-live="polite" className="space-y-4">
            <span className="sr-only">{t("common.carregandoDados")}</span>
            <div aria-hidden="true" className="h-56 animate-pulse rounded-2xl border border-white/10 bg-surface motion-reduce:animate-none" />
            <div aria-hidden="true" className="h-40 animate-pulse rounded-2xl border border-white/10 bg-surface motion-reduce:animate-none" />
          </div>
        )}

        {problem && !loading && (
          <div role="alert" className="rounded-2xl border border-white/10 bg-surface p-8 text-center">
            <PauseCircle aria-hidden="true" className="mx-auto h-8 w-8 text-zinc-400" />
            <p className="mt-2 text-base font-semibold text-white">{t("institutions.unavailable")}</p>
            <p className="mt-1 text-sm text-zinc-400">{apiError(problem)}</p>
          </div>
        )}

        {!loading && !problem && !selected && !showList && (
          <p className="rounded-2xl border border-white/10 bg-surface p-8 text-center text-sm text-zinc-400">{t("institutions.none")}</p>
        )}

        {data && institution && !loading && (
          <div className="page-reveal space-y-5">
            <section aria-labelledby={`${baseId}-name`} className="overflow-hidden rounded-2xl border border-white/10 bg-surface">
              <div className={cn("institution-cover-art h-32 md:h-44", !institution.active && "opacity-50 grayscale")} role="img"
                aria-label={institution.cover ? t("institutions.coverAlt", { name: institution.name }) : t("institutions.coverDefault")}
                style={institution.cover ? { backgroundImage: `url("${imageUrl(institution.cover)}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined} />
              {/* Only the profile photo overlaps the cover; the name stays below it, readable whatever the cover colours. */}
              <div className="flex flex-wrap items-start gap-x-5 gap-y-3 px-4 pb-4 md:px-6 md:pb-5">
                <div className="-mt-10 flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-surface bg-slate-900 text-2xl font-bold text-slate-100 md:-mt-12 md:h-24 md:w-24">
                  {institution.logo ? <img src={imageUrl(institution.logo)!} alt={t("institutions.logoAlt", { name: institution.name })} className="h-full w-full object-cover" />
                    : <span aria-hidden="true">{institutionInitials(institution.name)}</span>}
                </div>
                <div className="min-w-[12rem] flex-1 pt-3">
                  <h1 id={`${baseId}-name`} className="text-2xl font-semibold leading-tight text-white md:text-3xl">{institution.name}</h1>
                  {(institution.kind || location || institution.website) && (
                    <p className="mt-1 flex flex-wrap gap-x-2 text-sm text-zinc-400">
                      {institution.kind && <span>{kindLabel(institution.kind)}</span>}
                      {location && <span>{institution.kind ? "· " : ""}{location}</span>}
                      {institution.website && <span>· <a href={institution.website} target="_blank" rel="noreferrer" className="text-blue-300 underline-offset-2 hover:underline">{institution.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a></span>}
                    </p>
                  )}
                  {(institution.links ?? []).length > 0 && (
                    <ul aria-label={t("institutions.links.title")} className="mt-2 flex flex-wrap gap-1">
                      {(institution.links ?? []).map((link, index) => {
                        const Icon = LINK_ICON[link.kind] ?? Globe;
                        const name = t(`institutions.links.kind.${link.kind}`);
                        return (
                          <li key={`${link.url}-${index}`}>
                            <a href={link.url} target="_blank" rel="noreferrer noopener" title={name}
                              className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg border border-white/15 px-2.5 text-xs font-semibold text-zinc-200 hover:bg-white/10 hover:text-white md:min-h-9 md:min-w-9">
                              <Icon aria-hidden="true" className="h-4 w-4" /><span className="sr-only sm:not-sr-only">{name}</span>
                              <span className="sr-only"> {t("institutions.map.newTab")}</span>
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {(data.counts || !institution.active) && (
                    <ul className="mt-2 flex flex-wrap gap-1.5 text-xs text-zinc-300" aria-label={t("institutions.structure")}>
                      {data.counts && (
                        <>
                          <li className="rounded-full border border-white/15 px-2.5 py-0.5">{t("institutions.courses.count", { count: data.counts.courses })}</li>
                          <li className="rounded-full border border-white/15 px-2.5 py-0.5">{t("institutions.classes.count", { count: data.counts.classes })}</li>
                          <li className="rounded-full border border-white/15 px-2.5 py-0.5">{t("institutions.disciplines.count", { count: data.counts.disciplines })}</li>
                        </>
                      )}
                      {!institution.active && <li className="rounded-full border border-red-400/60 px-2.5 py-0.5 font-semibold text-red-300">{t("institutions.status.badge")}</li>}
                    </ul>
                  )}
                </div>
                {data.viewer.canEdit && (
                  <div className="flex flex-wrap gap-2 pt-3">
                    <button type="button" onClick={() => setEditing("data")} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-surface-sunken px-3 text-sm font-semibold text-white hover:bg-white/10 md:min-h-9">
                      <Pencil aria-hidden="true" className="h-4 w-4" />{t("institutions.edit.button")}
                    </button>
                    <button type="button" onClick={() => setEditing("images")} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-surface-sunken px-3 text-sm font-semibold text-white hover:bg-white/10 md:min-h-9">
                      <ImageIcon aria-hidden="true" className="h-4 w-4" />{t("institutions.images.button")}
                    </button>
                  </div>
                )}
              </div>
            </section>

            {institution.about && <p className="max-w-3xl whitespace-pre-line text-sm leading-relaxed text-zinc-300">{institution.about}</p>}

            {(data.viewer.canChangeStatus || !institution.active) && (
              <div role="status" className={cn("flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm",
                institution.active ? "border-white/10 bg-surface-sunken" : "border-red-400/50 bg-red-500/10")}>
                <p className="min-w-0">
                  <span aria-hidden="true" className={cn("mr-2 inline-block h-2.5 w-2.5 rounded-full", institution.active ? "bg-chart-positive" : "bg-chart-negative")} />
                  <strong className="text-white">{institution.active ? t("institutions.status.active") : t("institutions.status.inactive")}</strong>
                  <span className="block text-xs text-zinc-400">
                    {institution.active ? t("institutions.status.activeHint")
                      : t("institutions.status.inactiveHint", { date: institution.deactivatedAt ? new Date(institution.deactivatedAt).toLocaleDateString(document.documentElement.lang || undefined) : "—" })}
                  </span>
                </p>
                {data.viewer.canChangeStatus && (
                  <button type="button" onClick={() => setConfirmStatus(true)}
                    className={cn("inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold md:min-h-9",
                      institution.active ? "border border-red-400/50 bg-red-500/10 text-red-200 hover:bg-red-500/20" : "bg-blue-600 text-on-accent hover:bg-blue-700")}>
                    <Power aria-hidden="true" className="h-4 w-4" />
                    {institution.active ? t("institutions.status.deactivate") : t("institutions.status.reactivate")}
                  </button>
                )}
              </div>
            )}

            {data.viewer.canChangeComponents && <ComponentSwitches data={data} onChanged={refresh} />}

            <div role="tablist" aria-label={t("institutions.sections")}
              className="-mx-4 flex gap-1 overflow-x-auto border-b border-white/10 px-4 [scrollbar-width:none] md:mx-0 md:px-0">
              {tabs.map((key) => (
                <button key={key} type="button" role="tab" id={`${baseId}-tab-${key}`} aria-controls={`${baseId}-panel`} aria-selected={current === key} tabIndex={current === key ? 0 : -1}
                  ref={(element) => { if (element) tabRefs.current.set(key, element); else tabRefs.current.delete(key); }}
                  onClick={() => setTab(key)} onKeyDown={onTabKey}
                  className={cn("min-h-12 shrink-0 border-b-2 px-3.5 text-sm font-semibold transition-colors",
                    current === key ? "border-blue-500 text-white" : "border-transparent text-zinc-400 hover:text-white")}>
                  {t(`institutions.tab.${key}` as MessageKey)}
                  {tabCount(data, key) !== null && <span className="ml-1.5 text-xs font-medium text-zinc-400">{tabCount(data, key)}</span>}
                </button>
              ))}
            </div>
            <div key={current} role="tabpanel" id={`${baseId}-panel`} aria-labelledby={`${baseId}-tab-${current}`} tabIndex={0} className="page-reveal outline-none">
              <Panel data={data} />
              {current === tabs[0] && data.components.location && hasLocation(institution) && <div className="mt-4"><LocationCard data={institution} canEdit={data.viewer.canEdit} /></div>}
            </div>

            {data.viewer.canEdit && (
              <>
                <EditInstitutionModal data={institution} components={data.components} isOpen={editing === "data"} onClose={() => setEditing(null)} onSaved={() => { toast.success(t("institutions.saved")); refresh(); }} />
                <InstitutionImagesModal data={institution} components={data.components} isOpen={editing === "images"} onClose={() => setEditing(null)} onSaved={() => { toast.success(t("institutions.saved")); refresh(); }} />
              </>
            )}
            {data.viewer.canChangeStatus && (
              <AppModal isOpen={confirmStatus} type={institution.active ? "delete" : "consent"}
                title={t(institution.active ? "institutions.status.confirmOffTitle" : "institutions.status.confirmOnTitle", { name: institution.name })}
                description={t(institution.active ? "institutions.status.confirmOffText" : "institutions.status.confirmOnText")}
                acceptLabel={institution.active ? t("institutions.status.deactivate") : t("institutions.status.reactivate")}
                disabled={changing} onConfirm={changeStatus} onCancel={() => setConfirmStatus(false)} onClose={() => setConfirmStatus(false)} />
            )}
          </div>
        )}
      </div>
    </main>
  );
}
