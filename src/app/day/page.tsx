import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addDays, formatDayLabel, todayISO } from "@/lib/dates";
import AppHeader from "@/components/app-header";
import DayList, { type DayListOccurrence } from "./day-list";
import NewOneOffTaskForm from "./new-oneoff-task-form";

export default async function DayPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { date: dateParam } = await searchParams;
  const date = dateParam ?? todayISO();

  const { data: oneOffTasks } = await supabase.from("tasks").select("id").eq("type", "one_off");
  const oneOffTaskIds = (oneOffTasks ?? []).map((t) => t.id);

  const { data: occurrences }: { data: DayListOccurrence[] | null } = oneOffTaskIds.length
    ? await supabase
        .from("task_occurrences")
        .select("*, tasks(id, title)")
        .eq("scheduled_date", date)
        .in("task_id", oneOffTaskIds)
        .order("scheduled_time", { ascending: true, nullsFirst: false })
    : { data: [] };

  // Bidirectional move provenance, same approach as the Matrix page.
  const movedAwayIds = (occurrences ?? []).filter((o) => o.status === "moved").map((o) => o.id);
  const movedInSourceIds = (occurrences ?? [])
    .filter((o) => o.moved_from_occurrence_id)
    .map((o) => o.moved_from_occurrence_id as string);

  const [{ data: movedToRows }, { data: movedFromRows }] = await Promise.all([
    movedAwayIds.length
      ? supabase
          .from("task_occurrences")
          .select("scheduled_date, moved_from_occurrence_id")
          .in("moved_from_occurrence_id", movedAwayIds)
      : Promise.resolve({ data: [] as { scheduled_date: string; moved_from_occurrence_id: string }[] }),
    movedInSourceIds.length
      ? supabase.from("task_occurrences").select("id, scheduled_date").in("id", movedInSourceIds)
      : Promise.resolve({ data: [] as { id: string; scheduled_date: string }[] }),
  ]);

  const movedToDateByOccurrenceId: Record<string, string> = {};
  for (const row of movedToRows ?? []) {
    if (row.moved_from_occurrence_id) {
      movedToDateByOccurrenceId[row.moved_from_occurrence_id] = row.scheduled_date;
    }
  }
  const movedFromDateById: Record<string, string> = {};
  for (const row of movedFromRows ?? []) {
    movedFromDateById[row.id] = row.scheduled_date;
  }
  const movedFromDateByOccurrenceId: Record<string, string> = {};
  for (const occurrence of occurrences ?? []) {
    if (occurrence.moved_from_occurrence_id && movedFromDateById[occurrence.moved_from_occurrence_id]) {
      movedFromDateByOccurrenceId[occurrence.id] = movedFromDateById[occurrence.moved_from_occurrence_id];
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <AppHeader active="day" />
      <h1 className="mt-5 text-xl font-semibold text-ink">Day</h1>
      <p className="mb-6 text-sm text-muted">
        One-off, time-bound tasks. Recurring tasks live in the Matrix.
      </p>

      <div className="mb-4 flex items-center justify-between text-sm">
        <Link href={`/day?date=${addDays(date, -1)}`} className="text-muted hover:text-ink">
          ← Previous day
        </Link>
        <span className="font-mono font-medium text-ink">{formatDayLabel(date)}</span>
        <Link href={`/day?date=${addDays(date, 1)}`} className="text-muted hover:text-ink">
          Next day →
        </Link>
      </div>

      <NewOneOffTaskForm date={date} />

      <DayList
        occurrences={occurrences ?? []}
        movedToDateByOccurrenceId={movedToDateByOccurrenceId}
        movedFromDateByOccurrenceId={movedFromDateByOccurrenceId}
      />
    </main>
  );
}
