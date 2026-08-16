import { describe, expect, it } from "vitest";
import { computeDecliningTasks } from "./nudges";

const TODAY = "2026-08-14";
// Recent window: 2026-08-01..2026-08-14. Previous window: 2026-07-18..2026-07-31.
const RECENT_DATE = "2026-08-05";
const PREVIOUS_DATE = "2026-07-25";

function occurrences(taskId: string, date: string, doneCount: number, total: number) {
  return Array.from({ length: total }, (_, i) => ({
    task_id: taskId,
    scheduled_date: date,
    status: i < doneCount ? "done" : "skipped",
  }));
}

describe("computeDecliningTasks", () => {
  it("returns no alert without enough samples in both windows", () => {
    const tasks = [{ id: "t1", title: "Workout" }];
    const occ = [...occurrences("t1", PREVIOUS_DATE, 3, 3), ...occurrences("t1", RECENT_DATE, 0, 3)];
    expect(computeDecliningTasks(tasks, occ, TODAY)).toEqual([]);
  });

  it("returns no alert when the drop is below the threshold", () => {
    const tasks = [{ id: "t1", title: "Workout" }];
    const occ = [
      ...occurrences("t1", PREVIOUS_DATE, 5, 5), // 100%
      ...occurrences("t1", RECENT_DATE, 4, 5), // 80%, drop of 20
    ];
    expect(computeDecliningTasks(tasks, occ, TODAY)).toEqual([]);
  });

  it("flags a task whose completion rate dropped past the threshold", () => {
    const tasks = [{ id: "t1", title: "Workout" }];
    const occ = [
      ...occurrences("t1", PREVIOUS_DATE, 5, 5), // 100%
      ...occurrences("t1", RECENT_DATE, 1, 5), // 20%, drop of 80
    ];
    const alerts = computeDecliningTasks(tasks, occ, TODAY);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({ taskId: "t1", title: "Workout", dropPercent: 80 });
  });

  it("sorts multiple alerts by drop percent, largest first", () => {
    const tasks = [
      { id: "t1", title: "Small drop" },
      { id: "t2", title: "Big drop" },
    ];
    const occ = [
      ...occurrences("t1", PREVIOUS_DATE, 5, 5),
      ...occurrences("t1", RECENT_DATE, 2, 5), // drop of 60
      ...occurrences("t2", PREVIOUS_DATE, 5, 5),
      ...occurrences("t2", RECENT_DATE, 0, 5), // drop of 100
    ];
    const alerts = computeDecliningTasks(tasks, occ, TODAY);
    expect(alerts.map((a) => a.taskId)).toEqual(["t2", "t1"]);
  });
});
