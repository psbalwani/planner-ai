import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addDays, todayISO } from "@/lib/dates";

// Testing-only: backfills a few weeks of synthetic completion history so the
// time-of-day insight (src/lib/insight.ts) has enough signal to compute
// against without waiting for real usage. Demo tasks are named and titled
// so they're obvious to delete from the Matrix once you're done with them —
// deleting a task cascades to its occurrences and completion_events.
const DEMO_TASKS = [
  { title: "Morning workout (demo)", default_time: "06:00", targetRate: 0.25 },
  { title: "Evening workout (demo)", default_time: "20:00", targetRate: 0.85 },
];

const HISTORY_DAYS_BACK = 35;
const HISTORY_DAYS_FORWARD = 6;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = todayISO();
  const startDate = addDays(today, -HISTORY_DAYS_BACK);
  const endDate = addDays(today, HISTORY_DAYS_FORWARD);

  const created: string[] = [];

  for (const demo of DEMO_TASKS) {
    const { data: existing } = await supabase
      .from("tasks")
      .select("id")
      .eq("title", demo.title)
      .maybeSingle();
    if (existing) continue;

    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .insert({
        user_id: user.id,
        title: demo.title,
        type: "recurring",
        default_time: demo.default_time,
      })
      .select()
      .single();
    if (taskError || !task) {
      return NextResponse.json(
        { error: taskError?.message ?? "Failed to create demo task" },
        { status: 500 }
      );
    }

    const { error: ruleError } = await supabase.from("recurrence_rules").insert({
      task_id: task.id,
      frequency: "daily",
      days_of_week: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
      start_date: startDate,
    });
    if (ruleError) return NextResponse.json({ error: ruleError.message }, { status: 500 });

    const start = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDate}T00:00:00Z`);
    const occurrenceRows: {
      task_id: string;
      scheduled_date: string;
      scheduled_time: string;
      status: string;
    }[] = [];
    for (const d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      const scheduled_date = d.toISOString().slice(0, 10);
      const isFuture = scheduled_date > today;
      const status = isFuture ? "pending" : Math.random() < demo.targetRate ? "done" : "skipped";
      occurrenceRows.push({
        task_id: task.id,
        scheduled_date,
        scheduled_time: demo.default_time,
        status,
      });
    }

    const { data: insertedOccurrences, error: occurrenceError } = await supabase
      .from("task_occurrences")
      .insert(occurrenceRows)
      .select("id, status");
    if (occurrenceError) {
      return NextResponse.json({ error: occurrenceError.message }, { status: 500 });
    }

    const completionRows = (insertedOccurrences ?? [])
      .filter((o) => o.status === "done")
      .map((o) => ({ occurrence_id: o.id }));
    if (completionRows.length > 0) {
      const { error: eventError } = await supabase.from("completion_events").insert(completionRows);
      if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 });
    }

    created.push(demo.title);
  }

  return NextResponse.json({ created });
}
