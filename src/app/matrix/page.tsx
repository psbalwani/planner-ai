import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addDays, startOfWeek, todayISO } from "@/lib/dates";
import { computeBestStreak, computeCurrentStreak } from "@/lib/streak";
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

  const [{ data: tasks }, { data: projects }, { data: allTasks }] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, default_time, depends_on_task_id")
      .eq("type", "recurring")
      .order("created_at", { ascending: true }),
    supabase.from("projects").select("id, name").order("created_at", { ascending: true }),
    supabase.from("tasks").select("id, title").order("created_at", { ascending: true }),
  ]);

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
  const bestStreaksByTask: Record<string, number> = {};
  for (const taskId of taskIds) {
    const history = (historyOccurrences ?? []).filter((o) => o.task_id === taskId);
    streaksByTask[taskId] = computeCurrentStreak(history, today);
    bestStreaksByTask[taskId] = computeBestStreak(history, today);
  }

  const occurrenceByTaskAndDate: Record<string, TaskOccurrence> = {};
  for (const occurrence of windowOccurrences ?? []) {
    occurrenceByTaskAndDate[`${occurrence.task_id}:${occurrence.scheduled_date}`] = occurrence;
  }

  const taskTitleById = new Map((allTasks ?? []).map((t) => [t.id, t.title]));
  const dependsOnTitleByTaskId: Record<string, string> = {};
  for (const task of tasks ?? []) {
    if (task.depends_on_task_id) {
      const title = taskTitleById.get(task.depends_on_task_id);
      if (title) dependsOnTitleByTaskId[task.id] = title;
    }
  }

  // Recurring tasks no longer support moving occurrences from the Matrix
  // (see project decision — Move only makes sense for one-off tasks in Day
  // view). This still resolves a destination date for any occurrence with a
  // legacy status of "moved" from before that change, so old data renders
  // sensibly instead of as a broken checkbox.
  const movedAwayIds = (windowOccurrences ?? [])
    .filter((o) => o.status === "moved")
    .map((o) => o.id);

  const { data: movedToRows } = movedAwayIds.length
    ? await supabase
        .from("task_occurrences")
        .select("scheduled_date, moved_from_occurrence_id")
        .in("moved_from_occurrence_id", movedAwayIds)
    : { data: [] as { scheduled_date: string; moved_from_occurrence_id: string }[] };

  const movedToDateByOccurrenceId: Record<string, string> = {};
  for (const row of movedToRows ?? []) {
    if (row.moved_from_occurrence_id) {
      movedToDateByOccurrenceId[row.moved_from_occurrence_id] = row.scheduled_date;
    }
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <AppHeader active="matrix" />
      <h1 className="mt-5 text-xl font-semibold text-ink">Matrix</h1>
      <p className="mb-6 text-sm text-muted">Recurring tasks. Check off a day, watch the streak.</p>

      <div className="mb-4 flex items-center justify-between text-sm">
        <Link href={`/matrix?start=${addDays(weekStart, -7)}`} className="text-muted hover:text-ink">
          ← Previous week
        </Link>
        <Link href={`/matrix?start=${addDays(weekStart, 7)}`} className="text-muted hover:text-ink">
          Next week →
        </Link>
      </div>

      <NewRecurringTaskForm projects={projects ?? []} otherTasks={allTasks ?? []} />

      <MatrixGrid
        tasks={tasks ?? []}
        days={days}
        occurrenceByTaskAndDate={occurrenceByTaskAndDate}
        streaksByTask={streaksByTask}
        bestStreaksByTask={bestStreaksByTask}
        dependsOnTitleByTaskId={dependsOnTitleByTaskId}
        movedToDateByOccurrenceId={movedToDateByOccurrenceId}
      />
    </main>
  );
}
