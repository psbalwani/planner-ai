import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UPDATABLE_FIELDS = [
  "title",
  "default_time",
  "default_duration_minutes",
  "project_id",
  "depends_on_task_id",
];

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("tasks")
    .select("*, recurrence_rules(*), task_occurrences(*)")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ task: data });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const updates = await request.json();
  const patch = Object.fromEntries(
    Object.entries(updates).filter(([key]) => UPDATABLE_FIELDS.includes(key))
  );

  const { data, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Carry a time change onto not-yet-resolved occurrences so the new
  // schedule applies right away, without rewriting the historical record of
  // when already-completed/skipped occurrences were actually planned.
  if ("default_time" in patch) {
    const { error: occurrenceError } = await supabase
      .from("task_occurrences")
      .update({ scheduled_time: patch.default_time })
      .eq("task_id", id)
      .eq("status", "pending");
    if (occurrenceError) {
      return NextResponse.json({ error: occurrenceError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ task: data });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
