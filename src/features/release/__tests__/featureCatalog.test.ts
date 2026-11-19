import { describe, expect, it } from "vitest";
import { featureForPath, resolveFeature, type FeatureRule } from "@/features/release/featureCatalog";

describe("feature release catalog", () => {
  it("maps pages to their feature", () => {
    expect(featureForPath("/chat")).toBe("chat");
    expect(featureForPath("/quiz/manage")).toBe("quiz");
    expect(featureForPath("/practice/translation")).toBe("practice_translation");
    expect(featureForPath("/exams/manage/1/review")).toBe("exams");
    expect(featureForPath("/questions/new")).toBe("question_bank");
    expect(featureForPath("/profile")).toBeNull();
    expect(featureForPath("/chatbot")).toBeNull();
  });

  it("lets the most specific rule win and tells where it came from", () => {
    const rule = (scope: FeatureRule["scope"], scopeId: string, enabled: boolean): FeatureRule => ({ id: scope, feature: "exams", scope, scopeId, enabled, updatedAt: "" });
    const chain: Array<[FeatureRule["scope"], string]> = [["course", "c"], ["institution", "i"], ["global", ""]];
    expect(resolveFeature([], "exams", chain)).toEqual({ enabled: true, from: null });
    expect(resolveFeature([rule("global", "", false), rule("institution", "i", true)], "exams", chain)).toEqual({ enabled: true, from: ["institution", "i"] });
    expect(resolveFeature([rule("global", "", false)], "exams", chain)).toEqual({ enabled: false, from: ["global", ""] });
  });
});
