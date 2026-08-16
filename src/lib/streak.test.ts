import { describe, expect, it } from "vitest";
import { computeBestStreak, computeCurrentStreak } from "./streak";

describe("computeCurrentStreak", () => {
  it("returns 0 for no occurrences", () => {
    expect(computeCurrentStreak([], "2026-08-14")).toBe(0);
  });

  it("counts consecutive done days ending today", () => {
    const occurrences = [
      { scheduled_date: "2026-08-12", status: "done" },
      { scheduled_date: "2026-08-13", status: "done" },
      { scheduled_date: "2026-08-14", status: "done" },
    ];
    expect(computeCurrentStreak(occurrences, "2026-08-14")).toBe(3);
  });

  it("forgives a single skip within the week without breaking the streak", () => {
    const occurrences = [
      { scheduled_date: "2026-08-11", status: "done" },
      { scheduled_date: "2026-08-12", status: "skipped" },
      { scheduled_date: "2026-08-13", status: "done" },
      { scheduled_date: "2026-08-14", status: "done" },
    ];
    expect(computeCurrentStreak(occurrences, "2026-08-14")).toBe(3);
  });

  it("breaks on a second skip in the same week", () => {
    const occurrences = [
      { scheduled_date: "2026-08-10", status: "skipped" },
      { scheduled_date: "2026-08-11", status: "done" },
      { scheduled_date: "2026-08-12", status: "skipped" },
      { scheduled_date: "2026-08-13", status: "done" },
      { scheduled_date: "2026-08-14", status: "done" },
    ];
    expect(computeCurrentStreak(occurrences, "2026-08-14")).toBe(3);
  });

  it("doesn't penalize today while it's still pending", () => {
    const occurrences = [
      { scheduled_date: "2026-08-13", status: "done" },
      { scheduled_date: "2026-08-14", status: "pending" },
    ];
    expect(computeCurrentStreak(occurrences, "2026-08-14")).toBe(1);
  });

  it("breaks on an unresolved past-due pending occurrence (not gracable)", () => {
    const occurrences = [
      { scheduled_date: "2026-08-12", status: "done" },
      { scheduled_date: "2026-08-13", status: "pending" },
      { scheduled_date: "2026-08-14", status: "pending" },
    ];
    expect(computeCurrentStreak(occurrences, "2026-08-14")).toBe(0);
  });

  it("ignores occurrences scheduled after today", () => {
    const occurrences = [
      { scheduled_date: "2026-08-14", status: "done" },
      { scheduled_date: "2026-08-15", status: "pending" },
    ];
    expect(computeCurrentStreak(occurrences, "2026-08-14")).toBe(1);
  });
});

describe("computeBestStreak", () => {
  it("returns 0 for no occurrences", () => {
    expect(computeBestStreak([], "2026-08-14")).toBe(0);
  });

  it("finds a longer streak earlier in history, not just the trailing one", () => {
    const occurrences = [
      { scheduled_date: "2026-07-01", status: "done" },
      { scheduled_date: "2026-07-02", status: "done" },
      { scheduled_date: "2026-07-03", status: "done" },
      { scheduled_date: "2026-07-04", status: "done" },
      { scheduled_date: "2026-07-05", status: "done" },
      { scheduled_date: "2026-07-06", status: "skipped" }, // second skip that week breaks it
      { scheduled_date: "2026-07-07", status: "skipped" },
      { scheduled_date: "2026-08-13", status: "done" },
      { scheduled_date: "2026-08-14", status: "done" },
    ];
    expect(computeBestStreak(occurrences, "2026-08-14")).toBe(5);
    expect(computeCurrentStreak(occurrences, "2026-08-14")).toBe(2);
  });
});
