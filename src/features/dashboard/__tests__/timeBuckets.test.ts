import { describe, expect, it } from "vitest";
import { bucketStart, granularityFor, groupUsage, journeyWindow, periodRange, spanInDays } from "@/features/dashboard/timeBuckets";

describe("time buckets", () => {
  it("picks days, weeks or months by the span", () => {
    expect(granularityFor(30)).toBe("day");
    expect(granularityFor(45)).toBe("day");
    expect(granularityFor(90)).toBe("week");
    expect(granularityFor(400)).toBe("month");
    expect(spanInDays(["2026-08-17", "2026-11-18"])).toBe(94);
    expect(spanInDays([], { startDate: "2026-11-01", endDate: "2026-11-07" })).toBe(7);
  });

  it("starts weeks on Monday and months on day one", () => {
    expect(bucketStart("2026-11-18", "week")).toBe("2026-11-16");
    expect(bucketStart("2026-11-16", "week")).toBe("2026-11-16");
    expect(bucketStart("2026-11-15", "week")).toBe("2026-11-09");
    expect(bucketStart("2026-11-18", "month")).toBe("2026-11-01");
  });

  it("adds up minutes and sessions per bucket", () => {
    const rows = [{ date: "2026-11-16", usage: 10, sessions: [1] }, { date: "2026-11-18", usage: 5, sessions: [2, 3] }, { date: "2026-11-24", usage: 2 }];
    expect(groupUsage(rows, "week")).toEqual([
      { date: "2026-11-16", usage: 15, sessions: [1, 2, 3], days: 2 },
      { date: "2026-11-23", usage: 2, sessions: [], days: 1 },
    ]);
  });

  it("shows the last ten quizzes, or all of them grouped by five when there are many", () => {
    const points = Array.from({ length: 32 }, (_item, index) => ({ name: `Quiz ${index + 1}`, shortName: `Q${index + 1}`, performance: index, deltaFromPrevious: null }));
    const recent = journeyWindow(points, false);
    expect(recent.points.map((point) => point.shortName)).toEqual(["Q23", "Q24", "Q25", "Q26", "Q27", "Q28", "Q29", "Q30", "Q31", "Q32"]);
    expect(recent.points[0].deltaFromPrevious).toBeNull();
    const all = journeyWindow(points, true);
    expect(all.grouped).toBe(true);
    expect(all.points).toHaveLength(7);
    expect(all.points[0]).toMatchObject({ shortName: "Q1–5", performance: 2 });
    expect(all.points[6]).toMatchObject({ shortName: "Q31–32", performance: 30.5, deltaFromPrevious: 3.5 });
    expect(journeyWindow(points.slice(0, 12), true)).toEqual({ points: points.slice(0, 12), grouped: false });
  });

  it("turns presets into inclusive dates counted back from today", () => {
    const today = new Date(2026, 10, 18);
    expect(periodRange("7", {}, today)).toEqual({ startDate: "2026-11-12", endDate: "2026-11-18" });
    expect(periodRange("all", {}, today)).toEqual({});
    expect(periodRange("custom", { startDate: "2026-10-01", endDate: "" }, today)).toEqual({ startDate: "2026-10-01", endDate: undefined });
  });
});
