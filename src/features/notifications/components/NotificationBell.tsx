import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, X } from "lucide-react";
import { date, t, useLocale, type MessageKey } from "@/i18n";
import { cn } from "@/shared/lib/cn";
import { useDialogFocus } from "@/shared/hooks/useDialogFocus";
import { useFloatingPosition } from "@/shared/hooks/useFloatingPosition";
import { useNotificationPreferences, useNotifications } from "@/features/notifications/hooks/useNotifications";
import { useFeatures } from "@/features/release/hooks/useFeatures";
import type { AppNotification } from "@/features/notifications/types";

const KNOWN_TYPES = ["quiz_published", "quiz_completion_progress", "exam_published", "exam_submission_progress", "exam_results_released"];

function notificationText(item: AppNotification): string {
  return t(`notifications.type.${item.type}` as MessageKey, item.params);
}

/** Bell with unread badge and a panel listing the person's notifications. */
export function NotificationBell({ className }: { className?: string }) {
  useLocale();
  const baseId = useId();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useDialogFocus<HTMLDivElement>(open, () => setOpen(false));
  const position = useFloatingPosition(open, trigger, panel);
  const { list, markRead, markAllRead } = useNotifications();
  const { preferences, save } = useNotificationPreferences(open);
  // Shown value changes on the click itself; it falls back to the saved value on error.
  const [emailChoice, setEmailChoice] = useState<boolean | null>(null);
  const emailReleased = useFeatures().isEnabled("notifications_email");
  const emailChecked = emailChoice ?? preferences.data?.emailEnabled ?? false;

  const items = (list.data?.items ?? []).filter((item) => KNOWN_TYPES.indexOf(item.type) !== -1);
  const unread = list.data?.unreadCount ?? 0;

  // Polite announcement when new notifications arrive (not on the first load).
  const previousUnread = useRef<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => {
    if (!list.isSuccess) return;
    if (previousUnread.current !== null && unread > previousUnread.current) setAnnouncement(t("notifications.newAnnouncement", { count: unread }));
    previousUnread.current = unread;
  }, [unread, list.isSuccess]);

  // The panel starts hidden until it is positioned, and hidden elements cannot take
  // focus: move focus inside once it is visible (Escape and Tab then work in it).
  useEffect(() => {
    if (!open || position.visibility !== "visible") return;
    const root = panel.current;
    if (root && !root.contains(document.activeElement)) {
      root.querySelector<HTMLElement>("button:not([disabled]), a[href], input:not([disabled])")?.focus();
    }
  }, [open, position.visibility, panel]);

  // Clicking outside closes the panel.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panel.current?.contains(target) || trigger.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open, panel]);

  const label = unread > 0 ? t("notifications.bellUnread", { count: unread }) : t("notifications.bell");
  const titleId = `${baseId}-title`;

  return (
    <div className={cn("relative", className)}>
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={open ? `${baseId}-panel` : undefined}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-white md:h-9 md:w-9"
      >
        <Bell aria-hidden="true" className="h-5 w-5" />
        <span className="sr-only">{label}</span>
        {unread > 0 && (
          <span aria-hidden="true" className="absolute right-1 top-1 inline-flex min-w-[1.125rem] items-center justify-center rounded-full bg-red-600 px-1 font-[Poppins] text-[0.6875rem] font-bold leading-[1.125rem] text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {/* Live region without role="status", so it does not compete with the page's own status messages. */}
      <p aria-live="polite" aria-atomic="true" className="sr-only">{announcement}</p>

      {open && createPortal(
        <div
          ref={panel}
          id={`${baseId}-panel`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          style={{ position: "fixed", left: position.left, top: position.top, visibility: position.visibility }}
          className="z-50 flex max-h-[min(32rem,calc(100dvh-2rem))] w-[min(22rem,calc(100vw-2rem))] flex-col rounded-2xl border border-white/10 bg-surface font-[Poppins] shadow-2xl shadow-black/40"
        >
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <h2 id={titleId} className="flex-1 text-sm font-semibold text-white">{t("notifications.title")}</h2>
            <button
              type="button"
              disabled={unread === 0}
              onClick={() => markAllRead.mutate()}
              className="inline-flex min-h-[2.75rem] items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-blue-300 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:text-zinc-500 md:min-h-[2rem]"
            >
              <CheckCheck aria-hidden="true" className="h-4 w-4" />
              {t("notifications.markAllRead")}
            </button>
            <button
              type="button"
              aria-label={t("notifications.close")}
              onClick={() => { setOpen(false); trigger.current?.focus(); }}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white md:h-8 md:w-8"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {list.isError && !list.data ? (
              <p role="alert" className="px-4 py-6 text-sm text-red-300">{t("notifications.loadError")}</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-sm text-zinc-400">{t("notifications.empty")}</p>
            ) : (
              <ul className="divide-y divide-white/5">
                {items.map((item) => {
                  const text = notificationText(item);
                  const isUnread = !item.readAt;
                  const content = (
                    <>
                      <span aria-hidden="true" className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", isUnread ? "bg-blue-400" : "bg-transparent")} />
                      <span className="min-w-0 flex-1">
                        <span className={cn("block break-words text-sm leading-snug", isUnread ? "font-semibold text-white" : "text-zinc-300")}>{text}</span>
                        <span className="mt-1 block text-xs text-zinc-400">
                          {date(item.updatedAt, { dateStyle: "short", timeStyle: "short" })}
                          {isUnread && <span className="sr-only">{`, ${t("notifications.unread")}`}</span>}
                        </span>
                      </span>
                    </>
                  );
                  const rowClass = "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5";
                  return (
                    <li key={item.id}>
                      {item.link ? (
                        <Link to={item.link} className={rowClass} onClick={() => { if (isUnread) markRead.mutate(item.id); setOpen(false); }}>
                          {content}
                        </Link>
                      ) : (
                        <button type="button" className={rowClass} onClick={() => { if (isUnread) markRead.mutate(item.id); }}>
                          {content}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {emailReleased && <div className="border-t border-white/10 px-4 py-3">
            <label className="flex min-h-[2.75rem] cursor-pointer items-start gap-3 text-sm text-zinc-200">
              <input
                type="checkbox"
                className="mt-0.5 h-5 w-5 shrink-0 accent-blue-500"
                checked={emailChecked}
                disabled={!preferences.isSuccess}
                aria-describedby={`${baseId}-email-hint`}
                onChange={(event) => {
                  const emailEnabled = event.target.checked;
                  setEmailChoice(emailEnabled);
                  save.mutate({ emailEnabled }, { onSettled: () => setEmailChoice(null) });
                }}
              />
              <span>
                {t("notifications.emailToggle")}
                <span id={`${baseId}-email-hint`} className="mt-0.5 block text-xs text-zinc-400">{t("notifications.emailHint")}</span>
              </span>
            </label>
            {save.isError && <p role="alert" className="mt-1 text-xs text-red-300">{t("notifications.saveError")}</p>}
          </div>}
        </div>,
        document.body,
      )}
    </div>
  );
}
