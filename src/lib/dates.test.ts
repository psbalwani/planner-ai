import { describe, expect, it } from "vitest";
import { addDays, formatDayLabel, parseISODate, startOfWeek, toISODate } from "./dates";

describe("toISODate", () => {
  it("formats a UTC date as YYYY-MM-DD", () => {
    expect(toISODate(new Date("2026-08-14T15:30:00Z"))).toBe("2026-08-14");
  });
});

describe("parseISODate", () => {
  it("round-trips through toISODate", () => {
    expect(toISODate(parseISODate("2026-08-14"))).toBe("2026-08-14");
  });
});

describe("addDays", () => {
  it("adds positive days, rolling into the next month", () => {
    expect(addDays("2026-08-30", 3)).toBe("2026-09-02");
  });

  it("subtracts with a negative count, rolling into the previous month", () => {
    expect(addDays("2026-08-01", -1)).toBe("2026-07-31");
  });

  it("returns the same date for 0", () => {
    expect(addDays("2026-08-14", 0)).toBe("2026-08-14");
  });
});

describe("startOfWeek", () => {
  it("returns the same date when already a Monday", () => {
    expect(startOfWeek("2026-08-10")).toBe("2026-08-10"); // a Monday
  });

  it("rolls a Wednesday back to Monday", () => {
    expect(startOfWeek("2026-08-12")).toBe("2026-08-10");
  });

  it("rolls a Sunday back to the Monday before it, not forward", () => {
    expect(startOfWeek("2026-08-16")).toBe("2026-08-10");
  });
});

describe("formatDayLabel", () => {
  it("formats as 'Weekday DD/MM'", () => {
    expect(formatDayLabel("2026-08-14")).toBe("Fri 14/08");
  });
});
