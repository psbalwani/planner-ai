import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface CreateSessionBody {
  task_id?: string;
  duration_minutes: number;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as CreateSessionBody;
  if (!body.duration_minutes) {
    return NextResponse.json({ error: "duration_minutes is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("focus_sessions")
    .insert({
      user_id: user.id,
      task_id: body.task_id ?? null,
      duration_minutes: body.duration_minutes,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: data }, { status: 201 });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("focus_sessions")
    .select("*, tasks(id, title)")
    .order("started_at", { ascending: false })
    .limit(10);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sessions: data });
}
