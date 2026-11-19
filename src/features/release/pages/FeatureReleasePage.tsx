import { useId, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ToggleRight } from "lucide-react";
import { t, useLocale, type MessageKey } from "@/i18n";
import { PageHeader, Panel } from "@/components/AppUI";
import { cn } from "@/shared/lib/cn";
import { toast } from "@/shared/lib/toast";
import { apiError } from "@/shared/lib/apiError";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { academicFiltersApi } from "@/features/academic/api/academicFiltersApi";
import { featuresApi } from "@/features/release/api/featuresApi";
import { FEATURES, resolveFeature, type Feature, type FeatureRule, type Scope } from "@/features/release/featureCatalog";

const selectClass = "h-11 w-full rounded-xl border border-control bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white disabled:opacity-60";
type Choice = "inherit" | "on" | "off";

export function FeatureReleasePage() {
  useLocale();
  const { user } = useAuth();
  // Only the platform owner releases features (the API refuses everyone else as well).
  const isAdmin = !!user?.isOwner;
  const id = useId();
  const queryClient = useQueryClient();
  const [institutionId, setInstitutionId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [classId, setClassId] = useState("");

  const academic = useQuery({ queryKey: ["academicFilters"], queryFn: academicFiltersApi.getAcademicData, enabled: isAdmin, staleTime: 5 * 60 * 1000 });
  const rulesQuery = useQuery({ queryKey: ["featureRules"], queryFn: featuresApi.rules, enabled: isAdmin });
  const institutions = useMemo(() => academic.data?.data?.universities ?? [], [academic.data]);
  const courses = useMemo(() => institutions.find((item) => item._id === institutionId)?.courses ?? [], [institutions, institutionId]);
  const classes = useMemo(() => courses.find((item) => item._id === courseId)?.classes ?? [], [courses, courseId]);
  const rules: FeatureRule[] = Array.isArray(rulesQuery.data) ? rulesQuery.data : [];

  // The level being edited and the chain it inherits from.
  const target: [Scope, string] = classId ? ["class", classId] : courseId ? ["course", courseId] : institutionId ? ["institution", institutionId] : ["global", ""];
  const parents: Array<[Scope, string]> = [
    ...(classId ? [["course", courseId] as [Scope, string]] : []),
    ...(target[0] === "class" || target[0] === "course" ? [["institution", institutionId] as [Scope, string]] : []),
    ...(target[0] !== "global" ? [["global", ""] as [Scope, string]] : []),
  ];
  const levelName = (scope: Scope, scopeId: string) => {
    if (scope === "global") return t("features.admin.scope.global");
    const name = scope === "institution" ? institutions.find((item) => item._id === scopeId)?.name
      : scope === "course" ? courses.find((item) => item._id === scopeId)?.name
        : classes.find((item) => item._id === scopeId)?.name;
    return `${t(`features.admin.scope.${scope}` as MessageKey)}${name ? ` “${name}”` : ""}`;
  };

  const save = useMutation({
    mutationFn: async ({ feature, choice }: { feature: Feature; choice: Choice }) => {
      if (choice === "inherit") await featuresApi.clearRule({ feature, scope: target[0], scopeId: target[1] });
      else await featuresApi.setRule({ feature, scope: target[0], scopeId: target[1], enabled: choice === "on" });
    },
    onSuccess: () => {
      toast.success({ key: "features.admin.saved", params: {} });
      void queryClient.invalidateQueries({ queryKey: ["featureRules"] });
      void queryClient.invalidateQueries({ queryKey: ["features", "me"] });
    },
    onError: (error) => toast.error(apiError(error)),
  });

  if (!isAdmin) {
    return (
      <main className="flex flex-1 items-center justify-center px-4">
        <p className="font-[Poppins] text-sm text-zinc-400">{t("feedback.acessoRestrito")}</p>
      </main>
    );
  }

  return (
    <main className="relative flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <PageHeader icon={<ToggleRight aria-hidden="true" className="h-5 w-5" />} title={t("features.admin.title")} description={t("features.admin.description")} />

        <Panel>
          <h2 className="font-[Poppins] text-base font-semibold text-white">{t("features.admin.levelTitle")}</h2>
          <p className="mt-1 font-[Poppins] text-xs text-zinc-400">{t("features.admin.levelHint")}</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div>
              <label htmlFor={`${id}-institution`} className="mb-1 block font-[Poppins] text-xs font-medium text-zinc-300">{t("common.universidade")}</label>
              <select id={`${id}-institution`} value={institutionId} className={selectClass}
                onChange={(event) => { setInstitutionId(event.target.value); setCourseId(""); setClassId(""); }}>
                <option value="">{t("features.admin.allPlatform")}</option>
                {institutions.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor={`${id}-course`} className="mb-1 block font-[Poppins] text-xs font-medium text-zinc-300">{t("chatFeedback.admin.course")}</label>
              <select id={`${id}-course`} value={courseId} disabled={!institutionId} className={selectClass}
                onChange={(event) => { setCourseId(event.target.value); setClassId(""); }}>
                <option value="">{t("features.admin.wholeInstitution")}</option>
                {courses.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor={`${id}-class`} className="mb-1 block font-[Poppins] text-xs font-medium text-zinc-300">{t("chatFeedback.admin.class")}</label>
              <select id={`${id}-class`} value={classId} disabled={!courseId} className={selectClass} onChange={(event) => setClassId(event.target.value)}>
                <option value="">{t("features.admin.wholeCourse")}</option>
                {classes.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
              </select>
            </div>
          </div>
        </Panel>

        <Panel>
          <h2 id={`${id}-list`} className="font-[Poppins] text-base font-semibold text-white">{t("features.admin.editing", { level: levelName(target[0], target[1]) })}</h2>
          <p className="mt-1 font-[Poppins] text-xs text-zinc-400">{t("features.admin.adminNote")}</p>
          {rulesQuery.isError && <p role="alert" className="mt-2 font-[Poppins] text-sm text-red-300">{apiError(rulesQuery.error)}</p>}
          <ul aria-labelledby={`${id}-list`} aria-busy={rulesQuery.isLoading || undefined} className="mt-4 divide-y divide-white/5">
            {FEATURES.map((feature) => {
              const own = rules.find((rule) => rule.feature === feature && rule.scope === target[0] && rule.scopeId === target[1]);
              const choice: Choice = own ? (own.enabled ? "on" : "off") : "inherit";
              const inherited = resolveFeature(rules, feature, parents);
              const effective = own ? own.enabled : inherited.enabled;
              const selectId = `${id}-${feature}`;
              return (
                <li key={feature} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-[Poppins] text-sm font-semibold text-white">{t(`features.name.${feature}` as MessageKey)}</p>
                    <p className="font-[Poppins] text-xs text-zinc-400">{t(`features.description.${feature}` as MessageKey)}</p>
                    <p id={`${selectId}-effect`} className="mt-1 flex flex-wrap items-center gap-2 font-[Poppins] text-xs">
                      <span className={cn("rounded-full border px-2 py-0.5 font-semibold", effective ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200" : "border-red-400/40 bg-red-500/10 text-red-200")}>
                        {effective ? t("features.admin.released") : t("features.admin.blocked")}
                      </span>
                      <span className="text-zinc-400">
                        {own ? t("features.admin.fromHere") : inherited.from ? t("features.admin.fromParent", { level: levelName(inherited.from[0], inherited.from[1]) }) : t("features.admin.fromDefault")}
                      </span>
                    </p>
                  </div>
                  <div className="sm:w-56">
                    <label htmlFor={selectId} className="sr-only">{t("features.admin.choiceLabel", { feature: t(`features.name.${feature}` as MessageKey) })}</label>
                    <select id={selectId} value={choice} disabled={save.isPending} aria-describedby={`${selectId}-effect`} className={selectClass}
                      onChange={(event) => save.mutate({ feature, choice: event.target.value as Choice })}>
                      <option value="inherit">{target[0] === "global" ? t("features.admin.choice.default") : t("features.admin.choice.inherit")}</option>
                      <option value="on">{t("features.admin.choice.on")}</option>
                      <option value="off">{t("features.admin.choice.off")}</option>
                    </select>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </main>
  );
}
