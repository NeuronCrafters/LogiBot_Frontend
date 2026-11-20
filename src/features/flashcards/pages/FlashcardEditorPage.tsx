import { useEffect, useId, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowLeft, ArrowUp, Import, Layers, Plus, Trash2 } from "lucide-react";
import { getLanguage, t, useLocale, type Language } from "@/i18n";
import { ContentLanguageSelect } from "@/i18n/ContentLanguage";
import { PageHeader, Panel } from "@/components/AppUI";
import { AppModal } from "@/shared/components/feedback/AppModal";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { apiError } from "@/shared/lib/apiError";
import { cn } from "@/shared/lib/cn";
import { toast } from "@/shared/lib/toast";
import { useManagedDisciplines } from "@/features/questions/hooks/useManagedDisciplines";
import { fieldClass, TextField } from "@/features/institutions/components/TextField";
import { fieldIssueMessage } from "@/features/institutions/lib/institutionLabels";
import { flashcardsApi, type CardDraft, type DeckForm, type FieldIssue } from "@/features/flashcards/api/flashcardsApi";
import { isStudentOnly } from "@/features/flashcards/lib/roles";

const MAX_CARDS = 200;
const emptyCard = (): CardDraft => ({ front: "", back: "", concept: null });
const iconButton = "inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 text-zinc-300 hover:bg-white/10 disabled:opacity-40 md:h-9 md:w-9";

/** Staff: title, subject, language, publication and the cards (typed or brought from quiz questions of the bank). */
export function FlashcardEditorPage() {
  useLocale();
  const id = useId();
  const { deckId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth() ?? {};
  const { disciplines } = useManagedDisciplines();
  const staff = !!user && !isStudentOnly(user.role);
  const existing = useQuery({ queryKey: ["flashcardDeck", deckId], queryFn: () => flashcardsApi.deck(deckId!), enabled: !!deckId && staff });
  const [form, setForm] = useState<DeckForm>({ disciplineId: "", title: "", description: "", language: getLanguage(), published: false, cards: [emptyCard()] });
  const [issues, setIssues] = useState<FieldIssue[]>([]);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [chosen, setChosen] = useState<string[]>([]);
  const lastFront = useRef<HTMLLIElement>(null);
  const [focusNew, setFocusNew] = useState(false);

  useEffect(() => {
    const deck = existing.data;
    if (deck) setForm({ disciplineId: deck.disciplineId, title: deck.title, description: deck.description ?? "", language: deck.language, published: deck.published, cards: deck.cards });
  }, [existing.data]);
  useEffect(() => { if (!form.disciplineId && disciplines.length === 1) setForm((current) => ({ ...current, disciplineId: disciplines[0].id })); }, [disciplines, form.disciplineId]);
  useEffect(() => { if (focusNew) { lastFront.current?.querySelector("textarea")?.focus(); setFocusNew(false); } }, [focusNew]);
  const candidates = useQuery({ queryKey: ["flashcardCandidates", form.disciplineId], queryFn: () => flashcardsApi.candidates(form.disciplineId), enabled: importing && !!form.disciplineId });

  if (user && !staff) return <Navigate to="/flashcards" replace />;

  const issueOf = (field: string) => { const issue = issues.find((item) => item.field === field); return issue ? fieldIssueMessage(issue) : undefined; };
  const setCard = (index: number, change: Partial<CardDraft>) => setForm((current) => ({ ...current, cards: current.cards.map((card, at) => (at === index ? { ...card, ...change } : card)) }));
  const move = (index: number, step: number) => setForm((current) => {
    const cards = current.cards.slice();
    const [card] = cards.splice(index, 1);
    cards.splice(index + step, 0, card);
    return { ...current, cards };
  });
  const already = form.cards.map((card) => card.sourceQuestionId).filter(Boolean);
  const available = (candidates.data ?? []).filter((item) => already.indexOf(item.id) === -1);

  async function save() {
    setSaving(true); setIssues([]);
    try {
      const cards = form.cards.filter((card) => card.front.trim() || card.back.trim());
      await flashcardsApi.save(deckId ?? null, { ...form, cards });
      toast.success(t("flashcards.manage.saved"));
      void queryClient.invalidateQueries({ queryKey: ["flashcardDecks"] });
      void queryClient.invalidateQueries({ queryKey: ["flashcardDeck", deckId] });
      navigate("/flashcards/manage");
    } catch (caught) {
      const fields = (caught as { response?: { data?: { issues?: FieldIssue[] } } }).response?.data?.issues;
      if (fields?.length) { setIssues(fields); toast.error(t("flashcards.manage.checkFields")); } else toast.error(apiError(caught));
    } finally {
      setSaving(false);
    }
  }

  function addChosen() {
    const picked = available.filter((item) => chosen.indexOf(item.id) !== -1).map((item) => ({ front: item.front, back: item.back, concept: item.concept, sourceQuestionId: item.id }));
    setForm((current) => ({ ...current, cards: [...current.cards.filter((card) => card.front.trim() || card.back.trim()), ...picked].slice(0, MAX_CARDS) }));
    setImporting(false); setChosen([]);
    toast.success(t("flashcards.manage.imported", { count: picked.length }));
  }

  return (
    <main className="relative flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-4xl space-y-5 font-[Poppins]">
        <Link to="/flashcards/manage" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-blue-300 hover:bg-white/5 md:min-h-9">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />{t("flashcards.manage.backToList")}
        </Link>
        <PageHeader icon={<Layers aria-hidden="true" className="h-5 w-5" />} title={deckId ? t("flashcards.manage.editTitle") : t("flashcards.manage.newTitle")} description={t("flashcards.manage.editorDescription")} />
        {existing.isError && <p role="alert" className="text-sm text-red-300">{apiError(existing.error)}</p>}

        <form onSubmit={(event) => { event.preventDefault(); void save(); }} className="space-y-5" noValidate>
          <Panel className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField id={`${id}-title`} label={t("flashcards.manage.fieldTitle")} value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} maxLength={120} error={issueOf("title")} />
              <TextField id={`${id}-discipline`} label={t("flashcards.manage.fieldDiscipline")} value={form.disciplineId} error={issueOf("disciplineId")}>
                <select id={`${id}-discipline`} value={form.disciplineId} onChange={(event) => setForm((current) => ({ ...current, disciplineId: event.target.value }))} className={cn(fieldClass, "h-11")}
                  aria-invalid={issueOf("disciplineId") ? true : undefined}>
                  <option value="">{t("common.selecione")}</option>
                  {disciplines.map((discipline) => <option key={discipline.id} value={discipline.id}>{discipline.name}</option>)}
                </select>
              </TextField>
            </div>
            <TextField id={`${id}-description`} label={t("flashcards.manage.fieldDescription")} value={form.description} onChange={(value) => setForm((current) => ({ ...current, description: value }))}
              optional multiline maxLength={400} error={issueOf("description")} />
            <div className="grid gap-4 md:grid-cols-2 md:items-end">
              <ContentLanguageSelect value={form.language as Language} onChange={(language) => setForm((current) => ({ ...current, language }))} />
              <label className="flex min-h-11 items-center gap-3 rounded-xl border border-white/10 px-3 text-sm text-zinc-200">
                <input type="checkbox" checked={form.published} onChange={(event) => setForm((current) => ({ ...current, published: event.target.checked }))} className="h-5 w-5 accent-blue-500" />
                <span>{t("flashcards.manage.publish")}<span className="block text-xs text-zinc-400">{t("flashcards.manage.publishHint")}</span></span>
              </label>
            </div>
          </Panel>

          <section aria-labelledby={`${id}-cards`} className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 id={`${id}-cards`} className="text-lg font-semibold text-white">{t("flashcards.manage.cardsTitle")}</h2>
                <p className="text-xs text-zinc-400">{t("flashcards.manage.cardsCount", { count: form.cards.length, max: MAX_CARDS })}</p>
              </div>
              <button type="button" onClick={() => setImporting(true)} disabled={!form.disciplineId}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-3 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50 md:min-h-9">
                <Import aria-hidden="true" className="h-4 w-4" />{t("flashcards.manage.importButton")}
              </button>
            </div>
            {issueOf("cards") && <p role="alert" className="text-sm font-medium text-red-300">{issueOf("cards")}</p>}
            <ol className="space-y-3">
              {form.cards.map((card, index) => (
                <li key={card.id ?? `new-${index}`} ref={index === form.cards.length - 1 ? lastFront : undefined}>
                  <fieldset className="min-w-0 rounded-2xl border border-white/10 bg-surface p-4">
                    <legend className="px-1 text-sm font-semibold text-zinc-200">{t("flashcards.manage.cardLabel", { number: index + 1 })}</legend>
                    <div className="grid gap-3 md:grid-cols-2">
                      <TextField id={`${id}-front-${index}`} label={t("flashcards.manage.frontSide")} value={card.front} onChange={(value) => setCard(index, { front: value })}
                        multiline maxLength={500} error={issueOf(`cards.${index}.front`)} />
                      <TextField id={`${id}-back-${index}`} label={t("flashcards.manage.backSide")} value={card.back} onChange={(value) => setCard(index, { back: value })}
                        multiline maxLength={1000} error={issueOf(`cards.${index}.back`)} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                      <div className="w-full max-w-xs">
                        <TextField id={`${id}-concept-${index}`} label={t("flashcards.manage.concept")} value={card.concept ?? ""} onChange={(value) => setCard(index, { concept: value || null })}
                          optional maxLength={40} error={issueOf(`cards.${index}.concept`)} />
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={t("flashcards.manage.moveUp", { number: index + 1 })} className={iconButton}><ArrowUp aria-hidden="true" className="h-4 w-4" /></button>
                        <button type="button" onClick={() => move(index, 1)} disabled={index === form.cards.length - 1} aria-label={t("flashcards.manage.moveDown", { number: index + 1 })} className={iconButton}><ArrowDown aria-hidden="true" className="h-4 w-4" /></button>
                        <button type="button" onClick={() => setForm((current) => ({ ...current, cards: current.cards.filter((_card, at) => at !== index) }))} aria-label={t("flashcards.manage.removeCard", { number: index + 1 })}
                          className={cn(iconButton, "text-red-300")}><Trash2 aria-hidden="true" className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </fieldset>
                </li>
              ))}
            </ol>
            {form.cards.length < MAX_CARDS && (
              <button type="button" onClick={() => { setForm((current) => ({ ...current, cards: [...current.cards, emptyCard()] })); setFocusNew(true); }}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 text-sm font-semibold text-zinc-200 hover:bg-white/5">
                <Plus aria-hidden="true" className="h-4 w-4" />{t("flashcards.manage.addCard")}
              </button>
            )}
          </section>

          <div className="flex flex-wrap justify-end gap-2">
            <Link to="/flashcards/manage" className="inline-flex min-h-11 items-center rounded-xl border border-white/15 px-4 text-sm font-semibold text-white hover:bg-white/10">{t("common.cancelar")}</Link>
            <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-on-accent hover:bg-blue-700 disabled:opacity-60">
              {saving ? t("institutions.saving") : t("institutions.save")}
            </button>
          </div>
        </form>
      </div>

      <AppModal isOpen={importing} type="create" title={t("flashcards.manage.importTitle")} description={t("flashcards.manage.importDescription")}
        acceptLabel={t("flashcards.manage.importConfirm", { count: chosen.length })} confirmDisabled={!chosen.length}
        onConfirm={addChosen} onCancel={() => setImporting(false)} onClose={() => setImporting(false)}>
        {candidates.isLoading ? (
          <p role="status" className="font-[Poppins] text-sm text-zinc-400">{t("common.carregandoDados")}</p>
        ) : !available.length ? (
          <p className="font-[Poppins] text-sm text-zinc-400">{t("flashcards.manage.importEmpty")}</p>
        ) : (
          <fieldset className="grid max-h-[50vh] gap-2 overflow-y-auto font-[Poppins]">
            <legend className="sr-only">{t("flashcards.manage.importTitle")}</legend>
            {available.map((item) => (
              <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 p-3 text-sm hover:bg-white/5">
                <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-blue-500" checked={chosen.indexOf(item.id) !== -1}
                  onChange={(event) => setChosen((current) => (event.target.checked ? [...current, item.id] : current.filter((value) => value !== item.id)))} />
                <span className="min-w-0"><span className="block font-semibold text-white">{item.front}</span><span className="block text-zinc-400">{item.back}</span></span>
              </label>
            ))}
          </fieldset>
        )}
      </AppModal>
    </main>
  );
}
