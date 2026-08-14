import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AddTaskForm from "./add-task-form";

// Placeholder for verifying auth + CRUD wiring end to end. The matrix and
// day-list views (docs/mvp-roadmap.md Phase 1) replace this.
export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, type")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold">Tasks</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Placeholder list for verifying auth + CRUD wiring. Matrix and day-list views land in Phase 1.
      </p>
      <AddTaskForm />
      <ul className="mt-6 flex flex-col gap-2">
        {tasks?.map((task) => (
          <li key={task.id} className="rounded border border-neutral-200 p-3">
            <span className="font-medium">{task.title}</span>{" "}
            <span className="text-sm text-neutral-500">({task.type})</span>
          </li>
        ))}
        {tasks?.length === 0 && <li className="text-sm text-neutral-500">No tasks yet.</li>}
      </ul>
    </main>
  );
}
