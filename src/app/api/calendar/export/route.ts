import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addDays, todayISO } from "@/lib/dates";
import { buildIcs } from "@/lib/ics";

const EXPORT_DAYS_FORWARD = 90;

interface OccurrenceForExport {
  id: string;
  scheduled_date: string;
  scheduled_time: string | null;
  duration_minutes: number | null;
  tasks: { title: string } | null;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = todayISO();
  const endDate = addDays(today, EXPORT_DAYS_FORWARD);

  const { data, error } = await supabase
    .from("task_occurrences")
    .select("id, scheduled_date, scheduled_time, duration_minutes, tasks(title)")
    .eq("status", "pending")
    .gte("scheduled_date", today)
    .lte("scheduled_date", endDate)
    .order("scheduled_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const occurrences = data as unknown as OccurrenceForExport[] | null;

  const events = (occurrences ?? []).map((occurrence) => ({
    uid: occurrence.id,
    title: occurrence.tasks?.title ?? "Task",
    date: occurrence.scheduled_date,
    time: occurrence.scheduled_time,
    durationMinutes: occurrence.duration_minutes,
  }));

  const ics = buildIcs(events, new Date().toISOString());

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="planner-ai.ics"',
    },
  });
}
