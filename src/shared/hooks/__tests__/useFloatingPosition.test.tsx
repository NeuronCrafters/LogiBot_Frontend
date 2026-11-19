import { render } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { useFloatingPosition } from "@/shared/hooks/useFloatingPosition";

const created: Array<() => void> = [];
afterEach(() => { created.length = 0; vi.unstubAllGlobals(); });

function Floating() {
  const anchor = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const position = useFloatingPosition(true, anchor, panel);
  return (
    <>
      <button ref={anchor}>a</button>
      <div ref={panel} data-testid="panel" style={{ left: position.left, top: position.top }} />
    </>
  );
}

it("sets up the observers once and does not loop when the panel width keeps changing", () => {
  // Like a real ResizeObserver, it reports right after observe(); the width changes on every read.
  vi.stubGlobal("ResizeObserver", class {
    constructor(private readonly callback: () => void) { created.push(callback); }
    observe() { this.callback(); }
    disconnect() {}
  });
  let width = 300;
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    if (this.tagName === "BUTTON") return { left: 900, top: 10, bottom: 40, right: 940, width: 40, height: 30 } as DOMRect;
    width += 0.3;
    return { left: 0, top: 0, bottom: 200, right: width, width, height: 200 } as DOMRect;
  });
  const errors = vi.spyOn(console, "error").mockImplementation(() => {});
  expect(() => render(<Floating />)).not.toThrow();
  expect(created).toHaveLength(1);
  expect(errors.mock.calls.flat().join(" ")).not.toMatch(/Maximum update depth/);
});
