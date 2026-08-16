import { describe, expect, it } from "vitest";
import { computeDayOfWeekInsight, computeTimeOfDayInsight } from "./insight";

interface TestOccurrence {
  scheduled_date: string;
  scheduled_time: string | null;
  status: string;
}

function occurrencesAt(time: string, doneCount: number, total: number): TestOccurrence[] {
  return Array.from({ length: total }, (_, i) => ({
    scheduled_date: "2026-08-10",
    scheduled_time: time,
    status: i < doneCount ? "done" : "skipped",
  }));
}

describe("computeTimeOfDayInsight", () => {
  it("returns null when fewer than two buckets have enough samples", () => {
    const occurrences = [...occurrencesAt("07:00:00", 2, 3), ...occurrencesAt("20:00:00", 1, 3)];
    expect(computeTimeOfDayInsight(occurrences)).toBeNull();
  });

  it("returns null when the gap between buckets is too small", () => {
    const occurrences = [...occurrencesAt("07:00:00", 6, 10), ...occurrencesAt("20:00:00", 5, 10)];
    expect(computeTimeOfDayInsight(occurrences)).toBeNull();
  });

  it("surfaces the strongest/weakest bucket when the gap is large enough", () => {
    const occurrences = [...occurrencesAt("07:00:00", 4, 5), ...occurrencesAt("20:00:00", 1, 5)];
    const insight = computeTimeOfDayInsight(occurrences);
    expect(insight).not.toBeNull();
    expect(insight?.strongest.label).toBe("Morning");
    expect(insight?.weakest.label).toBe("Evening");
    expect(insight?.gapPercent).toBe(60);
  });

  it("ignores occurrences with no scheduled_time", () => {
    const occurrences: TestOccurrence[] = [
      ...occurrencesAt("07:00:00", 4, 5),
      ...occurrencesAt("20:00:00", 1, 5),
      { scheduled_date: "2026-08-10", scheduled_time: null, status: "done" },
    ];
    const insight = computeTimeOfDayInsight(occurrences);
    expect(insight?.buckets.reduce((sum, b) => sum + b.count, 0)).toBe(10);
  });
});

describe("computeDayOfWeekInsight", () => {
  function occ(date: string, status: string): TestOccurrence {
    return { scheduled_date: date, scheduled_time: null, status };
  }

  it("returns null with insufficient samples", () => {
    const occurrences = [occ("2026-08-10", "done"), occ("2026-08-10", "skipped")];
    expect(computeDayOfWeekInsight(occurrences)).toBeNull();
  });

  it("buckets by weekday and finds the strongest/weakest", () => {
    const monday = Array.from({ length: 5 }, () => occ("2026-08-10", "done"));
    const friday = Array.from({ length: 5 }, () => occ("2026-08-14", "skipped"));
    const insight = computeDayOfWeekInsight([...monday, ...friday]);
    expect(insight?.strongest.label).toBe("Monday");
    expect(insight?.weakest.label).toBe("Friday");
    expect(insight?.gapPercent).toBe(100);
  });

  it("maps Sunday (JS day 0) into the Monday-first week", () => {
    const sunday = Array.from({ length: 5 }, () => occ("2026-08-16", "done"));
    const monday = Array.from({ length: 5 }, () => occ("2026-08-10", "skipped"));
    const insight = computeDayOfWeekInsight([...sunday, ...monday]);
    expect(insight?.buckets.map((b) => b.label).sort()).toEqual(["Monday", "Sunday"]);
  });
});
