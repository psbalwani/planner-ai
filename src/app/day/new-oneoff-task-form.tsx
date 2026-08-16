"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiFetch, toErrorMessage } from "@/lib/api";
import { useToast } from "@/components/toast-provider";

interface NewOneOffTaskFormProps {
  date: string;
  projects: { id: string; name: string }[];
  otherTasks: { id: string; title: string }[];
}

export default function NewOneOffTaskForm({ date, projects, otherTasks }: NewOneOffTaskFormProps) {
  const router = useRouter();
  const showError = useToast();
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [projectId, setProjectId] = useState("");
  const [dependsOnTaskId, setDependsOnTaskId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await apiFetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          type: "one_off",
          scheduled_date: date,
          default_time: time || undefined,
          project_id: projectId || undefined,
          depends_on_task_id: dependsOnTaskId || undefined,
        }),
      });
      setTitle("");
      setTime("");
      setProjectId("");
      setDependsOnTaskId("");
      router.refresh();
    } catch (err) {
      showError(toErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-2 rounded-2xl border border-line bg-surface p-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New one-off task for this day"
          className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted"
        />
        <div className="flex gap-2">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            title="Time (optional)"
            className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-2 py-2 text-sm text-ink sm:flex-none"
          />
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="shrink-0 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>
      {(projects.length > 0 || otherTasks.length > 0) && (
        <div className="flex flex-col gap-2 sm:flex-row">
          {projects.length > 0 && (
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
            >
              <option value="">No project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          )}
          {otherTasks.length > 0 && (
            <select
              value={dependsOnTaskId}
              onChange={(e) => setDependsOnTaskId(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
            >
              <option value="">No dependency</option>
              {otherTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  Depends on: {task.title}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </form>
  );
}
