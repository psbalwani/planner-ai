import { addDays, startOfWeek, todayISO } from "@/lib/dates";

export interface HeatmapDay {
  date: string; // ISO date
  count: number;
}

// Buckets completion timestamps into daily counts for the last `daysBack`
// days (inclusive of today), oldest first. Always returns one entry per day,
// even if count is 0, so the heatmap grid has no gaps.
export function computeDailyHeatmap(completedDates: string[], daysBack: number): HeatmapDay[] {
  const counts: Record<string, number> = {};
  for (const date of completedDates) {
    counts[date] = (counts[date] ?? 0) + 1;
  }

  const today = todayISO();
  const days: HeatmapDay[] = [];
  for (let i = daysBack - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    days.push({ date, count: counts[date] ?? 0 });
  }
  return days;
}

export interface WeeklyRate {
  weekStart: string; // ISO date, Monday
  rate: number | null; // null when no resolved occurrences that week
  total: number;
}

interface ResolvedOccurrence {
  scheduled_date: string;
  status: string;
}

// Weekly completion rate (done / (done+skipped)) over the last `weeksBack`
// weeks, oldest first. Weeks with no resolved occurrences get rate: null so
// the line graph can render a gap instead of a misleading 0%.
export function computeWeeklyCompletionRate(
  occurrences: ResolvedOccurrence[],
  weeksBack: number
): WeeklyRate[] {
  const byWeek: Record<string, { done: number; total: number }> = {};
  for (const occurrence of occurrences) {
    const weekStart = startOfWeek(occurrence.scheduled_date);
    byWeek[weekStart] ??= { done: 0, total: 0 };
    byWeek[weekStart].total += 1;
    if (occurrence.status === "done") byWeek[weekStart].done += 1;
  }

  const thisWeekStart = startOfWeek(todayISO());
  const weeks: WeeklyRate[] = [];
  for (let i = weeksBack - 1; i >= 0; i--) {
    const weekStart = addDays(thisWeekStart, -7 * i);
    const stats = byWeek[weekStart];
    weeks.push({
      weekStart,
      rate: stats && stats.total > 0 ? stats.done / stats.total : null,
      total: stats?.total ?? 0,
    });
  }
  return weeks;
}
