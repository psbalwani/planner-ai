interface OccurrenceForInsight {
  scheduled_time: string | null;
  status: string;
}

export interface BucketStat {
  label: string;
  rate: number; // 0-1
  count: number;
}

export interface TimeOfDayInsight {
  buckets: BucketStat[];
  strongest: BucketStat;
  weakest: BucketStat;
  gapPercent: number;
}

const MIN_BUCKET_SAMPLE = 5;
const MIN_GAP_PERCENT = 20;

function bucketFor(time: string): "Morning" | "Midday" | "Evening" {
  if (time < "09:00:00") return "Morning";
  if (time < "17:00:00") return "Midday";
  return "Evening";
}

// The simplest possible version of the PRD's "first adaptive insight": bucket
// past occurrences by scheduled time-of-day and compare completion rates.
// Non-ML on purpose — see docs/prd.md's success criterion. Returns null
// (render nothing) unless there's enough sample size and a real enough gap
// to be worth surfacing — a noisy 3-sample comparison isn't an insight.
export function computeTimeOfDayInsight(
  occurrences: OccurrenceForInsight[]
): TimeOfDayInsight | null {
  const counts: Record<string, { done: number; total: number }> = {
    Morning: { done: 0, total: 0 },
    Midday: { done: 0, total: 0 },
    Evening: { done: 0, total: 0 },
  };

  for (const occurrence of occurrences) {
    if (!occurrence.scheduled_time) continue;
    const bucket = bucketFor(occurrence.scheduled_time);
    counts[bucket].total += 1;
    if (occurrence.status === "done") counts[bucket].done += 1;
  }

  const buckets: BucketStat[] = Object.entries(counts)
    .filter(([, c]) => c.total >= MIN_BUCKET_SAMPLE)
    .map(([label, c]) => ({ label, rate: c.done / c.total, count: c.total }));

  if (buckets.length < 2) return null;

  const sorted = [...buckets].sort((a, b) => b.rate - a.rate);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];
  const gapPercent = Math.round((strongest.rate - weakest.rate) * 100);

  if (gapPercent < MIN_GAP_PERCENT) return null;

  return { buckets: sorted, strongest, weakest, gapPercent };
}
