import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { DayOfWeek, RecurrenceFrequency, TaskType } from "@/types/database";

// How far ahead recurring occurrences are materialized. Generating rows for
// an indefinite recurrence up front isn't viable — see docs/data-model.md.
const ROLLING_WINDOW_DAYS = 28;

const DAY_INDEX: Record<DayOfWeek, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

interface CreateTaskBody {
  title: string;
  type: TaskType;
  default_time?: string;
  default_duration_minutes?: number;
  project_id?: string;
  depends_on_task_id?: string;
  scheduled_date?: string; // required when type = "one_off"
  recurrence?: {
    frequency: RecurrenceFrequency;
    days_of_week: DayOfWeek[];
    start_date: string;
    end_date?: string;
  };
}

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function generateOccurrenceDates(rule: NonNullable<CreateTaskBody["recurrence"]>) {
  const start = new Date(`${rule.start_date}T00:00:00Z`);
  const explicitEnd = rule.end_date ? new Date(`${rule.end_date}T00:00:00Z`) : null;
  const windowEnd = new Date(start);
  windowEnd.setUTCDate(windowEnd.getUTCDate() + ROLLING_WINDOW_DAYS);
  const cutoff = explicitEnd && explicitEnd < windowEnd ? explicitEnd : windowEnd;

  const targetDays = new Set(rule.days_of_week.map((day) => DAY_INDEX[day]));
  const dates: string[] = [];
  for (const d = new Date(start); d <= cutoff; d.setUTCDate(d.getUTCDate() + 1)) {
    if (rule.frequency === "daily" || targetDays.has(d.getUTCDay())) {
      dates.push(toISODate(d));
    }
  }
  return dates;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("tasks")
    .select("*, recurrence_rules(*)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tasks: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as CreateTaskBody;

  if (!body.title || !body.type) {
    return NextResponse.json({ error: "title and type are required" }, { status: 400 });
  }
  if (body.type === "one_off" && !body.scheduled_date) {
    return NextResponse.json(
      { error: "scheduled_date is required for one_off tasks" },
      { status: 400 }
    );
  }
  if (body.type === "recurring" && !body.recurrence) {
    return NextResponse.json(
      { error: "recurrence is required for recurring tasks" },
      { status: 400 }
    );
  }

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      title: body.title,
      type: body.type,
      default_time: body.default_time ?? null,
      default_duration_minutes: body.default_duration_minutes ?? null,
      project_id: body.project_id ?? null,
      depends_on_task_id: body.depends_on_task_id ?? null,
    })
    .select()
    .single();

  if (taskError || !task) {
    return NextResponse.json(
      { error: taskError?.message ?? "Failed to create task" },
      { status: 500 }
    );
  }

  if (body.type === "recurring" && body.recurrence) {
    const { error: ruleError } = await supabase.from("recurrence_rules").insert({
      task_id: task.id,
      frequency: body.recurrence.frequency,
      days_of_week: body.recurrence.days_of_week,
      start_date: body.recurrence.start_date,
      end_date: body.recurrence.end_date ?? null,
    });
    if (ruleError) {
      return NextResponse.json({ error: ruleError.message }, { status: 500 });
    }

    const dates = generateOccurrenceDates(body.recurrence);
    const occurrences = dates.map((scheduled_date) => ({
      task_id: task.id,
      scheduled_date,
      scheduled_time: body.default_time ?? null,
      duration_minutes: body.default_duration_minutes ?? null,
    }));
    if (occurrences.length > 0) {
      const { error: occurrenceError } = await supabase
        .from("task_occurrences")
        .insert(occurrences);
      if (occurrenceError) {
        return NextResponse.json({ error: occurrenceError.message }, { status: 500 });
      }
    }
  } else if (body.type === "one_off" && body.scheduled_date) {
    const { error: occurrenceError } = await supabase.from("task_occurrences").insert({
      task_id: task.id,
      scheduled_date: body.scheduled_date,
      scheduled_time: body.default_time ?? null,
      duration_minutes: body.default_duration_minutes ?? null,
    });
    if (occurrenceError) {
      return NextResponse.json({ error: occurrenceError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ task }, { status: 201 });
}
