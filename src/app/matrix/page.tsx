import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addDays, startOfWeek, todayISO } from "@/lib/dates";
import { computeCurrentStreak } from "@/lib/streak";
import AppHeader from "@/components/app-header";
import MatrixGrid from "./matrix-grid";
import NewRecurringTaskForm from "./new-recurring-task-form";
import type { TaskOccurrence } from "@/types/database";

const WEEK_LENGTH = 7;

export default async function MatrixPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { start: startParam } = await searchParams;
  const weekStart = startParam ?? startOfWeek(todayISO());
  const days = Array.from({ length: WEEK_LENGTH }, (_, i) => addDays(weekStart, i));
  const weekEnd = days[days.length - 1];

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title")
    .eq("type", "recurring")
    .order("created_at", { ascending: true });

  const taskIds = (tasks ?? []).map((t) => t.id);
  const today = todayISO();

  const [{ data: windowOccurrences }, { data: historyOccurrences }] = await Promise.all([
    taskIds.length
      ? supabase
          .from("task_occurrences")
          .select("*")
          .in("task_id", taskIds)
          .gte("scheduled_date", weekStart)
          .lte("scheduled_date", weekEnd)
      : Promise.resolve({ data: [] as TaskOccurrence[], error: null }),
    taskIds.length
      ? supabase
          .from("task_occurrences")
          .select("task_id, scheduled_date, status")
          .in("task_id", taskIds)
          .lte("scheduled_date", today)
      : Promise.resolve({
          data: [] as { task_id: string; scheduled_date: string; status: string }[],
          error: null,
        }),
  ]);

  const streaksByTask: Record<string, number> = {};
  for (const taskId of taskIds) {
    const history = (historyOccurrences ?? []).filter((o) => o.task_id === taskId);
    streaksByTask[taskId] = computeCurrentStreak(history, today);
  }

  const occurrenceByTaskAndDate: Record<string, TaskOccurrence> = {};
  for (const occurrence of windowOccurrences ?? []) {
    occurrenceByTaskAndDate[`${occurrence.task_id}:${occurrence.scheduled_date}`] = occurrence;
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <AppHeader active="matrix" />
      <h1 className="mt-4 text-xl font-semibold">Matrix</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Recurring tasks. Check off a day, watch the streak.
      </p>

      <div className="mb-4 flex items-center justify-between text-sm">
        <Link href={`/matrix?start=${addDays(weekStart, -7)}`} className="text-neutral-500 hover:text-neutral-900">
          ← Previous week
        </Link>
        <Link href={`/matrix?start=${addDays(weekStart, 7)}`} className="text-neutral-500 hover:text-neutral-900">
          Next week →
        </Link>
      </div>

      <NewRecurringTaskForm />

      <MatrixGrid
        tasks={tasks ?? []}
        days={days}
        occurrenceByTaskAndDate={occurrenceByTaskAndDate}
        streaksByTask={streaksByTask}
      />
    </main>
  );
}
