import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addDays, todayISO } from "@/lib/dates";
import { computeDayOfWeekInsight, computeTimeOfDayInsight } from "@/lib/insight";
import { computeDailyHeatmap, computeWeeklyCompletionRate } from "@/lib/stats";
import { computeDecliningTasks } from "@/lib/nudges";
import AppHeader from "@/components/app-header";
import InsightCard from "./insight-card";
import SeedDemoButton from "./seed-demo-button";
import CompletionHeatmap from "./heatmap";
import CompletionRateLineGraph from "./line-graph";
import DecliningTasksCard from "./declining-card";

const HEATMAP_DAYS_BACK = 98; // 14 weeks
const RATE_WEEKS_BACK = 10;
const NUDGE_WINDOW_DAYS = 28; // two 14-day comparison windows

export default async function InsightsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = todayISO();

  const { data: recurringTasks } = await supabase
    .from("tasks")
    .select("id, title")
    .eq("type", "recurring");
  const recurringTaskIds = (recurringTasks ?? []).map((t) => t.id);

  const [{ data: allHistoryOccurrences }, { data: completionEvents }, { data: recentOccurrences }] =
    await Promise.all([
      supabase
        .from("task_occurrences")
        .select("scheduled_date, scheduled_time, status")
        .lte("scheduled_date", today),
      supabase.from("completion_events").select("completed_at"),
      recurringTaskIds.length
        ? supabase
            .from("task_occurrences")
            .select("task_id, scheduled_date, status")
            .in("task_id", recurringTaskIds)
            .gte("scheduled_date", addDays(today, -(NUDGE_WINDOW_DAYS - 1)))
            .lte("scheduled_date", today)
        : Promise.resolve({ data: [] as { task_id: string; scheduled_date: string; status: string }[] }),
    ]);

  const timeOfDayInsight = computeTimeOfDayInsight(allHistoryOccurrences ?? []);
  const dayOfWeekInsight = computeDayOfWeekInsight(allHistoryOccurrences ?? []);
  const hasAnyInsight = Boolean(timeOfDayInsight || dayOfWeekInsight);

  const decliningTasks = computeDecliningTasks(recurringTasks ?? [], recentOccurrences ?? [], today);

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

      <DecliningTasksCard alerts={decliningTasks} />

      {timeOfDayInsight && <InsightCard title="Time of day" insight={timeOfDayInsight} />}
      {dayOfWeekInsight && <InsightCard title="Day of week" insight={dayOfWeekInsight} />}
      {!hasAnyInsight && process.env.NODE_ENV !== "production" && <SeedDemoButton />}

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
