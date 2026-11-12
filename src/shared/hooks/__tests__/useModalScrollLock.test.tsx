import { useRef } from "react";
import { createPortal } from "react-dom";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { useModalScrollLock } from "../useModalScrollLock";

function Dialog({ open, menu = false }: { open: boolean; menu?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useModalScrollLock(open, ref);
  return open ? <div ref={ref} role="dialog">
    <button aria-expanded={menu} aria-controls={menu ? "owned-menu" : undefined}>Menu</button>
    {menu && createPortal(<div id="owned-menu" role="listbox">Opções</div>, document.body)}
  </div> : null;
}

const wheel = (element: Element) => {
  const event = new WheelEvent("wheel", { bubbles: true, cancelable: true });
  element.dispatchEvent(event);
  return event.defaultPrevented;
};

afterEach(() => { cleanup(); document.body.style.overflow = ""; document.documentElement.style.overflow = ""; });

it("blocks the background while leaving modal content scrollable, then restores page styles", () => {
  document.body.style.overflow = "scroll";
  const { unmount } = render(<Dialog open />);
  expect(document.body.style.overflow).toBe("hidden");
  expect(wheel(document.body)).toBe(true);
  expect(wheel(screen.getByRole("dialog"))).toBe(false);
  unmount();
  expect(document.body.style.overflow).toBe("scroll");
  expect(wheel(document.body)).toBe(false);
});

it("keeps the page locked until the last modal closes", () => {
  const { rerender } = render(<><Dialog open /><Dialog open /></>);
  rerender(<><Dialog open={false} /><Dialog open /></>);
  expect(document.body.style.overflow).toBe("hidden");
  expect(wheel(document.body)).toBe(true);
  rerender(<><Dialog open={false} /><Dialog open={false} /></>);
  expect(document.body.style.overflow).toBe("");
});

it("allows scrolling in a portaled menu controlled by the active modal", () => {
  render(<Dialog open menu />);
  expect(wheel(screen.getByRole("listbox"))).toBe(false);
  expect(wheel(document.body)).toBe(true);
});
