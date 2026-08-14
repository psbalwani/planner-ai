import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/dates";
import { computeTimeOfDayInsight } from "@/lib/insight";
import { computeDailyHeatmap, computeWeeklyCompletionRate } from "@/lib/stats";
import AppHeader from "@/components/app-header";
import InsightCard from "./insight-card";
import SeedDemoButton from "./seed-demo-button";
import CompletionHeatmap from "./heatmap";
import CompletionRateLineGraph from "./line-graph";

const HEATMAP_DAYS_BACK = 98; // 14 weeks
const RATE_WEEKS_BACK = 10;

export default async function InsightsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = todayISO();

  const [{ data: allHistoryOccurrences }, { data: completionEvents }] = await Promise.all([
    supabase
      .from("task_occurrences")
      .select("scheduled_date, scheduled_time, status")
      .lte("scheduled_date", today),
    supabase.from("completion_events").select("completed_at"),
  ]);

  const insight = computeTimeOfDayInsight(allHistoryOccurrences ?? []);

  const heatmapDays = computeDailyHeatmap(
    (completionEvents ?? []).map((e) => e.completed_at.slice(0, 10)),
    HEATMAP_DAYS_BACK
  );

  const resolvedOccurrences = (allHistoryOccurrences ?? []).filter(
    (o) => o.status === "done" || o.status === "skipped"
  );
  const weeklyRates = computeWeeklyCompletionRate(resolvedOccurrences, RATE_WEEKS_BACK);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <AppHeader active="insights" />
      <h1 className="mt-5 text-xl font-semibold text-ink">Insights</h1>
      <p className="mb-6 text-sm text-muted">
        What your completion history actually says, not what you intended.
      </p>

      {insight ? (
        <InsightCard insight={insight} />
      ) : process.env.NODE_ENV !== "production" ? (
        <SeedDemoButton />
      ) : null}

      <div className="mb-6 rounded-2xl border border-line bg-surface p-4 shadow-card">
        <p className="text-sm font-medium text-ink">Completion activity</p>
        <p className="mb-3 text-xs text-muted">Last {HEATMAP_DAYS_BACK} days</p>
        <CompletionHeatmap days={heatmapDays} />
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
        <p className="text-sm font-medium text-ink">Weekly completion rate</p>
        <p className="mb-3 text-xs text-muted">Last {RATE_WEEKS_BACK} weeks, done vs. skipped</p>
        <CompletionRateLineGraph weeks={weeklyRates} />
      </div>
    </main>
  );
}
