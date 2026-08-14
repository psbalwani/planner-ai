interface StreakOccurrence {
  scheduled_date: string;
  status: string;
}

// Counts consecutive "done" occurrences ending at the most recent scheduled
// date on or before today. A pending/skipped/moved occurrence in the past
// breaks the streak; future occurrences (not yet due) don't count either way.
export function computeCurrentStreak(occurrences: StreakOccurrence[], todayISO: string): number {
  const past = occurrences
    .filter((o) => o.scheduled_date <= todayISO)
    .sort((a, b) => (a.scheduled_date < b.scheduled_date ? 1 : -1));

  let streak = 0;
  for (const occurrence of past) {
    if (occurrence.status !== "done") break;
    streak += 1;
  }
  return streak;
}
