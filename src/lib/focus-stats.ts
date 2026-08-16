export interface FocusAccuracyStat {
  taskId: string;
  title: string;
  sessions: number;
  avgPlannedMinutes: number;
  avgActualMinutes: number;
}

interface SessionForAccuracy {
  task_id: string | null;
  duration_minutes: number;
  started_at: string;
  ended_at: string | null;
}

const MIN_FOCUS_SAMPLE = 3;

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// Compares planned focus-session length against actual elapsed time
// (ended_at - started_at) per task. Only counts sessions that ran to
// completion (ended_at set) and only surfaces a task once enough sessions
// exist to mean something, same gating philosophy as the other insights.
export function computeFocusAccuracy(
  sessions: SessionForAccuracy[],
  tasks: { id: string; title: string }[]
): FocusAccuracyStat[] {
  const titleById = new Map(tasks.map((t) => [t.id, t.title]));
  const byTask = new Map<string, { planned: number[]; actual: number[] }>();

  for (const session of sessions) {
    if (!session.task_id || !session.ended_at) continue;
    const actualMinutes =
      (new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 60000;
    const entry = byTask.get(session.task_id) ?? { planned: [], actual: [] };
    entry.planned.push(session.duration_minutes);
    entry.actual.push(actualMinutes);
    byTask.set(session.task_id, entry);
  }

  const results: FocusAccuracyStat[] = [];
  for (const [taskId, entry] of byTask) {
    if (entry.planned.length < MIN_FOCUS_SAMPLE) continue;
    const title = titleById.get(taskId);
    if (!title) continue;
    results.push({
      taskId,
      title,
      sessions: entry.planned.length,
      avgPlannedMinutes: Math.round(average(entry.planned)),
      avgActualMinutes: Math.round(average(entry.actual)),
    });
  }

  return results.sort(
    (a, b) =>
      Math.abs(b.avgActualMinutes - b.avgPlannedMinutes) -
      Math.abs(a.avgActualMinutes - a.avgPlannedMinutes)
  );
}
