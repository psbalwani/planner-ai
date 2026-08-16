import { addDays, startOfWeek } from "@/lib/dates";

export interface HeatmapDay {
  date: string; // ISO date
  count: number;
}

// Buckets completion timestamps into daily counts across [startDate, endDate]
// inclusive, oldest first. Always returns one entry per day, even if count is
// 0, so the heatmap grid has no gaps.
export function computeDailyHeatmap(
  completedDates: string[],
  startDate: string,
  endDate: string
): HeatmapDay[] {
  const counts: Record<string, number> = {};
  for (const date of completedDates) {
    counts[date] = (counts[date] ?? 0) + 1;
  }

  const days: HeatmapDay[] = [];
  for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
    days.push({ date, count: counts[date] ?? 0 });
  }
  return days;
}

export interface HeatmapSummary {
  totalCompletions: number;
  activeDays: number;
  maxStreak: number;
}

// The submission-count / active-days / max-streak line shown above the
// heatmap grid. Streak here means consecutive calendar days with at least
// one completion — distinct from a single task's streak in lib/streak.ts.
export function computeHeatmapSummary(days: HeatmapDay[]): HeatmapSummary {
  let totalCompletions = 0;
  let activeDays = 0;
  let maxStreak = 0;
  let currentStreak = 0;

  for (const day of days) {
    totalCompletions += day.count;
    if (day.count > 0) {
      activeDays += 1;
      currentStreak += 1;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return { totalCompletions, activeDays, maxStreak };
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
  weeksBack: number,
  today: string
): WeeklyRate[] {
  const byWeek: Record<string, { done: number; total: number }> = {};
  for (const occurrence of occurrences) {
    const weekStart = startOfWeek(occurrence.scheduled_date);
    byWeek[weekStart] ??= { done: 0, total: 0 };
    byWeek[weekStart].total += 1;
    if (occurrence.status === "done") byWeek[weekStart].done += 1;
  }

  const thisWeekStart = startOfWeek(today);
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
