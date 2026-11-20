import { useEffect, useId, useState } from "react";
import { ExternalLink, MapPin, Plus, Search, Trash2, X } from "lucide-react";
import { t, useLocale } from "@/i18n";
import { AppModal } from "@/shared/components/feedback/AppModal";
import { apiError } from "@/shared/lib/apiError";
import { cn } from "@/shared/lib/cn";
import { INSTITUTION_KINDS, LINK_KINDS, MAX_LINKS, institutionsApi, type LinkKind, type FieldIssue, type InstitutionComponents, type InstitutionData, type InstitutionForm, type Place } from "@/features/institutions/api/institutionsApi";
import { fieldIssueMessage, imageUrl, kindLabel, mapLink } from "@/features/institutions/lib/institutionLabels";
import { CENTERED, loadImage, renderCrop, type Crop } from "@/features/institutions/lib/imageCrop";
import { ImageCropper } from "@/features/institutions/components/ImageCropper";
import { fieldClass, TextField } from "@/features/institutions/components/TextField";
import { OptionalMark } from "@/shared/components/forms/OptionalMark";

const toForm = (data: InstitutionData): InstitutionForm => ({
  name: data.name, kind: data.kind ?? "", city: data.city ?? "", state: data.state ?? "", country: data.country ?? "",
  address: data.address ?? "", addressNumber: data.addressNumber ?? "", district: data.district ?? "", postalCode: data.postalCode ?? "", latitude: data.latitude === null ? "" : String(data.latitude),
  longitude: data.longitude === null ? "" : String(data.longitude), website: data.website ?? "", about: data.about ?? "",
  links: data.links ?? [],
});
const coordinate = (value: string) => { const number = Number(value.replace(",", ".")); return value.trim() && Number.isFinite(number) ? number : null; };

/**
 * Coordination and admins: name, kind, location (address and map point), website and "about"; everything
 * optional except the name. The location only shows when the owner has it released for the institution.
 */
export function EditInstitutionModal({ data, components, isOpen, onClose, onSaved }: {
  data: InstitutionData; components: InstitutionComponents; isOpen: boolean; onClose: () => void; onSaved: () => void;
}) {
  useLocale();
  const id = useId();
  const [form, setForm] = useState<InstitutionForm>(() => toForm(data));
  const [issues, setIssues] = useState<FieldIssue[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [cepStatus, setCepStatus] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  useEffect(() => { if (isOpen) { setForm(toForm(data)); setIssues([]); setError(""); setPlaces(null); setSearchError(""); setCepStatus(null); } }, [isOpen, data]);
  const query = [[form.address.trim(), form.addressNumber.trim()].filter(Boolean).join(", "), form.district, form.city, form.state, form.postalCode, form.country].map((part) => part.trim()).filter(Boolean).join(", ");
  const latitude = coordinate(form.latitude);
  const longitude = coordinate(form.longitude);

  async function search() {
    if (query.length < 3) { setSearchError(t("institutions.map.needAddress")); setPlaces(null); return; }
    setSearching(true); setSearchError("");
    try {
      setPlaces(await institutionsApi.geocode(data.id, query));
    } catch (caught) {
      setPlaces(null); setSearchError(apiError(caught));
    } finally {
      setSearching(false);
    }
  }
  const choosePlace = (place: Place) => {
    setForm((current) => ({ ...current, latitude: String(place.latitude), longitude: String(place.longitude) }));
    setPlaces(null);
  };
  const set = (field: Exclude<keyof InstitutionForm, "links">) => (value: string) => setForm((current) => ({ ...current, [field]: value }));
  const setLink = (index: number, change: { kind?: LinkKind; url?: string }) =>
    setForm((current) => ({ ...current, links: current.links.map((link, at) => (at === index ? { ...link, ...change } : link)) }));

  /** With 8 digits, the CEP fills street, city, state and country (each one can still be edited). */
  async function changePostalCode(value: string) {
    set("postalCode")(value);
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 8 || digits === (data.postalCode ?? "").replace(/\D/g, "")) { setCepStatus(null); return; }
    setCepLoading(true); setCepStatus(null);
    try {
      const found = await institutionsApi.postalCode(data.id, digits);
      setForm((current) => ({
        ...current, postalCode: found.postalCode, address: found.address ?? current.address, district: found.district ?? current.district, city: found.city ?? current.city,
        state: found.state ?? current.state, country: found.country, latitude: "", longitude: "",
      }));
      setCepStatus({ tone: "info", text: t("institutions.field.postalCodeFilled") });
    } catch (caught) {
      setCepStatus({ tone: "error", text: apiError(caught) });
    } finally {
      setCepLoading(false);
    }
  }
  const issueOf = (field: string) => { const issue = issues.find((item) => item.field === field); return issue ? fieldIssueMessage(issue) : undefined; };

  async function save() {
    if (!form.name.trim()) { setIssues([{ field: "name", code: "REQUIRED" }]); return; }
    setSaving(true); setError("");
    try {
      await institutionsApi.update(data.id, form, components.location);
      onSaved();
      onClose();
    } catch (caught) {
      const fields = (caught as { response?: { data?: { issues?: FieldIssue[] } } }).response?.data?.issues;
      if (fields?.length) setIssues(fields); else setError(apiError(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal isOpen={isOpen} type="update" size="lg" title={t("institutions.edit.title")} description={t("institutions.edit.description")}
      acceptLabel={saving ? t("institutions.saving") : t("institutions.save")} disabled={saving} onConfirm={save} onCancel={onClose} onClose={onClose}>
      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField id={`${id}-name`} label={t("institutions.field.name")} value={form.name} onChange={set("name")} maxLength={120} error={issueOf("name")} />
          <TextField id={`${id}-kind`} label={t("institutions.field.kind")} value={form.kind} optional error={issueOf("kind")}>
            <select id={`${id}-kind`} value={form.kind} onChange={(event) => set("kind")(event.target.value)} className={cn(fieldClass, "h-11")}>
              <option value="">{t("institutions.field.kindNone")}</option>
              {INSTITUTION_KINDS.map((kind) => <option key={kind} value={kind}>{kindLabel(kind)}</option>)}
            </select>
          </TextField>
        </div>
        {components.location && (
          <fieldset className="min-w-0 rounded-2xl border border-white/10 p-4">
            <legend className="px-1 font-[Poppins] text-sm font-semibold text-zinc-200">{t("institutions.field.location")}</legend>
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)] md:grid-cols-[10rem_minmax(0,1fr)_7rem]">
                <TextField id={`${id}-postal`} label={t("institutions.field.postalCode")} value={form.postalCode} onChange={(value) => void changePostalCode(value)} optional maxLength={20}
                  autoComplete="postal-code" inputMode="numeric" error={issueOf("postalCode")} />
                <TextField id={`${id}-address`} label={t("institutions.field.address")} value={form.address} onChange={set("address")} optional maxLength={160}
                  autoComplete="address-line1" error={issueOf("address")} />
                <TextField id={`${id}-number`} label={t("institutions.field.addressNumber")} value={form.addressNumber} onChange={set("addressNumber")} optional maxLength={20}
                  autoComplete="address-line2" error={issueOf("addressNumber")} />
              </div>
              {/* What the CEP filled (or why it could not), in its own line so the fields stay aligned. */}
              <p aria-live="polite" className={cn("-mt-2 text-xs empty:hidden", cepStatus?.tone === "error" ? "font-medium text-red-300" : "text-zinc-400")}>
                {cepLoading ? t("institutions.field.postalCodeLoading") : cepStatus?.text ?? ""}
              </p>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                <TextField id={`${id}-district`} label={t("institutions.field.district")} value={form.district} onChange={set("district")} optional maxLength={80} error={issueOf("district")} />
                <TextField id={`${id}-city`} label={t("institutions.field.city")} value={form.city} onChange={set("city")} optional maxLength={80} autoComplete="address-level2" error={issueOf("city")} />
                <TextField id={`${id}-state`} label={t("institutions.field.state")} value={form.state} onChange={set("state")} optional maxLength={80} autoComplete="address-level1" error={issueOf("state")} />
                <TextField id={`${id}-country`} label={t("institutions.field.country")} value={form.country} onChange={set("country")} optional maxLength={80} autoComplete="country-name" error={issueOf("country")} />
              </div>

              <div className="grid gap-3 rounded-xl border border-white/10 bg-surface-sunken p-3 font-[Poppins]" role="group" aria-labelledby={`${id}-point`} aria-describedby={`${id}-point-hint`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p id={`${id}-point`} className="flex items-center gap-1.5 text-sm font-medium text-zinc-200"><MapPin aria-hidden="true" className="h-4 w-4" />{t("institutions.map.point")}</p>
                    <p id={`${id}-point-hint`} className="text-xs text-zinc-400">{t("institutions.map.pointHint")}</p>
                  </div>
                  <button type="button" onClick={() => void search()} disabled={searching}
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-3 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-60 md:min-h-9">
                    <Search aria-hidden="true" className="h-4 w-4" />{searching ? t("institutions.map.searching") : t("institutions.map.search")}
                  </button>
                </div>
                <div aria-live="polite" className="grid gap-2">
                  {searchError && <p role="alert" className="text-xs font-medium text-red-300">{searchError}</p>}
                  {places && (places.length === 0
                    ? <p className="text-xs text-zinc-400">{t("institutions.map.noResults")}</p>
                    : (
                      <>
                        <p className="text-xs text-zinc-400">{t("institutions.map.results", { count: places.length })}</p>
                        <ul className="grid gap-1.5">
                          {places.map((place) => (
                            <li key={`${place.latitude},${place.longitude}`}>
                              <button type="button" onClick={() => choosePlace(place)}
                                className="flex min-h-11 w-full items-start gap-2 rounded-lg border border-white/10 px-3 py-2 text-left text-sm text-zinc-200 hover:border-blue-400/60 hover:bg-white/5">
                                <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
                                <span className="min-w-0"><span className="sr-only">{t("institutions.map.use")} </span>{place.label}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </>
                    ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField id={`${id}-lat`} label={t("institutions.field.latitude")} value={form.latitude} onChange={set("latitude")} optional inputMode="decimal" maxLength={20} error={issueOf("latitude")} />
                  <TextField id={`${id}-lng`} label={t("institutions.field.longitude")} value={form.longitude} onChange={set("longitude")} optional inputMode="decimal" maxLength={20} error={issueOf("longitude")} />
                </div>
                {latitude !== null && longitude !== null && (
                  <div className="flex flex-wrap gap-2">
                    <a href={mapLink(latitude, longitude)} target="_blank" rel="noreferrer"
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-blue-300 hover:bg-white/5 md:min-h-9">
                      <ExternalLink aria-hidden="true" className="h-4 w-4" />{t("institutions.map.check")}<span className="sr-only"> {t("institutions.map.newTab")}</span>
                    </a>
                    <button type="button" onClick={() => setForm((current) => ({ ...current, latitude: "", longitude: "" }))}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-red-300 hover:bg-red-500/10 md:min-h-9">
                      <X aria-hidden="true" className="h-4 w-4" />{t("institutions.map.clear")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </fieldset>
        )}
        <TextField id={`${id}-website`} label={t("institutions.field.website")} value={form.website} onChange={set("website")} optional maxLength={200} type="url" inputMode="url"
          hint={t("institutions.field.websiteHint")} error={issueOf("website")} />

        <fieldset className="min-w-0 rounded-2xl border border-white/10 p-4">
          <legend className="px-1 font-[Poppins] text-sm font-semibold text-zinc-200">{t("institutions.links.title")}<OptionalMark /></legend>
          <p className="font-[Poppins] text-xs text-zinc-400">{t("institutions.links.hint", { max: MAX_LINKS })}</p>
          {issueOf("links") && <p role="alert" className="mt-2 font-[Poppins] text-xs font-medium text-red-300">{issueOf("links")}</p>}
          {form.links.length > 0 && (
            <ul className="mt-3 grid gap-3">
              {form.links.map((link, index) => {
                const problem = issueOf(`links.${index}`);
                return (
                  <li key={index} className="grid gap-2 sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:items-start">
                    <div className="grid gap-1.5 font-[Poppins]">
                      <label htmlFor={`${id}-link-kind-${index}`} className="text-sm font-medium text-zinc-200">{t("institutions.links.kind", { number: index + 1 })}</label>
                      <select id={`${id}-link-kind-${index}`} value={link.kind} onChange={(event) => setLink(index, { kind: event.target.value as LinkKind })} className={cn(fieldClass, "h-11")}>
                        {LINK_KINDS.map((kind) => <option key={kind} value={kind}>{t(`institutions.links.kind.${kind}`)}</option>)}
                      </select>
                    </div>
                    <TextField id={`${id}-link-url-${index}`} label={t("institutions.links.url", { number: index + 1 })} value={link.url} onChange={(value) => setLink(index, { url: value })}
                      maxLength={200} type="url" inputMode="url" hint={t(`institutions.links.example.${link.kind}`)} error={problem} />
                    <button type="button" onClick={() => setForm((current) => ({ ...current, links: current.links.filter((_item, at) => at !== index) }))}
                      aria-label={t("institutions.links.remove", { number: index + 1 })} title={t("institutions.links.remove", { number: index + 1 })}
                      className="inline-flex h-11 w-11 items-center justify-center self-start rounded-lg text-red-300 hover:bg-red-500/10 sm:mt-7">
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {form.links.length < MAX_LINKS && (
            <button type="button" onClick={() => setForm((current) => ({ ...current, links: [...current.links, { kind: current.links.some((item) => item.kind === "instagram") ? "site" : "instagram", url: "" }] }))}
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-3 font-[Poppins] text-sm font-semibold text-white hover:bg-white/10 md:min-h-9">
              <Plus aria-hidden="true" className="h-4 w-4" />{t("institutions.links.add")}
            </button>
          )}
        </fieldset>
        <TextField id={`${id}-about`} label={t("institutions.field.about")} value={form.about} onChange={set("about")} optional multiline maxLength={600}
          hint={t("institutions.field.aboutHint", { count: form.about.length, max: 600 })} error={issueOf("about")} />
        {error && <p role="alert" className="font-[Poppins] text-sm text-red-300">{error}</p>}
      </div>
    </AppModal>
  );
}

const MAX_KB = { logo: 300, cover: 1536 };
/** Size of the original file chosen; the saved image is redrawn smaller (see OUTPUT). */
const ORIGINAL_MAX_MB = 10;
const OUTPUT = { logo: { aspect: 1, width: 400 }, cover: { aspect: 4, width: 1600 } } as const;
type ImageKind = "logo" | "cover";
const readImage = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});

/**
 * Admins: cover (wide image) and profile photo (square logo). After choosing a file (or with the
 * current image) the framing can be adjusted inside the platform; on saving, the framed part is
 * redrawn at a fixed size, which also drops the file's metadata. The server checks type, size and
 * content again. The photo only shows when the owner has it released for the institution.
 */
export function InstitutionImagesModal({ data, components, isOpen, onClose, onSaved }: {
  data: InstitutionData; components: InstitutionComponents; isOpen: boolean; onClose: () => void; onSaved: () => void;
}) {
  useLocale();
  const id = useId();
  const [images, setImages] = useState<{ logo: string | null; cover: string | null }>({ logo: data.logo, cover: data.cover });
  const [framing, setFraming] = useState<Partial<Record<ImageKind, { src: string; crop: Crop }>>>({});
  const [problem, setProblem] = useState<{ logo?: string; cover?: string }>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (isOpen) { setImages({ logo: data.logo, cover: data.cover }); setFraming({}); setProblem({}); setError(""); } }, [isOpen, data]);

  async function choose(kind: ImageKind, file: File | undefined) {
    if (!file) return;
    if (["image/png", "image/jpeg", "image/webp"].indexOf(file.type) === -1) { setProblem((p) => ({ ...p, [kind]: t("institutions.images.type") })); return; }
    if (file.size > ORIGINAL_MAX_MB * 1024 * 1024) { setProblem((p) => ({ ...p, [kind]: t("institutions.images.sizeOriginal", { max: ORIGINAL_MAX_MB }) })); return; }
    const url = await readImage(file);
    try {
      await loadImage(url); // the browser must be able to read it as an image
    } catch {
      setProblem((p) => ({ ...p, [kind]: t("institutions.images.type") }));
      return;
    }
    setProblem((p) => ({ ...p, [kind]: undefined }));
    setFraming((current) => ({ ...current, [kind]: { src: url, crop: CENTERED } }));
  }

  async function save() {
    setSaving(true); setError("");
    try {
      const next = { ...images };
      for (const kind of ["logo", "cover"] as const) {
        const editing = framing[kind];
        if (!editing) continue;
        const rendered = await renderCrop(editing.src, OUTPUT[kind].aspect, editing.crop, OUTPUT[kind].width, MAX_KB[kind] * 1024);
        if (!rendered) { setProblem((p) => ({ ...p, [kind]: t("institutions.images.size", { max: MAX_KB[kind] }) })); return; }
        next[kind] = rendered;
      }
      for (const kind of ["logo", "cover"] as const) if ((kind === "cover" || components.photo) && next[kind] !== data[kind]) await institutionsApi.setImage(data.id, kind, next[kind]);
      onSaved();
      onClose();
    } catch (caught) {
      setError(apiError(caught));
    } finally {
      setSaving(false);
    }
  }

  const slot = (kind: ImageKind) => {
    const editing = framing[kind];
    const button = "inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold";
    return (
      <div className="grid gap-2 font-[Poppins]">
        <label htmlFor={`${id}-${kind}`} className="text-sm font-medium text-zinc-200">{t(`institutions.images.${kind}`)}</label>
        {editing ? (
          <ImageCropper src={editing.src} aspect={OUTPUT[kind].aspect} crop={editing.crop} label={t(`institutions.crop.frame.${kind}`)}
            className={kind === "logo" ? "max-w-[14rem]" : undefined}
            onChange={(crop) => setFraming((current) => ({ ...current, [kind]: { src: editing.src, crop } }))} />
        ) : (
          <div className={cn("overflow-hidden rounded-xl border border-dashed border-white/20 bg-surface-sunken", kind === "cover" ? "aspect-[4/1]" : "aspect-square w-28")}>
            {images[kind]
              ? <img src={imageUrl(images[kind])!} alt={t(`institutions.images.${kind}Preview`)} className="h-full w-full object-cover" />
              : <span className="flex h-full items-center justify-center px-2 text-center text-xs text-zinc-400">{t("institutions.images.none")}</span>}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <input id={`${id}-${kind}`} type="file" accept="image/png,image/jpeg,image/webp" aria-describedby={`${id}-${kind}-hint${problem[kind] ? ` ${id}-${kind}-error` : ""}`}
            onChange={(event) => { void choose(kind, event.target.files?.[0]); event.target.value = ""; }}
            className="max-w-full text-sm text-zinc-300 file:mr-3 file:min-h-10 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:text-sm file:font-semibold file:text-white hover:file:bg-white/15" />
          {!editing && images[kind] && (
            <button type="button" onClick={() => setFraming((current) => ({ ...current, [kind]: { src: imageUrl(images[kind])!, crop: CENTERED } }))}
              className={cn(button, "text-blue-300 hover:bg-white/5")}>{t("institutions.crop.adjust")}</button>
          )}
          {editing && (
            <button type="button" onClick={() => setFraming((current) => ({ ...current, [kind]: undefined }))}
              className={cn(button, "text-zinc-300 hover:bg-white/5")}>{t("institutions.crop.cancel")}</button>
          )}
          {(images[kind] || editing) && (
            <button type="button" onClick={() => { setImages((current) => ({ ...current, [kind]: null })); setFraming((current) => ({ ...current, [kind]: undefined })); }}
              className={cn(button, "text-red-300 hover:bg-red-500/10")}>{t("institutions.images.remove")}</button>
          )}
        </div>
        <p id={`${id}-${kind}-hint`} className="text-xs text-zinc-400">{t(`institutions.images.${kind}Hint`, { max: ORIGINAL_MAX_MB })}</p>
        {problem[kind] && <p id={`${id}-${kind}-error`} role="alert" className="text-xs font-medium text-red-300">{problem[kind]}</p>}
      </div>
    );
  };

  return (
    <AppModal isOpen={isOpen} type="update" size="lg" title={t(components.photo ? "institutions.images.title" : "institutions.images.titleCover")}
      description={t(components.photo ? "institutions.images.description" : "institutions.images.descriptionCover")}
      acceptLabel={saving ? t("institutions.saving") : t("institutions.save")} disabled={saving} onConfirm={save} onCancel={onClose} onClose={onClose}>
      <div className="grid gap-5">
        {components.photo && slot("logo")}
        {slot("cover")}
        {error && <p role="alert" className="font-[Poppins] text-sm text-red-300">{error}</p>}
      </div>
    </AppModal>
  );
}
