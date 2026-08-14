import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Action =
  | { action: "complete"; note?: string }
  | { action: "skip" }
  | { action: "move"; new_date: string }
  | { action: "reopen" };

// Completion writes an append-only CompletionEvent (the ground truth for
// future adaptive-planning features) and denormalizes status onto the
// occurrence. Move creates a new occurrence pointing back at the original via
// moved_from_occurrence_id instead of mutating scheduled_date in place —
// this is what makes "task got moved" a fact the app can query later, per
// docs/data-model.md.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as Action;

  const { data: occurrence, error: fetchError } = await supabase
    .from("task_occurrences")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !occurrence) {
    return NextResponse.json({ error: fetchError?.message ?? "Not found" }, { status: 404 });
  }

  if (body.action === "complete") {
    const { error: eventError } = await supabase
      .from("completion_events")
      .insert({ occurrence_id: occurrence.id, note: body.note ?? null });
    if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 });

    const { data, error } = await supabase
      .from("task_occurrences")
      .update({ status: "done" })
      .eq("id", occurrence.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ occurrence: data });
  }

  if (body.action === "skip") {
    const { data, error } = await supabase
      .from("task_occurrences")
      .update({ status: "skipped" })
      .eq("id", occurrence.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ occurrence: data });
  }

  if (body.action === "reopen") {
    // Undoes a mistaken complete/skip. Deletes any completion_events tied to
    // this occurrence too — leaving them would corrupt the behavioral log
    // that adaptive planning depends on (docs/prd.md's non-negotiable
    // principle), since a "done" event would remain for an occurrence that's
    // actually pending again.
    const { error: eventError } = await supabase
      .from("completion_events")
      .delete()
      .eq("occurrence_id", occurrence.id);
    if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 });

    const { data, error } = await supabase
      .from("task_occurrences")
      .update({ status: "pending" })
      .eq("id", occurrence.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ occurrence: data });
  }

  if (body.action === "move") {
    const { data: moved, error: updateError } = await supabase
      .from("task_occurrences")
      .update({ status: "moved" })
      .eq("id", occurrence.id)
      .select()
      .single();
    if (updateError || !moved) {
      return NextResponse.json({ error: updateError?.message ?? "Move failed" }, { status: 500 });
    }

    const { data: created, error: insertError } = await supabase
      .from("task_occurrences")
      .insert({
        task_id: occurrence.task_id,
        scheduled_date: body.new_date,
        scheduled_time: occurrence.scheduled_time,
        duration_minutes: occurrence.duration_minutes,
        moved_from_occurrence_id: moved.id,
      })
      .select()
      .single();
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

    return NextResponse.json({ occurrence: created });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
