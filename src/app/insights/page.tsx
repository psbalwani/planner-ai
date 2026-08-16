import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addDays, todayISO } from "@/lib/dates";
import { BUCKET_SUGGESTED_TIME, computeDayOfWeekInsight, computeTimeOfDayInsight } from "@/lib/insight";
import { computeDailyHeatmap, computeHeatmapSummary, computeWeeklyCompletionRate } from "@/lib/stats";
import { computeDecliningTasks } from "@/lib/nudges";
import { computeFocusAccuracy } from "@/lib/focus-stats";
import AppHeader from "@/components/app-header";
import InsightCard from "./insight-card";
import SeedDemoButton from "./seed-demo-button";
import CompletionHeatmap from "./heatmap";
import CompletionRateLineGraph from "./line-graph";
import DecliningTasksCard from "./declining-card";
import FocusAccuracyCard from "./focus-accuracy-card";
import YearSelect from "./year-select";

const RATE_WEEKS_BACK = 10;
const NUDGE_WINDOW_DAYS = 28; // two 14-day comparison windows

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = todayISO();
  const currentYear = Number(today.slice(0, 4));

  // Only offer years that actually have completion history to pick from —
  // no point letting someone select a year with nothing in it.
  const { data: earliestCompletion } = await supabase
    .from("completion_events")
    .select("completed_at")
    .order("completed_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const earliestYear = earliestCompletion
    ? Number(earliestCompletion.completed_at.slice(0, 4))
    : currentYear;
  const yearOptions = [
    { value: "current", label: "Current" },
    ...Array.from({ length: currentYear - earliestYear }, (_, i) => currentYear - 1 - i).map((y) => ({
      value: String(y),
      label: String(y),
    })),
  ];

  const { year: yearParam } = await searchParams;
  const parsedYear = Number(yearParam);
  const isPastYear =
    Number.isInteger(parsedYear) && parsedYear >= earliestYear && parsedYear < currentYear;
  const selectedValue = isPastYear ? String(parsedYear) : "current";

  // "Current" is a rolling 365-day window ending today (it can span back
  // into the previous calendar year), matching what "in the past one year"
  // actually means. A specific past year is its full Jan-Dec calendar range.
  const yearStart = isPastYear ? `${parsedYear}-01-01` : addDays(today, -364);
  const yearEnd = isPastYear ? `${parsedYear}-12-31` : today;

  const { data: recurringTasks } = await supabase
    .from("tasks")
    .select("id, title")
    .eq("type", "recurring");
  const recurringTaskIds = (recurringTasks ?? []).map((t) => t.id);

  const [
    { data: allHistoryOccurrences },
    { data: completionEvents },
    { data: recentOccurrences },
    { data: allTasks },
    { data: focusSessions },
  ] = await Promise.all([
    supabase
      .from("task_occurrences")
      .select("scheduled_date, scheduled_time, status")
      .lte("scheduled_date", today),
    supabase
      .from("completion_events")
      .select("completed_at")
      .gte("completed_at", `${yearStart}T00:00:00Z`)
      .lte("completed_at", `${yearEnd}T23:59:59Z`),
    recurringTaskIds.length
      ? supabase
          .from("task_occurrences")
          .select("task_id, scheduled_date, status")
          .in("task_id", recurringTaskIds)
          .gte("scheduled_date", addDays(today, -(NUDGE_WINDOW_DAYS - 1)))
          .lte("scheduled_date", today)
      : Promise.resolve({ data: [] as { task_id: string; scheduled_date: string; status: string }[] }),
    supabase.from("tasks").select("id, title"),
    supabase.from("focus_sessions").select("task_id, duration_minutes, started_at, ended_at"),
  ]);

  const timeOfDayInsight = computeTimeOfDayInsight(allHistoryOccurrences ?? []);
  const dayOfWeekInsight = computeDayOfWeekInsight(allHistoryOccurrences ?? []);
  const hasAnyInsight = Boolean(timeOfDayInsight || dayOfWeekInsight);

  const decliningTasks = computeDecliningTasks(recurringTasks ?? [], recentOccurrences ?? [], today);
  const suggestedLabel = timeOfDayInsight?.strongest.label ?? null;
  const suggestedTime = suggestedLabel ? BUCKET_SUGGESTED_TIME[suggestedLabel] : null;

  const focusAccuracy = computeFocusAccuracy(focusSessions ?? [], allTasks ?? []);

  const heatmapDays = computeDailyHeatmap(
    (completionEvents ?? []).map((e) => e.completed_at.slice(0, 10)),
    yearStart,
    yearEnd
  );
  const heatmapSummary = computeHeatmapSummary(heatmapDays);

  const resolvedOccurrences = (allHistoryOccurrences ?? []).filter(
    (o) => o.status === "done" || o.status === "skipped"
  );
  const weeklyRates = computeWeeklyCompletionRate(resolvedOccurrences, RATE_WEEKS_BACK, today);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <AppHeader active="insights" />
      <h1 className="mt-5 text-xl font-semibold text-ink">Insights</h1>
      <p className="mb-6 text-sm text-muted">
        What your completion history actually says, not what you intended.
      </p>

      <DecliningTasksCard
        alerts={decliningTasks}
        suggestedTime={suggestedTime}
        suggestedLabel={suggestedLabel}
      />

      {timeOfDayInsight && <InsightCard title="Time of day" insight={timeOfDayInsight} />}
      {dayOfWeekInsight && <InsightCard title="Day of week" insight={dayOfWeekInsight} />}
      {!hasAnyInsight && process.env.NODE_ENV !== "production" && <SeedDemoButton />}

      <FocusAccuracyCard stats={focusAccuracy} />

      <div className="mb-6 rounded-2xl border border-line bg-surface p-4 shadow-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-sm text-ink">
            <span className="text-base font-semibold">{heatmapSummary.totalCompletions}</span>
            submissions {isPastYear ? `in ${parsedYear}` : "in the past one year"}
            <span title="Counts every completed task occurrence">
              <svg viewBox="0 0 14 14" fill="none" className="h-3.5 w-3.5 text-muted">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1" />
                <path d="M7 6.2v4M7 4.2v.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </span>
          </p>
          <div className="flex items-center gap-4 text-xs text-muted">
            <span>
              Total active days: <span className="font-semibold text-ink">{heatmapSummary.activeDays}</span>
            </span>
            <span>
              Max streak: <span className="font-semibold text-ink">{heatmapSummary.maxStreak}</span>
            </span>
            <YearSelect options={yearOptions} selected={selectedValue} />
          </div>
        </div>
        <CompletionHeatmap days={heatmapDays} />
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
        <p className="text-sm font-medium text-ink">Weekly completion rate</p>
        <p className="mb-3 text-xs text-muted">Last {RATE_WEEKS_BACK} weeks, done vs. skipped</p>
        <CompletionRateLineGraph weeks={weeklyRates} />
      </div>

      <a
        href="/api/calendar/export"
        className="mt-6 inline-block text-xs text-muted underline hover:text-ink"
      >
        Export upcoming schedule (.ics)
      </a>
    </main>
  );
}
