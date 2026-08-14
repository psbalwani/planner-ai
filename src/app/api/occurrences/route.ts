import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  let query = supabase
    .from("task_occurrences")
    .select("*, tasks(id, title, type)")
    .order("scheduled_date", { ascending: true });

  if (start) query = query.gte("scheduled_date", start);
  if (end) query = query.lte("scheduled_date", end);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ occurrences: data });
}
