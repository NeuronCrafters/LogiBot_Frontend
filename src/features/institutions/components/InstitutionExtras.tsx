import { useId, useState } from "react";
import { Image as ImageIcon, MapPin, Navigation, ExternalLink } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { t, useLocale } from "@/i18n";
import { apiError } from "@/shared/lib/apiError";
import { cn } from "@/shared/lib/cn";
import { toast } from "@/shared/lib/toast";
import { featuresApi } from "@/features/release/api/featuresApi";
import { COMPONENT_FEATURE, type InstitutionComponent, type InstitutionData, type InstitutionPageData } from "@/features/institutions/api/institutionsApi";
import { mapEmbed, mapLink } from "@/features/institutions/lib/institutionLabels";

/**
 * Where the institution is: the address as text (always readable), links to Google Maps (by the point
 * or, without one, by the address) and, when there is a map point, the embedded OpenStreetMap map,
 * shown right away (the browser loads it when it comes into view).
 */
export function LocationCard({ data, canEdit = false }: { data: InstitutionData; canEdit?: boolean }) {
  useLocale();
  const id = useId();
  const point = data.latitude !== null && data.longitude !== null ? { latitude: data.latitude, longitude: data.longitude } : null;
  const place = [data.city, data.state].filter(Boolean).join(" – ");
  const addressQuery = [[data.address, data.addressNumber].filter(Boolean).join(", "), data.district, data.city, data.state, data.postalCode, data.country].filter(Boolean).join(", ");
  const target = point ? `${point.latitude},${point.longitude}` : addressQuery;
  const google = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(target)}`;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(target)}`;
  const link = "inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-blue-300 hover:bg-white/5 md:min-h-9";

  return (
    <section aria-labelledby={`${id}-title`} className="rounded-2xl border border-white/10 bg-surface p-4 font-[Poppins] md:p-5">
      <h2 id={`${id}-title`} className="flex items-center gap-2 text-base font-semibold text-white">
        <MapPin aria-hidden="true" className="h-4 w-4 text-blue-300" />{t("institutions.map.title")}
      </h2>
      <address className="mt-2 grid gap-0.5 text-sm not-italic leading-relaxed text-zinc-300">
        {(data.address || data.district) && <span>{[[data.address, data.addressNumber].filter(Boolean).join(", "), data.district].filter(Boolean).join(" – ")}</span>}
        {(place || data.postalCode) && <span>{[place, data.postalCode].filter(Boolean).join(" · ")}</span>}
        {data.country && <span>{data.country}</span>}
      </address>

      {point && (
        <div className="mt-3">
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-white/10 bg-surface-sunken md:aspect-[21/9]">
            <iframe title={t("institutions.map.frame", { name: data.name })} src={mapEmbed(point.latitude, point.longitude)} loading="lazy"
              referrerPolicy="no-referrer" className="h-full w-full border-0" />
          </div>
        </div>
      )}
      {!point && canEdit && <p className="mt-2 text-xs text-zinc-400">{t("institutions.map.noPoint")}</p>}
      {target && (
        <div className="mt-2 flex flex-wrap gap-1">
          <a href={google} target="_blank" rel="noreferrer" className={link}>
            <ExternalLink aria-hidden="true" className="h-4 w-4" />{t("institutions.map.openGoogle")}<span className="sr-only"> {t("institutions.map.newTab")}</span>
          </a>
          <a href={directions} target="_blank" rel="noreferrer" className={link}>
            <Navigation aria-hidden="true" className="h-4 w-4" />{t("institutions.map.directions")}<span className="sr-only"> {t("institutions.map.newTab")}</span>
          </a>
          {point && (
            <a href={mapLink(point.latitude, point.longitude)} target="_blank" rel="noreferrer" className={link}>
              <ExternalLink aria-hidden="true" className="h-4 w-4" />{t("institutions.map.open")}<span className="sr-only"> {t("institutions.map.newTab")}</span>
            </a>
          )}
        </div>
      )}
    </section>
  );
}

const COMPONENTS: Array<{ key: InstitutionComponent; icon: typeof MapPin }> = [{ key: "location", icon: MapPin }, { key: "photo", icon: ImageIcon }];

/** Owner: turns the location and the profile photo of this institution on and off (rule of the institution). */
export function ComponentSwitches({ data, onChanged }: { data: InstitutionPageData; onChanged: () => void }) {
  useLocale();
  const id = useId();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<InstitutionComponent | null>(null);

  async function toggle(key: InstitutionComponent) {
    const enabled = !data.components[key];
    setBusy(key);
    try {
      await featuresApi.setRule({ feature: COMPONENT_FEATURE[key], scope: "institution", scopeId: data.institution.id, enabled });
      toast.success(t(enabled ? "institutions.components.on" : "institutions.components.off", { name: t(`institutions.components.${key}`) }));
      void queryClient.invalidateQueries({ queryKey: ["featureRules"] });
      onChanged();
    } catch (caught) {
      toast.error(apiError(caught));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section aria-labelledby={`${id}-title`} className="rounded-xl border border-white/10 bg-surface-sunken px-4 py-3 font-[Poppins]">
      <h2 id={`${id}-title`} className="text-sm font-semibold text-white">{t("institutions.components.title")}</h2>
      <p className="text-xs text-zinc-400">{t("institutions.components.hint")}</p>
      <ul className="mt-2 grid gap-1 sm:grid-cols-2">
        {COMPONENTS.map(({ key, icon: Icon }) => {
          const on = data.components[key];
          return (
            <li key={key} className="flex items-center justify-between gap-3 rounded-lg px-1 py-1.5">
              <span className="flex min-w-0 items-start gap-2">
                <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-zinc-300" />
                <span className="min-w-0">
                  <span id={`${id}-${key}`} className="block text-sm font-medium text-zinc-100">{t(`institutions.components.${key}`)}</span>
                  <span id={`${id}-${key}-hint`} className="block text-xs text-zinc-400">{t(`institutions.components.${key}Hint`)}</span>
                </span>
              </span>
              <button type="button" role="switch" aria-checked={on} aria-labelledby={`${id}-${key}`} aria-describedby={`${id}-${key}-hint`}
                disabled={busy !== null} onClick={() => void toggle(key)}
                className={cn("relative inline-flex h-11 w-16 shrink-0 items-center justify-center rounded-full disabled:opacity-60 md:h-9")}>
                <span aria-hidden="true" className={cn("relative h-6 w-11 rounded-full border transition-colors",
                  on ? "border-blue-500 bg-blue-600" : "border-white/25 bg-white/10")}>
                  <span className={cn("absolute top-0.5 h-[1.125rem] w-[1.125rem] rounded-full bg-white shadow transition-[left] motion-reduce:transition-none", on ? "left-[1.4rem]" : "left-0.5")} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
