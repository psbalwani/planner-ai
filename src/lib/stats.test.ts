import { describe, expect, it } from "vitest";
import { computeDailyHeatmap, computeHeatmapSummary, computeWeeklyCompletionRate } from "./stats";

describe("computeDailyHeatmap", () => {
  it("returns one entry per day, oldest first, even with no completions", () => {
    const days = computeDailyHeatmap([], "2026-08-12", "2026-08-14");
    expect(days).toEqual([
      { date: "2026-08-12", count: 0 },
      { date: "2026-08-13", count: 0 },
      { date: "2026-08-14", count: 0 },
    ]);
  });

  it("counts completions per day", () => {
    const days = computeDailyHeatmap(
      ["2026-08-13", "2026-08-13", "2026-08-14"],
      "2026-08-12",
      "2026-08-14"
    );
    expect(days).toEqual([
      { date: "2026-08-12", count: 0 },
      { date: "2026-08-13", count: 2 },
      { date: "2026-08-14", count: 1 },
    ]);
  });
});

describe("computeHeatmapSummary", () => {
  it("returns zeros for an all-empty range", () => {
    const days = [
      { date: "2026-08-12", count: 0 },
      { date: "2026-08-13", count: 0 },
    ];
    expect(computeHeatmapSummary(days)).toEqual({
      totalCompletions: 0,
      activeDays: 0,
      maxStreak: 0,
    });
  });

  it("sums completions and counts active days", () => {
    const days = [
      { date: "2026-08-12", count: 2 },
      { date: "2026-08-13", count: 0 },
      { date: "2026-08-14", count: 1 },
    ];
    expect(computeHeatmapSummary(days)).toEqual({
      totalCompletions: 3,
      activeDays: 2,
      maxStreak: 1,
    });
  });

  it("finds the longest run of consecutive active days, not the most recent", () => {
    const days = [
      { date: "2026-08-01", count: 1 },
      { date: "2026-08-02", count: 1 },
      { date: "2026-08-03", count: 1 },
      { date: "2026-08-04", count: 0 },
      { date: "2026-08-05", count: 1 },
      { date: "2026-08-06", count: 1 },
    ];
    expect(computeHeatmapSummary(days)).toEqual({
      totalCompletions: 5,
      activeDays: 5,
      maxStreak: 3,
    });
  });
});

describe("computeWeeklyCompletionRate", () => {
  it("returns null rate for weeks with no resolved occurrences", () => {
    const weeks = computeWeeklyCompletionRate([], 2, "2026-08-14");
    expect(weeks).toEqual([
      { weekStart: "2026-08-03", rate: null, total: 0 },
      { weekStart: "2026-08-10", rate: null, total: 0 },
    ]);
  });

  it("computes done/total rate per week", () => {
    const occurrences = [
      { scheduled_date: "2026-08-11", status: "done" },
      { scheduled_date: "2026-08-12", status: "skipped" },
    ];
    const weeks = computeWeeklyCompletionRate(occurrences, 2, "2026-08-14");
    expect(weeks).toEqual([
      { weekStart: "2026-08-03", rate: null, total: 0 },
      { weekStart: "2026-08-10", rate: 0.5, total: 2 },
    ]);
  });
});
