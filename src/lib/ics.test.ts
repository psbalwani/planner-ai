import { describe, expect, it } from "vitest";
import { buildIcs } from "./ics";

const NOW = "2026-08-16T12:00:00.000Z";

describe("buildIcs", () => {
  it("wraps events in a valid VCALENDAR envelope", () => {
    const ics = buildIcs([], NOW);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("renders a timed event with DTSTART and DURATION", () => {
    const ics = buildIcs(
      [{ uid: "abc", title: "Morning workout", date: "2026-08-20", time: "07:30", durationMinutes: 45 }],
      NOW
    );
    expect(ics).toContain("UID:abc@planner-ai");
    expect(ics).toContain("DTSTAMP:20260816T120000Z");
    expect(ics).toContain("DTSTART:20260820T073000");
    expect(ics).toContain("DURATION:PT45M");
    expect(ics).toContain("SUMMARY:Morning workout");
  });

  it("falls back to a default duration when none is set", () => {
    const ics = buildIcs(
      [{ uid: "abc", title: "Task", date: "2026-08-20", time: "09:00", durationMinutes: null }],
      NOW
    );
    expect(ics).toContain("DURATION:PT30M");
  });

  it("renders an all-day event (no time) with VALUE=DATE and no DURATION", () => {
    const ics = buildIcs(
      [{ uid: "xyz", title: "Untimed task", date: "2026-08-21", time: null, durationMinutes: null }],
      NOW
    );
    expect(ics).toContain("DTSTART;VALUE=DATE:20260821");
    expect(ics).not.toContain("DURATION");
  });

  it("escapes commas, semicolons, and backslashes in the title", () => {
    const ics = buildIcs(
      [{ uid: "e1", title: "Buy milk, eggs; bread\\butter", date: "2026-08-20", time: null, durationMinutes: null }],
      NOW
    );
    expect(ics).toContain("SUMMARY:Buy milk\\, eggs\\; bread\\\\butter");
  });
});
