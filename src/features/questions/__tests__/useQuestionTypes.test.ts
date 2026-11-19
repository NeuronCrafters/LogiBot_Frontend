import { renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useQuestionTypes } from "@/features/questions/hooks/useQuestionTypes";

let parsonsReleased = false;
vi.mock("@/features/release/hooks/useFeatures", () => ({ useFeatures: () => ({ isEnabled: (feature: string) => feature !== "practice_parsons" || parsonsReleased }) }));

it("hides algorithm assembly while it is blocked, except for a question that already uses it", () => {
  parsonsReleased = false;
  expect(renderHook(() => useQuestionTypes()).result.current).toEqual(["quiz", "truth_table", "translation", "essay"]);
  expect(renderHook(() => useQuestionTypes("parsons")).result.current).toContain("parsons");
  parsonsReleased = true;
  expect(renderHook(() => useQuestionTypes()).result.current).toContain("parsons");
});
