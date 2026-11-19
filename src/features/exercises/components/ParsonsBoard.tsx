import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowLeftRight, ArrowUp, Ban, Check, GripVertical, Indent, Outdent, X } from "lucide-react";
import { t, useLocale, type MessageKey } from "@/i18n";
import { AppButton } from "@/components/AppUI";
import { cn } from "@/shared/lib/cn";
import { useReducedMotion } from "@/shared/preferences";
import { MAX_PARSONS_INDENT, type ParsonsLineMark, type ParsonsPlacement } from "@/shared/logic/parsonsCore";
import type { PracticeEvent } from "@/features/exercises/types";

type ListName = "bank" | "solution";
export interface ParsonsBoardValue { bank: string[]; solution: ParsonsPlacement[] }
type Board = ParsonsBoardValue;

/** Indentation step in pixels (fixed, so text-size preferences do not change the drop math). */
export const INDENT_PX = 24;
const LIST_PADDING_PX = 8;

const markStyle: Record<ParsonsLineMark, string> = {
  correct: "border-emerald-400/70 bg-emerald-500/10",
  misplaced: "border-red-400/70 bg-red-500/10",
  wrong_indent: "border-amber-400/70 bg-amber-500/10",
  distractor: "border-red-400/70 bg-red-500/10",
};

function MarkIcon({ mark }: { mark?: ParsonsLineMark }) {
  if (mark === "correct") return <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-emerald-300" />;
  if (mark === "wrong_indent") return <Indent aria-hidden="true" className="h-4 w-4 shrink-0 text-amber-300" />;
  if (mark === "distractor") return <Ban aria-hidden="true" className="h-4 w-4 shrink-0 text-red-300" />;
  if (mark === "misplaced") return <X aria-hidden="true" className="h-4 w-4 shrink-0 text-red-300" />;
  return null;
}

interface LineProps {
  id: string;
  text: string;
  list: ListName;
  indent: number;
  label: string;
  selected: boolean;
  mark?: ParsonsLineMark;
  reduceMotion: boolean;
  register: (id: string, element: HTMLButtonElement | null) => void;
  onActivate: (id: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>, id: string) => void;
}

function SortableLine({ id, text, list, indent, label, selected, mark, reduceMotion, register, onActivate, onKeyDown }: LineProps) {
  const { setNodeRef, listeners, transform, transition, isDragging } = useSortable({
    id,
    data: { list },
    transition: reduceMotion ? null : undefined,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition: transition ?? undefined, marginLeft: list === "solution" ? indent * INDENT_PX : undefined }}
      className={cn("relative", isDragging && "opacity-40")}
    >
      <button
        ref={(element) => register(id, element)}
        type="button"
        {...listeners}
        aria-pressed={selected}
        aria-label={label}
        onClick={() => onActivate(id)}
        onKeyDown={(event) => onKeyDown(event, id)}
        className={cn(
          "flex min-h-[2.75rem] w-full touch-manipulation select-none items-center gap-2 rounded-lg border px-3 py-2 text-left font-mono text-sm text-white transition-colors",
          mark ? markStyle[mark] : "border-white/10 bg-neutral-950/60 hover:bg-white/10",
          selected && "outline outline-2 outline-offset-2 outline-blue-400",
        )}
      >
        <GripVertical aria-hidden="true" className="h-4 w-4 shrink-0 text-zinc-500" />
        <span className="min-w-0 flex-1 break-words">{text}</span>
        <MarkIcon mark={mark} />
      </button>
    </li>
  );
}

function DropList({ id, labelledBy, empty, children, listRef }: {
  id: ListName; labelledBy: string; empty: string | null; children: ReactNode; listRef?: (element: HTMLOListElement | null) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <ol
      ref={(element) => { setNodeRef(element); listRef?.(element); }}
      aria-labelledby={labelledBy}
      className={cn("min-h-[7rem] space-y-2 rounded-xl border-2 border-dashed p-2 transition-colors", isOver ? "border-blue-400/70 bg-blue-500/5" : "border-white/15")}
    >
      {children}
      {empty && <li className="px-2 py-3 font-[Poppins] text-sm text-zinc-400">{empty}</li>}
    </ol>
  );
}

interface ParsonsBoardProps {
  lines: Array<{ id: string; text: string }>;
  /** Initial arrangement; change the component `key` to start over. */
  initial: ParsonsBoardValue;
  /** Feedback marks (workbench only; exams never show them). */
  marks?: Record<string, ParsonsLineMark>;
  onChange: (value: ParsonsBoardValue) => void;
  onEvent?: (event: Omit<PracticeEvent, "t">) => void;
}

/**
 * Parsons board shared by the workbench and exams: drag with mouse or touch, or select
 * a line and use the toolbar or the keyboard. Every move is announced.
 */
export function ParsonsBoard({ lines, initial, marks = {}, onChange, onEvent }: ParsonsBoardProps) {
  useLocale();
  const reduceMotion = useReducedMotion();
  const baseId = useId();
  const id = (suffix: string) => `${baseId}-${suffix}`;
  const [board, setBoard] = useState<Board>(initial);
  const [selected, setSelected] = useState<string | null>(null);

  const [announcement, setAnnouncement] = useState({ text: "", n: 0 });
  const [activeId, setActiveId] = useState<string | null>(null);

  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocus = useRef<string | null>(null);
  const solutionList = useRef<HTMLOListElement | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    if (!pendingFocus.current) return;
    buttons.current.get(pendingFocus.current)?.focus();
    pendingFocus.current = null;
  });

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );
  const lineText = useMemo(() => {
    const map: Record<string, string> = {};
    lines.forEach((line) => { map[line.id] = line.text; });
    return map;
  }, [lines]);

  const listName = (list: ListName) => t(list === "bank" ? "exercises.parsons.bankTitle" : "exercises.parsons.solutionTitle");
  const where = (lineId: string, state: Board = board): ListName => (state.bank.indexOf(lineId) !== -1 ? "bank" : "solution");
  const announce = (text: string) => setAnnouncement((current) => ({ text, n: current.n + 1 }));

  function lineLabel(lineId: string, list: ListName, indent: number) {
    const label = list === "solution" ? t("exercises.parsons.lineIndent", { text: lineText[lineId], indent }) : lineText[lineId];
    const mark = marks[lineId];
    return mark ? t("exercises.parsons.lineMarked", { label, mark: t(`exercises.parsons.mark.${mark}` as MessageKey) }) : label;
  }

  /** Applies a board change, clears stale feedback and logs/announces it. */
  function commit(next: Board, lineId: string, via: "drag" | "button" | "keyboard", from: ListName, focus: boolean) {
    const to = where(lineId, next);
    const position = to === "bank" ? next.bank.indexOf(lineId) : next.solution.findIndex((item) => item.id === lineId);
    const indent = to === "solution" ? next.solution[position].indent : 0;
    setBoard(next);
    onChange(next);
    if (focus) pendingFocus.current = lineId;
    onEvent?.({ action: "move", line: lineId, from, to, position, indent, via });
    // Drags are announced by the drag-and-drop live region; avoid saying it twice.
    if (via !== "drag") announce(t("exercises.parsons.announceMoved", { line: lineText[lineId], list: listName(to), position: position + 1 }));
  }

  function moveToOther(lineId: string, via: "button" | "keyboard", focus = true) {
    const from = where(lineId);
    const next: Board = from === "bank"
      ? { bank: board.bank.filter((item) => item !== lineId), solution: [...board.solution, { id: lineId, indent: 0 }] }
      : { bank: [...board.bank, lineId], solution: board.solution.filter((item) => item.id !== lineId) };
    commit(next, lineId, via, from, focus);
  }

  function moveBy(lineId: string, step: number, via: "button" | "keyboard", focus = true) {
    const from = where(lineId);
    if (from === "bank") {
      const index = board.bank.indexOf(lineId);
      const target = index + step;
      if (target < 0 || target >= board.bank.length) return;
      commit({ ...board, bank: arrayMove(board.bank, index, target) }, lineId, via, from, focus);
    } else {
      const index = board.solution.findIndex((item) => item.id === lineId);
      const target = index + step;
      if (target < 0 || target >= board.solution.length) return;
      commit({ ...board, solution: arrayMove(board.solution, index, target) }, lineId, via, from, focus);
    }
  }

  function changeIndent(lineId: string, step: number, via: "drag" | "button" | "keyboard") {
    const index = board.solution.findIndex((item) => item.id === lineId);
    if (index === -1) return;
    const indent = Math.max(0, Math.min(MAX_PARSONS_INDENT, board.solution[index].indent + step));
    if (indent === board.solution[index].indent) return;
    const solution = board.solution.slice();
    solution[index] = { id: lineId, indent };
    const next = { ...board, solution };
    setBoard(next);
    onChange(next);
    onEvent?.({ action: "indent", line: lineId, indent, via });
    announce(t("exercises.parsons.announceIndent", { line: lineText[lineId], indent }));
  }

  function activate(lineId: string) {
    if (suppressClick.current) return;
    const next = selected === lineId ? null : lineId;
    setSelected(next);
    if (next) {
      onEvent?.({ action: "select", line: lineId, via: "button" });
      announce(t("exercises.parsons.announceSelected", { line: lineText[lineId] }));
    }
  }

  function onLineKeyDown(event: KeyboardEvent<HTMLButtonElement>, lineId: string) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "Escape") { setSelected(null); return; }
    if (selected !== lineId) return;
    const actions: Record<string, () => void> = {
      ArrowUp: () => moveBy(lineId, -1, "keyboard"),
      ArrowDown: () => moveBy(lineId, 1, "keyboard"),
      ArrowLeft: () => changeIndent(lineId, -1, "keyboard"),
      ArrowRight: () => changeIndent(lineId, 1, "keyboard"),
      m: () => moveToOther(lineId, "keyboard"),
      M: () => moveToOther(lineId, "keyboard"),
      Delete: () => { if (where(lineId) === "solution") moveToOther(lineId, "keyboard"); },
      Backspace: () => { if (where(lineId) === "solution") moveToOther(lineId, "keyboard"); },
    };
    const action = actions[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  }

  /* ── Drag and drop (pointer and touch; keyboard users have the controls above) ── */

  const listOf = (identifier: UniqueIdentifier | undefined, state: Board): ListName | null => {
    if (identifier === "bank" || identifier === "solution") return identifier;
    if (typeof identifier !== "string") return null;
    if (state.bank.indexOf(identifier) !== -1) return "bank";
    if (state.solution.some((item) => item.id === identifier)) return "solution";
    return null;
  };
  const dragOrigin = useRef<ListName>("bank");

  function onDragStart(event: DragStartEvent) {
    const lineId = String(event.active.id);
    setActiveId(lineId);
    dragOrigin.current = where(lineId);
    suppressClick.current = true;
  }

  function onDragOver(event: DragOverEvent) {
    const lineId = String(event.active.id);
    setBoard((state) => {
      const from = listOf(lineId, state);
      const to = listOf(event.over?.id, state);
      if (!from || !to || from === to) return state;
      const overIndex = to === "bank" ? state.bank.indexOf(String(event.over?.id)) : state.solution.findIndex((item) => item.id === event.over?.id);
      if (to === "solution") {
        const solution = state.solution.slice();
        solution.splice(overIndex === -1 ? solution.length : overIndex, 0, { id: lineId, indent: 0 });
        return { bank: state.bank.filter((item) => item !== lineId), solution };
      }
      const bank = state.bank.slice();
      bank.splice(overIndex === -1 ? bank.length : overIndex, 0, lineId);
      return { bank, solution: state.solution.filter((item) => item.id !== lineId) };
    });
  }

  function onDragEnd(event: DragEndEvent) {
    const lineId = String(event.active.id);
    setActiveId(null);
    window.setTimeout(() => { suppressClick.current = false; }, 0);
    const list = listOf(lineId, board);
    if (!list) return;
    let next = board;
    const overId = event.over ? String(event.over.id) : null;
    if (list === "bank") {
      const from = board.bank.indexOf(lineId);
      const to = overId ? board.bank.indexOf(overId) : -1;
      if (to !== -1 && to !== from) next = { ...board, bank: arrayMove(board.bank, from, to) };
    } else {
      const from = board.solution.findIndex((item) => item.id === lineId);
      const to = overId ? board.solution.findIndex((item) => item.id === overId) : -1;
      let solution = to !== -1 && to !== from ? arrayMove(board.solution, from, to) : board.solution.slice();
      // Horizontal drop position sets the indentation.
      const dropped = event.active.rect.current.translated;
      const container = solutionList.current?.getBoundingClientRect();
      if (dropped && container) {
        const indent = Math.max(0, Math.min(MAX_PARSONS_INDENT, Math.round((dropped.left - container.left - LIST_PADDING_PX) / INDENT_PX)));
        const index = solution.findIndex((item) => item.id === lineId);
        solution = solution.map((item, i) => (i === index ? { id: item.id, indent } : item));
      }
      next = { ...board, solution };
    }
    commit(next, lineId, "drag", dragOrigin.current, false);
  }

  function onDragCancel() {
    setActiveId(null);
    window.setTimeout(() => { suppressClick.current = false; }, 0);
  }

  const announcements: Announcements = {
    onDragStart: ({ active }) => t("exercises.parsons.dndPickedUp", { line: lineText[String(active.id)] }),
    onDragOver: () => undefined,
    onDragEnd: ({ active }) => t("exercises.parsons.dndDropped", { line: lineText[String(active.id)] }),
    onDragCancel: () => t("exercises.parsons.dndCancelled"),
  };

  const register = (lineId: string, element: HTMLButtonElement | null) => {
    if (element) buttons.current.set(lineId, element);
    else buttons.current.delete(lineId);
  };
  const selectedList = selected ? where(selected) : null;
  const selectedIndex = selected
    ? selectedList === "bank" ? board.bank.indexOf(selected) : board.solution.findIndex((item) => item.id === selected)
    : -1;
  const selectedLength = selectedList === "bank" ? board.bank.length : board.solution.length;
  const selectedIndent = selected && selectedList === "solution" ? board.solution[selectedIndex].indent : 0;


  const lineProps = (lineId: string, list: ListName, indent: number) => ({
    id: lineId, text: lineText[lineId], list, indent, label: lineLabel(lineId, list, indent),
    selected: selected === lineId, mark: marks[lineId], reduceMotion, register, onActivate: activate, onKeyDown: onLineKeyDown,
  });

  return (
    <div className="space-y-4">
      <p id={id("help")} className="font-[Poppins] text-xs leading-relaxed text-zinc-400">{t("exercises.parsons.keyboardHelp")}</p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
        accessibility={{ announcements, screenReaderInstructions: { draggable: t("exercises.parsons.keyboardHelp") } }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <section>
            <h3 id={id("bank")} className="mb-2 font-[Poppins] text-sm font-semibold text-white">{t("exercises.parsons.bankTitle")}</h3>
            <SortableContext id="bank" items={board.bank} strategy={verticalListSortingStrategy}>
              <DropList id="bank" labelledBy={id("bank")} empty={board.bank.length === 0 ? t("exercises.parsons.bankEmpty") : null}>
                {board.bank.map((lineId) => <SortableLine key={lineId} {...lineProps(lineId, "bank", 0)} />)}
              </DropList>
            </SortableContext>
          </section>
          <section>
            <h3 id={id("solution")} className="mb-2 font-[Poppins] text-sm font-semibold text-white">{t("exercises.parsons.solutionTitle")}</h3>
            <SortableContext id="solution" items={board.solution.map((item) => item.id)} strategy={verticalListSortingStrategy}>
              <DropList
                id="solution"
                labelledBy={id("solution")}
                listRef={(element) => { solutionList.current = element; }}
                empty={board.solution.length === 0 ? t("exercises.parsons.solutionEmpty") : null}
              >
                {board.solution.map((item) => <SortableLine key={item.id} {...lineProps(item.id, "solution", item.indent)} />)}
              </DropList>
            </SortableContext>
          </section>
        </div>
        <DragOverlay dropAnimation={reduceMotion ? null : undefined}>
          {activeId ? (
            <div className="flex min-h-[2.75rem] items-center gap-2 rounded-lg border border-blue-400/60 bg-surface-raised px-3 py-2 font-mono text-sm text-white shadow-xl">
              <GripVertical aria-hidden="true" className="h-4 w-4 shrink-0 text-zinc-400" />
              <span className="min-w-0 flex-1 break-words">{lineText[activeId]}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <div
        role="group"
        aria-label={t("exercises.parsons.toolbarLabel")}
        className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-surface-sunken p-2"
      >
        <AppButton type="button" size="sm" variant="secondary" className="h-11 md:h-9" disabled={!selected} onClick={() => selected && moveToOther(selected, "button", false)}>
          <ArrowLeftRight aria-hidden="true" className="h-4 w-4" />
          {selectedList === "solution" ? t("exercises.parsons.moveToBank") : t("exercises.parsons.moveToSolution")}
        </AppButton>
        <AppButton type="button" size="sm" variant="secondary" className="h-11 md:h-9" disabled={!selected || selectedIndex <= 0} onClick={() => selected && moveBy(selected, -1, "button", false)}>
          <ArrowUp aria-hidden="true" className="h-4 w-4" />
          {t("exercises.parsons.moveUp")}
        </AppButton>
        <AppButton type="button" size="sm" variant="secondary" className="h-11 md:h-9" disabled={!selected || selectedIndex >= selectedLength - 1} onClick={() => selected && moveBy(selected, 1, "button", false)}>
          <ArrowDown aria-hidden="true" className="h-4 w-4" />
          {t("exercises.parsons.moveDown")}
        </AppButton>
        <AppButton type="button" size="sm" variant="secondary" className="h-11 md:h-9" disabled={selectedList !== "solution" || selectedIndent <= 0} onClick={() => selected && changeIndent(selected, -1, "button")}>
          <Outdent aria-hidden="true" className="h-4 w-4" />
          {t("exercises.parsons.indentLess")}
        </AppButton>
        <AppButton type="button" size="sm" variant="secondary" className="h-11 md:h-9" disabled={selectedList !== "solution" || selectedIndent >= MAX_PARSONS_INDENT} onClick={() => selected && changeIndent(selected, 1, "button")}>
          <Indent aria-hidden="true" className="h-4 w-4" />
          {t("exercises.parsons.indentMore")}
        </AppButton>
      </div>

      <p key={announcement.n} role="status" aria-live="polite" className="sr-only">{announcement.text}</p>
    </div>
  );
}
