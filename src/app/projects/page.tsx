import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/app-header";
import NewGoalForm from "./new-goal-form";
import NewProjectForm from "./new-project-form";
import DeleteEntityButton from "./delete-entity-button";
import type { Goal, Project, Task } from "@/types/database";

type TaskSlice = Pick<Task, "id" | "title" | "project_id">;

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: goals }, { data: projects }, { data: tasks }] = await Promise.all([
    supabase.from("goals").select("*").order("created_at", { ascending: true }),
    supabase.from("projects").select("*").order("created_at", { ascending: true }),
    supabase
      .from("tasks")
      .select("id, title, project_id")
      .order("created_at", { ascending: true }),
  ]);

  const tasksByProject = new Map<string, TaskSlice[]>();
  for (const task of (tasks ?? []) as TaskSlice[]) {
    if (!task.project_id) continue;
    const list = tasksByProject.get(task.project_id) ?? [];
    list.push(task);
    tasksByProject.set(task.project_id, list);
  }

  const projectsByGoal = new Map<string, Project[]>();
  const unassignedProjects: Project[] = [];
  for (const project of (projects ?? []) as Project[]) {
    if (project.goal_id) {
      const list = projectsByGoal.get(project.goal_id) ?? [];
      list.push(project);
      projectsByGoal.set(project.goal_id, list);
    } else {
      unassignedProjects.push(project);
    }
  }

  function renderProject(project: Project) {
    const projectTasks = tasksByProject.get(project.id) ?? [];
    return (
      <li key={project.id} className="rounded-xl border border-line bg-bg p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-ink">{project.name}</span>
          <DeleteEntityButton
            endpoint={`/api/projects/${project.id}`}
            confirmMessage={`Delete project "${project.name}"? Its tasks are kept, just unassigned.`}
          />
        </div>
        {projectTasks.length > 0 ? (
          <ul className="mt-1.5 flex flex-col gap-0.5">
            {projectTasks.map((task) => (
              <li key={task.id} className="text-xs text-muted">
                {task.title}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-xs text-muted">No tasks yet.</p>
        )}
      </li>
    );
  }

  const hasAnything = (goals ?? []).length > 0 || (projects ?? []).length > 0;

  return (
    <main className="mx-auto max-w-4xl p-6">
      <AppHeader active="projects" />
      <h1 className="mt-5 text-xl font-semibold text-ink">Projects</h1>
      <p className="mb-6 text-sm text-muted">Group tasks under projects, and projects under goals.</p>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <NewGoalForm />
        <NewProjectForm goals={(goals ?? []).map((g) => ({ id: g.id, name: g.name }))} />
      </div>

      {!hasAnything ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center">
          <p className="text-sm text-ink">No goals or projects yet.</p>
          <p className="mt-1 text-xs text-muted">
            Add one above, then assign tasks to it when creating them in Matrix or Day.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {(goals ?? []).map((goal: Goal) => (
            <div key={goal.id} className="rounded-2xl border border-line bg-surface p-4 shadow-card">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-ink">{goal.name}</p>
                  {goal.target_date && <p className="text-xs text-muted">Target: {goal.target_date}</p>}
                </div>
                <DeleteEntityButton
                  endpoint={`/api/goals/${goal.id}`}
                  confirmMessage={`Delete goal "${goal.name}"? Its projects are kept, just unassigned.`}
                />
              </div>
              {(projectsByGoal.get(goal.id) ?? []).length > 0 ? (
                <ul className="mt-3 flex flex-col gap-2">
                  {(projectsByGoal.get(goal.id) ?? []).map(renderProject)}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-muted">No projects under this goal yet.</p>
              )}
            </div>
          ))}

          {unassignedProjects.length > 0 && (
            <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
              <p className="text-sm font-medium text-ink">Projects without a goal</p>
              <ul className="mt-3 flex flex-col gap-2">{unassignedProjects.map(renderProject)}</ul>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
