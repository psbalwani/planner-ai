import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/dates";
import AppHeader from "@/components/app-header";
import FocusTimer from "./focus-timer";
import type { FocusSession, Task } from "@/types/database";

interface SessionWithTask extends FocusSession {
  tasks: Pick<Task, "id" | "title"> | null;
}

// A session may be stopped early, so its actual focused time is whatever
// elapsed before it ended — not the planned duration_minutes.
function elapsedMinutes(startedAt: string, endedAt: string): number {
  return Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000);
}

export default async function FocusPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = todayISO();

  const [{ data: tasks }, { data: recentSessions }, { data: todaySessions }] = await Promise.all([
    supabase.from("tasks").select("id, title").order("title", { ascending: true }),
    supabase
      .from("focus_sessions")
      .select("*, tasks(id, title)")
      .order("started_at", { ascending: false })
      .limit(10),
    supabase
      .from("focus_sessions")
      .select("started_at, ended_at")
      .gte("started_at", `${today}T00:00:00Z`),
  ]);

  const sessionsToday = (todaySessions ?? []).length;
  const minutesToday = (todaySessions ?? []).reduce(
    (sum, s) => sum + (s.ended_at ? elapsedMinutes(s.started_at, s.ended_at) : 0),
    0
  );

  return (
    <main className="mx-auto max-w-2xl p-6">
      <AppHeader active="focus" />
      <h1 className="mt-5 text-xl font-semibold text-ink">Focus</h1>
      <p className="mb-6 text-sm text-muted">
        Pomodoro-style focus sessions, optionally tied to a task.
      </p>

      <div className="mb-6 flex gap-6 text-sm text-muted">
        <span>
          <span className="font-mono font-semibold text-ink">{sessionsToday}</span> sessions today
        </span>
        <span>
          <span className="font-mono font-semibold text-ink">{minutesToday}</span> min focused today
        </span>
      </div>

      <FocusTimer tasks={tasks ?? []} />

      {recentSessions && recentSessions.length > 0 && (
        <div className="mt-8">
          <p className="mb-2 text-sm font-medium text-ink">Recent sessions</p>
          <ul className="flex flex-col gap-1.5">
            {(recentSessions as SessionWithTask[]).map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-line bg-surface px-3 py-2 text-xs"
              >
                <span className="text-ink">{s.tasks?.title ?? "Untitled focus session"}</span>
                <span className="text-muted">
                  {s.ended_at ? `${elapsedMinutes(s.started_at, s.ended_at)} min` : "in progress"} ·{" "}
                  {s.completed ? "completed" : "stopped early"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
