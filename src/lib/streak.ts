import { startOfWeek } from "@/lib/dates";

interface StreakOccurrence {
  scheduled_date: string;
  status: string;
}

// Raw "don't break the chain" streaks punish a single miss as hard as
// abandoning the habit entirely — a well-documented reason people quit habit
// trackers. Both functions below grant one forgiven miss per calendar week:
// an explicitly skipped day doesn't break the streak (though it doesn't
// extend it either), but a second skip in the same week does. An unresolved
// past-due pending occurrence still breaks it outright — that's neglect, not
// a deliberate, once-off skip. Today's own occurrence is never penalized
// while still pending, since the day isn't over yet.

export function computeCurrentStreak(occurrences: StreakOccurrence[], todayISO: string): number {
  const past = occurrences
    .filter((o) => o.scheduled_date <= todayISO)
    .sort((a, b) => (a.scheduled_date < b.scheduled_date ? 1 : -1));

  let streak = 0;
  const graceUsedByWeek = new Set<string>();

  for (const occurrence of past) {
    if (occurrence.status === "done") {
      streak += 1;
      continue;
    }
    if (occurrence.scheduled_date === todayISO && occurrence.status === "pending") {
      continue;
    }
    if (occurrence.status === "skipped") {
      const week = startOfWeek(occurrence.scheduled_date);
      if (!graceUsedByWeek.has(week)) {
        graceUsedByWeek.add(week);
        continue;
      }
    }
    break;
  }

  return streak;
}

// The longest streak ever achieved (same grace rule), not just the trailing
// run ending today — shown alongside the current streak so a broken streak
// doesn't erase the record of what was actually accomplished.
export function computeBestStreak(occurrences: StreakOccurrence[], todayISO: string): number {
  const past = occurrences
    .filter((o) => o.scheduled_date <= todayISO)
    .sort((a, b) => (a.scheduled_date < b.scheduled_date ? -1 : 1));

  let streak = 0;
  let best = 0;
  const graceUsedByWeek = new Set<string>();

  for (const occurrence of past) {
    if (occurrence.status === "done") {
      streak += 1;
      best = Math.max(best, streak);
      continue;
    }
    if (occurrence.scheduled_date === todayISO && occurrence.status === "pending") {
      continue;
    }
    if (occurrence.status === "skipped") {
      const week = startOfWeek(occurrence.scheduled_date);
      if (!graceUsedByWeek.has(week)) {
        graceUsedByWeek.add(week);
        continue;
      }
    }
    streak = 0;
  }

  return best;
}
