import { addDays } from "@/lib/dates";

export interface DecliningTaskAlert {
  taskId: string;
  title: string;
  recentRate: number;
  previousRate: number;
  dropPercent: number;
}

interface OccurrenceForNudge {
  task_id: string;
  scheduled_date: string;
  status: string;
}

const WINDOW_DAYS = 14;
const MIN_WINDOW_SAMPLE = 4;
const MIN_DROP_PERCENT = 30;

// Compares each recurring task's completion rate over the last two weeks
// against the two weeks before that. A task whose rate has fallen off a
// cliff is a candidate for "this schedule isn't working" — not proof, just
// a nudge worth surfacing. Gated on sample size in both windows so a single
// bad week doesn't read as a trend.
export function computeDecliningTasks(
  tasks: { id: string; title: string }[],
  occurrences: OccurrenceForNudge[],
  today: string
): DecliningTaskAlert[] {
  const recentStart = addDays(today, -(WINDOW_DAYS - 1));
  const previousStart = addDays(today, -(WINDOW_DAYS * 2 - 1));
  const previousEnd = addDays(today, -WINDOW_DAYS);

  const alerts: DecliningTaskAlert[] = [];

  for (const task of tasks) {
    const recent = occurrences.filter(
      (o) => o.task_id === task.id && o.scheduled_date >= recentStart && o.scheduled_date <= today
    );
    const previous = occurrences.filter(
      (o) =>
        o.task_id === task.id &&
        o.scheduled_date >= previousStart &&
        o.scheduled_date <= previousEnd
    );

    if (recent.length < MIN_WINDOW_SAMPLE || previous.length < MIN_WINDOW_SAMPLE) continue;

    const recentRate = recent.filter((o) => o.status === "done").length / recent.length;
    const previousRate = previous.filter((o) => o.status === "done").length / previous.length;
    const dropPercent = Math.round((previousRate - recentRate) * 100);

    if (dropPercent >= MIN_DROP_PERCENT) {
      alerts.push({ taskId: task.id, title: task.title, recentRate, previousRate, dropPercent });
    }
  }

  return alerts.sort((a, b) => b.dropPercent - a.dropPercent);
}
