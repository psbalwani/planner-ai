import { parseISODate } from "@/lib/dates";

interface OccurrenceForInsight {
  scheduled_date: string;
  scheduled_time: string | null;
  status: string;
}

export interface BucketStat {
  label: string;
  rate: number; // 0-1
  count: number;
}

export interface BucketedInsight {
  buckets: BucketStat[];
  strongest: BucketStat;
  weakest: BucketStat;
  gapPercent: number;
}

const MIN_BUCKET_SAMPLE = 5;
const MIN_GAP_PERCENT = 20;

// Shared gating: don't surface a comparison unless at least two buckets have
// enough samples to mean something, and the gap between best and worst is
// large enough not to be noise. See docs/prd.md's non-ML success criterion.
function summarize(counts: Record<string, { done: number; total: number }>): BucketedInsight | null {
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

function bucketForTime(time: string): "Morning" | "Midday" | "Evening" {
  if (time < "09:00:00") return "Morning";
  if (time < "17:00:00") return "Midday";
  return "Evening";
}

// The simplest possible version of the PRD's "first adaptive insight": bucket
// past occurrences by scheduled time-of-day and compare completion rates.
export function computeTimeOfDayInsight(occurrences: OccurrenceForInsight[]): BucketedInsight | null {
  const counts: Record<string, { done: number; total: number }> = {
    Morning: { done: 0, total: 0 },
    Midday: { done: 0, total: 0 },
    Evening: { done: 0, total: 0 },
  };

  for (const occurrence of occurrences) {
    if (!occurrence.scheduled_time) continue;
    const bucket = bucketForTime(occurrence.scheduled_time);
    counts[bucket].total += 1;
    if (occurrence.status === "done") counts[bucket].done += 1;
  }

  return summarize(counts);
}

const WEEKDAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Same pattern as time-of-day, bucketed by day of week instead — catches
// patterns like "always skips weekend tasks" that time-of-day can't see.
export function computeDayOfWeekInsight(occurrences: OccurrenceForInsight[]): BucketedInsight | null {
  const counts: Record<string, { done: number; total: number }> = {};
  for (const label of WEEKDAY_LABELS) counts[label] = { done: 0, total: 0 };

  for (const occurrence of occurrences) {
    const jsDay = parseISODate(occurrence.scheduled_date).getUTCDay(); // 0=Sun..6=Sat
    const label = WEEKDAY_LABELS[(jsDay + 6) % 7]; // rotate to Monday-first
    counts[label].total += 1;
    if (occurrence.status === "done") counts[label].done += 1;
  }

  return summarize(counts);
}
