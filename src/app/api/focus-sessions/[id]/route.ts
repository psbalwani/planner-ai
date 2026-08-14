import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface EndSessionBody {
  completed: boolean;
}

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

  const body = (await request.json()) as EndSessionBody;

  const { data, error } = await supabase
    .from("focus_sessions")
    .update({ ended_at: new Date().toISOString(), completed: body.completed })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: data });
}
