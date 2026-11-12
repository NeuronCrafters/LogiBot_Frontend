import { useEffect, type RefObject } from "react";

const dialogs: HTMLElement[] = [];
let restorePage: (() => void) | undefined;

/** Also locks scrollable app panels, which do not scroll through document.body. */
export function useModalScrollLock(open: boolean, ref: RefObject<HTMLElement>) {
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    if (!dialogs.length) {
      const elements = [document.documentElement, document.body];
      const previous = elements.map(element => element.style.overflow);
      elements.forEach(element => { element.style.overflow = "hidden"; });
      restorePage = () => elements.forEach((element, index) => { element.style.overflow = previous[index]; });
    }
    dialogs.push(dialog);
    const preventBackgroundScroll = (event: Event) => {
      if (dialogs.at(-1) !== dialog) return;
      const target = event.target as Node;
      // Select menus are portaled to body, but still belong to controls inside this dialog.
      const ownedPopup = [...dialog.querySelectorAll('[aria-expanded="true"][aria-controls]')]
        .some(control => control.getAttribute('aria-controls')?.split(/\s+/).some(id => document.getElementById(id)?.contains(target)));
      if (!dialog.contains(target) && !ownedPopup) event.preventDefault();
    };
    document.addEventListener("wheel", preventBackgroundScroll, { passive: false });
    document.addEventListener("touchmove", preventBackgroundScroll, { passive: false });
    return () => {
      document.removeEventListener("wheel", preventBackgroundScroll);
      document.removeEventListener("touchmove", preventBackgroundScroll);
      dialogs.splice(dialogs.indexOf(dialog), 1);
      if (!dialogs.length) { restorePage?.(); restorePage = undefined; }
    };
  }, [open, ref]);
}
