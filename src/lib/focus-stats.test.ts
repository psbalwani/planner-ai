import { describe, expect, it } from "vitest";
import { computeFocusAccuracy } from "./focus-stats";

const TASKS = [{ id: "t1", title: "Deep work" }];

describe("computeFocusAccuracy", () => {
  it("ignores sessions with no task_id", () => {
    const sessions = [
      { task_id: null, duration_minutes: 25, started_at: "2026-08-10T09:00:00Z", ended_at: "2026-08-10T09:25:00Z" },
    ];
    expect(computeFocusAccuracy(sessions, TASKS)).toEqual([]);
  });

  it("ignores sessions that never ended", () => {
    const sessions = [
      { task_id: "t1", duration_minutes: 25, started_at: "2026-08-10T09:00:00Z", ended_at: null },
      { task_id: "t1", duration_minutes: 25, started_at: "2026-08-11T09:00:00Z", ended_at: null },
      { task_id: "t1", duration_minutes: 25, started_at: "2026-08-12T09:00:00Z", ended_at: null },
    ];
    expect(computeFocusAccuracy(sessions, TASKS)).toEqual([]);
  });

  it("returns nothing below the minimum sample size", () => {
    const sessions = [
      { task_id: "t1", duration_minutes: 25, started_at: "2026-08-10T09:00:00Z", ended_at: "2026-08-10T09:25:00Z" },
      { task_id: "t1", duration_minutes: 25, started_at: "2026-08-11T09:00:00Z", ended_at: "2026-08-11T09:25:00Z" },
    ]; // only 2 sessions, minimum is 3
    expect(computeFocusAccuracy(sessions, TASKS)).toEqual([]);
  });

  it("computes average planned vs actual minutes once enough sessions exist", () => {
    const sessions = [
      { task_id: "t1", duration_minutes: 25, started_at: "2026-08-10T09:00:00Z", ended_at: "2026-08-10T09:35:00Z" },
      { task_id: "t1", duration_minutes: 25, started_at: "2026-08-11T09:00:00Z", ended_at: "2026-08-11T09:35:00Z" },
      { task_id: "t1", duration_minutes: 25, started_at: "2026-08-12T09:00:00Z", ended_at: "2026-08-12T09:35:00Z" },
    ];
    expect(computeFocusAccuracy(sessions, TASKS)).toEqual([
      { taskId: "t1", title: "Deep work", sessions: 3, avgPlannedMinutes: 25, avgActualMinutes: 35 },
    ]);
  });

  it("sorts by the largest planned-vs-actual gap first", () => {
    const tasks = [
      { id: "t1", title: "Small gap" },
      { id: "t2", title: "Big gap" },
    ];
    const sessions = [
      ...Array.from({ length: 3 }, (_, i) => ({
        task_id: "t1",
        duration_minutes: 25,
        started_at: `2026-08-${10 + i}T09:00:00Z`,
        ended_at: `2026-08-${10 + i}T09:28:00Z`,
      })),
      ...Array.from({ length: 3 }, (_, i) => ({
        task_id: "t2",
        duration_minutes: 25,
        started_at: `2026-08-${10 + i}T09:00:00Z`,
        ended_at: `2026-08-${10 + i}T10:00:00Z`,
      })),
    ];
    const result = computeFocusAccuracy(sessions, tasks);
    expect(result.map((r) => r.taskId)).toEqual(["t2", "t1"]);
  });
});
