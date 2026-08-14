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

  return (
    <main className="mx-auto max-w-2xl p-6">
      <AppHeader active="day" />
      <h1 className="mt-4 text-xl font-semibold">Day</h1>
      <p className="mb-6 text-sm text-neutral-500">
        One-off, time-bound tasks. Recurring tasks live in the Matrix.
      </p>

      <div className="mb-4 flex items-center justify-between text-sm">
        <Link href={`/day?date=${addDays(date, -1)}`} className="text-neutral-500 hover:text-neutral-900">
          ← Previous day
        </Link>
        <span className="font-medium">{formatDayLabel(date)}</span>
        <Link href={`/day?date=${addDays(date, 1)}`} className="text-neutral-500 hover:text-neutral-900">
          Next day →
        </Link>
      </div>

      <NewOneOffTaskForm date={date} />

      <DayList occurrences={occurrences ?? []} />
    </main>
  );
}
