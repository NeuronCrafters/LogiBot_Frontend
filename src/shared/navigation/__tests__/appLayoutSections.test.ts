import { readFileSync } from "fs";
import path from "path";
import { expect, it } from "vitest";
import { APP_LAYOUT_SECTIONS, isAppLayoutPath } from "@/shared/navigation/appLayoutSections";

/** Top-level sections of the routes nested in <AppLayout /> in the router. */
function layoutSections() {
  const source = readFileSync(path.resolve(__dirname, "../../../app/router/AppRouter.tsx"), "utf8");
  const start = source.indexOf("<Route element={<AppLayout />}>");
  // The layout route closes at the first </Route> with its own indentation.
  const lineStart = source.lastIndexOf("\n", start) + 1;
  const indent = source.slice(lineStart, start);
  const end = source.indexOf(`\n${indent}</Route>`, start);
  const block = source.slice(start, end);
  return Array.from(new Set(Array.from(block.matchAll(/path="\/([^/"]+)/g)).map((match) => match[1])));
}

it("fades only the content (not the side menu) on every page of the app layout", () => {
  const sections = layoutSections();
  expect(sections.length).toBeGreaterThan(10);
  expect(sections.filter((section) => APP_LAYOUT_SECTIONS.indexOf(section) === -1)).toEqual([]);
  expect(isAppLayoutPath("/concepts")).toBe(true);
  expect(isAppLayoutPath("/dev")).toBe(true);
  expect(isAppLayoutPath("/signin")).toBe(false);
  expect(isAppLayoutPath("/development")).toBe(false);
});
